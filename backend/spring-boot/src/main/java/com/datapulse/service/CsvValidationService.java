package com.datapulse.service;

import com.datapulse.api.ApiDtos;
import com.datapulse.api.ApiException;
import com.datapulse.domain.DatasetEntity;
import com.datapulse.domain.DatasetFieldEntity;
import com.datapulse.domain.QualityIssueEntity;
import com.datapulse.domain.ValidationRuleEntity;
import com.datapulse.domain.ValidationRunEntity;
import com.datapulse.repository.DatasetFieldRepository;
import com.datapulse.repository.QualityIssueRepository;
import com.datapulse.repository.QualityScoreRepository;
import com.datapulse.repository.ValidationRuleRepository;
import com.datapulse.repository.ValidationRunRepository;
import jakarta.persistence.EntityManager;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class CsvValidationService {
    private static final long MAX_BYTES = 5L * 1024 * 1024;
    private static final int MAX_ROWS = 5000;
    private static final Pattern EMAIL = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);

    private final DatasetService datasetService;
    private final DatasetFieldRepository fields;
    private final ValidationRuleRepository rules;
    private final ValidationRunRepository runs;
    private final QualityIssueRepository issues;
    private final QualityScoreRepository scores;
    private final JdbcTemplate jdbcTemplate;
    private final EntityManager entityManager;
    private final RunQueryService runQueryService;

    public CsvValidationService(DatasetService datasetService, DatasetFieldRepository fields,
                                ValidationRuleRepository rules, ValidationRunRepository runs,
                                QualityIssueRepository issues, QualityScoreRepository scores,
                                JdbcTemplate jdbcTemplate, EntityManager entityManager,
                                RunQueryService runQueryService) {
        this.datasetService = datasetService;
        this.fields = fields;
        this.rules = rules;
        this.runs = runs;
        this.issues = issues;
        this.scores = scores;
        this.jdbcTemplate = jdbcTemplate;
        this.entityManager = entityManager;
        this.runQueryService = runQueryService;
    }

    @Transactional
    public ApiDtos.RunView run(long datasetId, long userId, boolean admin, MultipartFile file) {
        if (file == null || file.isEmpty()) throw ApiException.badRequest("Choose a CSV file to run validation.");
        if (file.getSize() > MAX_BYTES) throw ApiException.badRequest("CSV files must be 5 MB or smaller.");
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase(Locale.ROOT).endsWith(".csv")) {
            throw ApiException.badRequest("Upload a file with the .csv extension.");
        }

        DatasetEntity dataset = datasetService.accessibleDataset(datasetId, userId, admin);
        if (!"ACTIVE".equals(dataset.getStatus())) {
            throw ApiException.badRequest("Archived datasets cannot start new validation runs.");
        }
        List<DatasetFieldEntity> datasetFields = fields.findAllByDataset_DatasetIdAndActiveTrueOrderByFieldIdAsc(datasetId);
        if (datasetFields.isEmpty()) throw ApiException.badRequest("Add at least one dataset field before running validation.");
        List<ValidationRuleEntity> activeRules = rules.findAllByField_Dataset_DatasetIdAndField_ActiveTrueAndActiveTrueOrderByRuleIdAsc(datasetId);
        if (activeRules.isEmpty()) throw ApiException.badRequest("Add at least one active validation rule before running validation.");

        ValidationRunEntity run = new ValidationRunEntity();
        run.setDataset(dataset);
        run.setStartedBy(dataset.getOwner().getUserId().equals(userId) ? dataset.getOwner() : findUser(userId));
        run.setStatus("RUNNING");
        run.setTotalRows(0);
        run.setIssueCount(0);
        run = runs.saveAndFlush(run);

        final ValidationRunEntity currentRun = run;
        setAuditActor(userId);
        List<QualityIssueEntity> foundIssues = new ArrayList<>();
        int rowCount;
        try (InputStreamReader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setSkipHeaderRecord(true)
                     .setIgnoreEmptyLines(true)
                     .setTrim(false)
                     .get()
                     .parse(reader)) {
            Map<String, String> headers = normalizedHeaders(parser.getHeaderMap().keySet());
            for (DatasetFieldEntity field : datasetFields) {
                String header = headers.get(field.getFieldName().toLowerCase(Locale.ROOT));
                if (header == null) throw ApiException.badRequest("CSV is missing the configured column: " + field.getFieldName());
            }
            Map<Long, Set<String>> uniqueValues = new HashMap<>();
            rowCount = 0;
            for (CSVRecord record : parser) {
                rowCount++;
                if (rowCount > MAX_ROWS) throw ApiException.badRequest("CSV files are limited to 5,000 data rows for this project demo.");
                for (ValidationRuleEntity rule : activeRules) {
                    DatasetFieldEntity field = rule.getField();
                    String header = headers.get(field.getFieldName().toLowerCase(Locale.ROOT));
                    String value = header != null && record.isMapped(header) && record.isSet(header) ? record.get(header).trim() : "";
                    String failure = failureMessage(rule, value, uniqueValues);
                    if (failure != null) {
                        QualityIssueEntity issue = new QualityIssueEntity();
                        issue.setRun(currentRun);
                        issue.setRule(rule);
                        issue.setRowNumber((int) record.getRecordNumber());
                        issue.setSeverity(rule.getSeverity());
                        issue.setMessage(failure);
                        issue.setObservedValue(value.isBlank() ? null : value);
                        foundIssues.add(issue);
                    }
                }
            }
        } catch (IOException | IllegalStateException ex) {
            throw ApiException.badRequest("Could not read the CSV. Check that it has one header row and valid CSV formatting.");
        }

        if (!foundIssues.isEmpty()) issues.saveAll(foundIssues);
        currentRun.setTotalRows(rowCount);
        currentRun.setIssueCount(foundIssues.size());
        currentRun.setStatus("COMPLETED");
        currentRun.setCompletedAt(OffsetDateTime.now());
        runs.save(currentRun);
        entityManager.flush();
        jdbcTemplate.update("CALL recalculate_quality_score(?)", currentRun.getRunId());
        entityManager.clear();
        return runQueryService.get(currentRun.getRunId(), userId, admin);
    }

    private com.datapulse.domain.UserEntity findUser(long userId) {
        return entityManager.getReference(com.datapulse.domain.UserEntity.class, userId);
    }

    private void setAuditActor(long userId) {
        jdbcTemplate.queryForObject("select set_config('app.user_id', ?, true)", String.class, Long.toString(userId));
    }

    private Map<String, String> normalizedHeaders(Set<String> rawHeaders) {
        if (rawHeaders == null || rawHeaders.isEmpty()) throw ApiException.badRequest("CSV must contain a header row.");
        Map<String, String> normalized = new HashMap<>();
        for (String header : rawHeaders) {
            if (header == null || header.isBlank()) throw ApiException.badRequest("CSV headers cannot be blank.");
            String key = header.trim().toLowerCase(Locale.ROOT);
            if (normalized.putIfAbsent(key, header) != null) throw ApiException.badRequest("CSV headers must be unique, ignoring case.");
        }
        return normalized;
    }

    private String failureMessage(ValidationRuleEntity rule, String value, Map<Long, Set<String>> uniqueValues) {
        return switch (rule.getRuleType()) {
            case "REQUIRED" -> value.isBlank() ? "A value is required." : null;
            case "UNIQUE" -> {
                if (value.isBlank()) yield null;
                Set<String> seen = uniqueValues.computeIfAbsent(rule.getRuleId(), ignored -> new HashSet<>());
                yield seen.add(value.toLowerCase(Locale.ROOT)) ? null : "This value duplicates an earlier row.";
            }
            case "EMAIL" -> value.isBlank() || EMAIL.matcher(value).matches() ? null : "Enter a valid email address.";
            case "RANGE" -> rangeFailure(rule, value);
            case "TYPE" -> typeFailure(rule.getField().getDataType(), value);
            default -> "This rule type is not supported by the validation engine.";
        };
    }

    private String typeFailure(String dataType, String value) {
        if (value.isBlank()) return null;
        boolean valid;
        try {
            valid = switch (dataType) {
                case "TEXT" -> true;
                case "INTEGER" -> value.matches("[+-]?\\d+");
                case "DECIMAL" -> { new BigDecimal(value); yield true; }
                case "DATE" -> { LocalDate.parse(value); yield true; }
                case "BOOLEAN" -> value.equalsIgnoreCase("true") || value.equalsIgnoreCase("false");
                default -> false;
            };
        } catch (RuntimeException ex) {
            valid = false;
        }
        return valid ? null : "Value is not a valid " + dataType.toLowerCase(Locale.ROOT) + ".";
    }

    private String rangeFailure(ValidationRuleEntity rule, String value) {
        if (value.isBlank()) return null;
        try {
            BigDecimal actual = new BigDecimal(value);
            BigDecimal min = new BigDecimal(rule.getRuleConfig().get("min").toString());
            BigDecimal max = new BigDecimal(rule.getRuleConfig().get("max").toString());
            return actual.compareTo(min) < 0 || actual.compareTo(max) > 0
                    ? "Value must be between " + min.stripTrailingZeros().toPlainString() + " and " + max.stripTrailingZeros().toPlainString() + "."
                    : null;
        } catch (RuntimeException ex) {
            return "Value must be a number within the configured range.";
        }
    }
}
