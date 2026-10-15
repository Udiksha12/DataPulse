package com.datapulse.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "validation_runs")
@Getter
@Setter
@NoArgsConstructor
public class ValidationRunEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "run_id")
    private Long runId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dataset_id", nullable = false)
    private DatasetEntity dataset;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "started_by", nullable = false)
    private UserEntity startedBy;

    @Column(name = "started_at", nullable = false)
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(nullable = false, length = 20)
    private String status = "QUEUED";

    @Column(name = "total_rows", nullable = false)
    private int totalRows;

    @Column(name = "issue_count", nullable = false)
    private int issueCount;

    @Column(name = "failure_message", columnDefinition = "text")
    private String failureMessage;

    @PrePersist
    void onCreate() {
        if (startedAt == null) startedAt = OffsetDateTime.now();
    }
}
