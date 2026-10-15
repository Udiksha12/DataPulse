package com.datapulse.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public final class ApiDtos {
    private ApiDtos() { }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) { }
    public record UserView(Long userId, String fullName, String email, String role) { }
    public record AuthResponse(String token, UserView user) { }
    public record LogoutResponse(boolean loggedOut) { }

    public record DatasetRequest(
            @NotBlank @Size(max = 160) String datasetName,
            @Size(max = 2000) String description) { }
    public record DatasetView(Long datasetId, Long ownerId, String datasetName, String description,
                              String status, OffsetDateTime createdAt, List<FieldView> fields) { }
    public record FieldRequest(@NotBlank @Size(max = 120) String fieldName,
                               @NotBlank String dataType) { }
    public record FieldView(Long fieldId, String fieldName, String dataType, boolean active, List<RuleView> rules) { }
    public record RuleRequest(@NotBlank String ruleType, @NotBlank String severity,
                              Map<String, Object> ruleConfig) { }
    public record RuleView(Long ruleId, Long fieldId, String ruleType, String severity,
                           Map<String, Object> ruleConfig, boolean active) { }
    public record PageView<T>(List<T> content, int page, int size, long totalElements, int totalPages) { }

    public record ResolutionView(Long resolutionId, String action, String note,
                                 String resolvedBy, OffsetDateTime resolvedAt) { }
    public record IssueView(Long issueId, Long runId, Long ruleId, String fieldName, int rowNumber,
                            String severity, String message, String observedValue, String status,
                            OffsetDateTime createdAt, OffsetDateTime resolvedAt,
                            List<ResolutionView> history) { }
    public record ScoreView(BigDecimal completenessScore, BigDecimal validityScore,
                            BigDecimal uniquenessScore, BigDecimal overallScore,
                            OffsetDateTime calculatedAt) { }
    public record RunView(Long runId, Long datasetId, String datasetName, String status,
                          int totalRows, int issueCount, OffsetDateTime startedAt,
                          OffsetDateTime completedAt, ScoreView score, List<IssueView> issues) { }
    public record DashboardDataset(Long datasetId, String datasetName, String status,
                                   Long latestRunId, BigDecimal latestOverallScore, long openIssueCount) { }
    public record DashboardView(long datasetCount, long openIssueCount, BigDecimal averageScore,
                                List<DashboardDataset> datasets) { }
    public record StatusUpdateRequest(@NotBlank String status, @NotBlank @Size(max = 1000) String note) { }
    public record ApiError(String code, String message, Map<String, String> details) { }
}
