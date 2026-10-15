package com.datapulse.service;

import com.datapulse.api.ApiDtos;
import com.datapulse.api.ApiException;
import com.datapulse.domain.IssueResolutionEntity;
import com.datapulse.domain.IssueStatus;
import com.datapulse.domain.QualityIssueEntity;
import com.datapulse.domain.UserEntity;
import com.datapulse.repository.IssueResolutionRepository;
import com.datapulse.repository.QualityIssueRepository;
import com.datapulse.repository.UserRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Locale;

@Service
public class IssueService {
    private final QualityIssueRepository issues;
    private final IssueResolutionRepository resolutions;
    private final UserRepository users;
    private final DatasetService datasets;
    private final RunQueryService runQueries;
    private final JdbcTemplate jdbcTemplate;

    public IssueService(QualityIssueRepository issues, IssueResolutionRepository resolutions, UserRepository users,
                        DatasetService datasets, RunQueryService runQueries, JdbcTemplate jdbcTemplate) {
        this.issues = issues;
        this.resolutions = resolutions;
        this.users = users;
        this.datasets = datasets;
        this.runQueries = runQueries;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional
    public ApiDtos.IssueView updateStatus(long issueId, long userId, boolean admin, ApiDtos.StatusUpdateRequest request) {
        QualityIssueEntity issue = issues.findById(issueId).orElseThrow(() -> ApiException.notFound("Issue was not found."));
        datasets.accessibleDataset(issue.getRun().getDataset().getDatasetId(), userId, admin);
        IssueStatus nextStatus;
        try {
            nextStatus = IssueStatus.valueOf(request.status().trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw ApiException.badRequest("Status must be OPEN, RESOLVED, or WAIVED.");
        }
        if (issue.getStatus() == nextStatus) throw ApiException.badRequest("Choose a different issue status.");

        jdbcTemplate.queryForObject("select set_config('app.user_id', ?, true)", String.class, Long.toString(userId));
        UserEntity actor = users.findById(userId).orElseThrow(() -> ApiException.unauthorized("User account was not found."));
        IssueResolutionEntity resolution = new IssueResolutionEntity();
        resolution.setIssue(issue);
        resolution.setResolvedBy(actor);
        resolution.setAction(switch (nextStatus) {
            case OPEN -> "REOPENED";
            case RESOLVED -> "FIXED";
            case WAIVED -> "WAIVED";
        });
        resolution.setNote(request.note().trim());
        resolutions.save(resolution);

        issue.setStatus(nextStatus);
        issue.setResolvedAt(nextStatus == IssueStatus.OPEN ? null : OffsetDateTime.now());
        issues.save(issue);
        return runQueries.issueView(issue);
    }
}
