package com.datapulse.service;

import com.datapulse.api.ApiDtos;
import com.datapulse.api.ApiException;
import com.datapulse.domain.IssueResolutionEntity;
import com.datapulse.domain.QualityIssueEntity;
import com.datapulse.domain.QualityScoreEntity;
import com.datapulse.domain.ValidationRunEntity;
import com.datapulse.repository.IssueResolutionRepository;
import com.datapulse.repository.QualityIssueRepository;
import com.datapulse.repository.QualityScoreRepository;
import com.datapulse.repository.ValidationRunRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RunQueryService {
    private final ValidationRunRepository runs;
    private final QualityIssueRepository issues;
    private final IssueResolutionRepository resolutions;
    private final QualityScoreRepository scores;
    private final DatasetService datasetService;

    public RunQueryService(ValidationRunRepository runs, QualityIssueRepository issues,
                           IssueResolutionRepository resolutions, QualityScoreRepository scores,
                           DatasetService datasetService) {
        this.runs = runs;
        this.issues = issues;
        this.resolutions = resolutions;
        this.scores = scores;
        this.datasetService = datasetService;
    }

    @Transactional(readOnly = true)
    public ApiDtos.RunView get(long runId, long userId, boolean admin) {
        ValidationRunEntity run = runs.findById(runId).orElseThrow(() -> ApiException.notFound("Validation run was not found."));
        datasetService.accessibleDataset(run.getDataset().getDatasetId(), userId, admin);
        Page<QualityIssueEntity> issuePage = issues.findAllByRun_RunIdOrderByRowNumberAsc(
                runId, PageRequest.of(0, 100, Sort.by("rowNumber").ascending()));
        QualityScoreEntity score = scores.findByRun_RunId(runId).orElse(null);
        return new ApiDtos.RunView(run.getRunId(), run.getDataset().getDatasetId(),
                run.getDataset().getDatasetName(), run.getStatus(), run.getTotalRows(), run.getIssueCount(),
                run.getStartedAt(), run.getCompletedAt(), score == null ? null : toScore(score),
                issuePage.getContent().stream().map(this::toIssue).toList());
    }

    @Transactional(readOnly = true)
    public ApiDtos.PageView<ApiDtos.IssueView> listIssues(long runId, long userId, boolean admin, int page, int size) {
        if (page < 0 || size < 1 || size > 100) throw ApiException.badRequest("Page must be 0 or greater and size must be between 1 and 100.");
        ValidationRunEntity run = runs.findById(runId).orElseThrow(() -> ApiException.notFound("Validation run was not found."));
        datasetService.accessibleDataset(run.getDataset().getDatasetId(), userId, admin);
        Page<QualityIssueEntity> result = issues.findAllByRun_RunIdOrderByRowNumberAsc(
                runId, PageRequest.of(page, size, Sort.by("rowNumber").ascending()));
        return new ApiDtos.PageView<>(result.getContent().stream().map(this::toIssue).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages());
    }

    @Transactional(readOnly = true)
    public ApiDtos.IssueView issueView(QualityIssueEntity issue) {
        return toIssue(issue);
    }

    private ApiDtos.ScoreView toScore(QualityScoreEntity score) {
        return new ApiDtos.ScoreView(score.getCompletenessScore(), score.getValidityScore(),
                score.getUniquenessScore(), score.getOverallScore(), score.getCalculatedAt());
    }

    private ApiDtos.IssueView toIssue(QualityIssueEntity issue) {
        List<ApiDtos.ResolutionView> history = resolutions.findAllByIssue_IssueIdOrderByResolvedAtDesc(issue.getIssueId())
                .stream().map(this::toResolution).toList();
        return new ApiDtos.IssueView(issue.getIssueId(), issue.getRun().getRunId(), issue.getRule().getRuleId(),
                issue.getRule().getField().getFieldName(), issue.getRowNumber(), issue.getSeverity(), issue.getMessage(),
                issue.getObservedValue(), issue.getStatus().name(), issue.getCreatedAt(), issue.getResolvedAt(), history);
    }

    private ApiDtos.ResolutionView toResolution(IssueResolutionEntity resolution) {
        return new ApiDtos.ResolutionView(resolution.getResolutionId(), resolution.getAction(), resolution.getNote(),
                resolution.getResolvedBy().getFullName(), resolution.getResolvedAt());
    }
}
