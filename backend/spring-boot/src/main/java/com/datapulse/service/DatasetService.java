package com.datapulse.service;

import com.datapulse.api.ApiDtos;
import com.datapulse.api.ApiException;
import com.datapulse.domain.DatasetEntity;
import com.datapulse.domain.DatasetFieldEntity;
import com.datapulse.domain.UserEntity;
import com.datapulse.domain.ValidationRuleEntity;
import com.datapulse.repository.DatasetFieldRepository;
import com.datapulse.repository.DatasetRepository;
import com.datapulse.repository.UserRepository;
import com.datapulse.repository.ValidationRuleRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class DatasetService {
    private static final List<String> DATA_TYPES = List.of("TEXT", "INTEGER", "DECIMAL", "DATE", "BOOLEAN");
    private static final List<String> RULE_TYPES = List.of("REQUIRED", "UNIQUE", "EMAIL", "RANGE", "TYPE");
    private static final List<String> SEVERITIES = List.of("LOW", "MEDIUM", "HIGH");

    private final DatasetRepository datasets;
    private final DatasetFieldRepository fields;
    private final ValidationRuleRepository rules;
    private final UserRepository users;
    public DatasetService(DatasetRepository datasets, DatasetFieldRepository fields,
                          ValidationRuleRepository rules, UserRepository users) {
        this.datasets = datasets;
        this.fields = fields;
        this.rules = rules;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public ApiDtos.PageView<ApiDtos.DatasetView> list(long userId, boolean admin, int page, int size,
                                                       String query, String status) {
        validatePage(page, size);
        String normalizedStatus = normalizeStatus(status);
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<DatasetEntity> result = admin
                ? datasets.searchAll(cleanQuery(query), normalizedStatus, pageRequest)
                : datasets.searchOwned(userId, cleanQuery(query), normalizedStatus, pageRequest);
        return new ApiDtos.PageView<>(result.getContent().stream().map(this::toView).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional
    public ApiDtos.DatasetView create(long ownerId, ApiDtos.DatasetRequest request) {
        UserEntity owner = users.findById(ownerId).orElseThrow(() -> ApiException.unauthorized("User account was not found."));
        DatasetEntity dataset = new DatasetEntity();
        dataset.setOwner(owner);
        dataset.setDatasetName(request.datasetName().trim());
        dataset.setDescription(trimToNull(request.description()));
        dataset.setStatus("ACTIVE");
        return toView(datasets.save(dataset));
    }

    @Transactional(readOnly = true)
    public ApiDtos.DatasetView get(long datasetId, long userId, boolean admin) {
        return toView(accessibleDataset(datasetId, userId, admin));
    }

    @Transactional
    public ApiDtos.DatasetView update(long datasetId, long userId, boolean admin, ApiDtos.DatasetRequest request) {
        DatasetEntity dataset = accessibleDataset(datasetId, userId, admin);
        dataset.setDatasetName(request.datasetName().trim());
        dataset.setDescription(trimToNull(request.description()));
        return toView(dataset);
    }

    @Transactional
    public void archive(long datasetId, long userId, boolean admin) {
        DatasetEntity dataset = accessibleDataset(datasetId, userId, admin);
        dataset.setStatus("ARCHIVED");
    }

    @Transactional(readOnly = true)
    public List<ApiDtos.FieldView> listFields(long datasetId, long userId, boolean admin) {
        accessibleDataset(datasetId, userId, admin);
        return fields.findAllByDataset_DatasetIdOrderByFieldIdAsc(datasetId).stream().map(this::toView).toList();
    }

    @Transactional
    public ApiDtos.FieldView addField(long datasetId, long userId, boolean admin, ApiDtos.FieldRequest request) {
        DatasetEntity dataset = accessibleDataset(datasetId, userId, admin);
        requireActive(dataset);
        String dataType = request.dataType().trim().toUpperCase(Locale.ROOT);
        if (!DATA_TYPES.contains(dataType)) throw ApiException.badRequest("Unsupported field data type.");
        DatasetFieldEntity field = new DatasetFieldEntity();
        field.setDataset(dataset);
        field.setFieldName(request.fieldName().trim());
        field.setDataType(dataType);
        return toView(fields.save(field));
    }

    @Transactional
    public ApiDtos.FieldView updateField(long fieldId, long userId, boolean admin, ApiDtos.FieldRequest request) {
        DatasetFieldEntity field = fieldById(fieldId);
        requireActive(accessibleDataset(field.getDataset().getDatasetId(), userId, admin));
        if (!field.isActive()) throw ApiException.badRequest("Archived fields cannot be edited.");
        String dataType = request.dataType().trim().toUpperCase(Locale.ROOT);
        if (!DATA_TYPES.contains(dataType)) throw ApiException.badRequest("Unsupported field data type.");
        field.setFieldName(request.fieldName().trim());
        field.setDataType(dataType);
        return toView(field);
    }

    @Transactional
    public void deleteField(long fieldId, long userId, boolean admin) {
        DatasetFieldEntity field = fieldById(fieldId);
        requireActive(accessibleDataset(field.getDataset().getDatasetId(), userId, admin));
        field.setActive(false);
        rules.findAllByField_FieldIdOrderByRuleIdAsc(fieldId).forEach(rule -> rule.setActive(false));
    }

    @Transactional(readOnly = true)
    public List<ApiDtos.RuleView> listRules(long fieldId, long userId, boolean admin) {
        DatasetFieldEntity field = fieldById(fieldId);
        accessibleDataset(field.getDataset().getDatasetId(), userId, admin);
        return rules.findAllByField_FieldIdOrderByRuleIdAsc(fieldId).stream().map(this::toView).toList();
    }

    @Transactional
    public ApiDtos.RuleView addRule(long fieldId, long userId, boolean admin, ApiDtos.RuleRequest request) {
        DatasetFieldEntity field = fieldById(fieldId);
        requireActive(accessibleDataset(field.getDataset().getDatasetId(), userId, admin));
        if (!field.isActive()) throw ApiException.badRequest("Archived fields cannot receive new rules.");
        String type = request.ruleType().trim().toUpperCase(Locale.ROOT);
        String severity = request.severity().trim().toUpperCase(Locale.ROOT);
        validateRule(type, severity, request.ruleConfig());
        ValidationRuleEntity rule = new ValidationRuleEntity();
        rule.setField(field);
        rule.setRuleType(type);
        rule.setSeverity(severity);
        rule.setRuleConfig(request.ruleConfig() == null ? new HashMap<>() : new HashMap<>(request.ruleConfig()));
        rule.setActive(true);
        return toView(rules.save(rule));
    }

    @Transactional
    public ApiDtos.RuleView updateRule(long ruleId, long userId, boolean admin, ApiDtos.RuleRequest request) {
        ValidationRuleEntity rule = rules.findById(ruleId).orElseThrow(() -> ApiException.notFound("Rule was not found."));
        requireActive(accessibleDataset(rule.getField().getDataset().getDatasetId(), userId, admin));
        if (!rule.getField().isActive()) throw ApiException.badRequest("Rules on archived fields cannot be changed.");
        String type = request.ruleType().trim().toUpperCase(Locale.ROOT);
        String severity = request.severity().trim().toUpperCase(Locale.ROOT);
        validateRule(type, severity, request.ruleConfig());
        rule.setRuleType(type);
        rule.setSeverity(severity);
        rule.setRuleConfig(request.ruleConfig() == null ? new HashMap<>() : new HashMap<>(request.ruleConfig()));
        return toView(rule);
    }

    @Transactional
    public void deactivateRule(long ruleId, long userId, boolean admin) {
        ValidationRuleEntity rule = rules.findById(ruleId).orElseThrow(() -> ApiException.notFound("Rule was not found."));
        requireActive(accessibleDataset(rule.getField().getDataset().getDatasetId(), userId, admin));
        if (!rule.getField().isActive()) throw ApiException.badRequest("Rules on archived fields cannot be changed.");
        rule.setActive(false);
    }

    @Transactional(readOnly = true)
    public DatasetEntity accessibleDataset(long datasetId, long userId, boolean admin) {
        DatasetEntity dataset = datasets.findById(datasetId).orElseThrow(() -> ApiException.notFound("Dataset was not found."));
        if (!admin && !dataset.getOwner().getUserId().equals(userId)) {
            throw ApiException.forbidden("You can only access datasets you own.");
        }
        return dataset;
    }

    @Transactional(readOnly = true)
    public DatasetFieldEntity fieldById(long fieldId) {
        return fields.findById(fieldId).orElseThrow(() -> ApiException.notFound("Dataset field was not found."));
    }

    private void validateRule(String type, String severity, Map<String, Object> config) {
        if (!RULE_TYPES.contains(type)) throw ApiException.badRequest("Rule type must be REQUIRED, UNIQUE, EMAIL, RANGE, or TYPE.");
        if (!SEVERITIES.contains(severity)) throw ApiException.badRequest("Severity must be LOW, MEDIUM, or HIGH.");
        if ("RANGE".equals(type)) {
            if (config == null || !config.containsKey("min") || !config.containsKey("max")) {
                throw ApiException.badRequest("RANGE rules require numeric min and max settings.");
            }
            try {
                BigDecimal min = new BigDecimal(config.get("min").toString());
                BigDecimal max = new BigDecimal(config.get("max").toString());
                if (min.compareTo(max) > 0) throw ApiException.badRequest("RANGE min must not exceed max.");
            } catch (NumberFormatException ex) {
                throw ApiException.badRequest("RANGE min and max must be numbers.");
            }
        }
    }

    private ApiDtos.DatasetView toView(DatasetEntity dataset) {
        List<ApiDtos.FieldView> fieldViews = fields.findAllByDataset_DatasetIdOrderByFieldIdAsc(dataset.getDatasetId())
                .stream().map(this::toView).toList();
        return new ApiDtos.DatasetView(dataset.getDatasetId(), dataset.getOwner().getUserId(),
                dataset.getDatasetName(), dataset.getDescription(), dataset.getStatus(), dataset.getCreatedAt(), fieldViews);
    }

    private ApiDtos.FieldView toView(DatasetFieldEntity field) {
        List<ApiDtos.RuleView> ruleViews = rules.findAllByField_FieldIdOrderByRuleIdAsc(field.getFieldId())
                .stream().map(this::toView).toList();
        return new ApiDtos.FieldView(field.getFieldId(), field.getFieldName(), field.getDataType(), field.isActive(), ruleViews);
    }

    private ApiDtos.RuleView toView(ValidationRuleEntity rule) {
        return new ApiDtos.RuleView(rule.getRuleId(), rule.getField().getFieldId(), rule.getRuleType(),
                rule.getSeverity(), rule.getRuleConfig(), rule.isActive());
    }

    private void validatePage(int page, int size) {
        if (page < 0 || size < 1 || size > 100) throw ApiException.badRequest("Page must be 0 or greater and size must be between 1 and 100.");
    }

    private String cleanQuery(String query) {
        return query == null || query.isBlank() ? null : query.trim();
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return null;
        String value = status.trim().toUpperCase();
        if (!List.of("ACTIVE", "ARCHIVED").contains(value)) throw ApiException.badRequest("Status must be ACTIVE or ARCHIVED.");
        return value;
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private void requireActive(DatasetEntity dataset) {
        if (!"ACTIVE".equals(dataset.getStatus())) throw ApiException.badRequest("Archived datasets cannot be modified.");
    }
}
