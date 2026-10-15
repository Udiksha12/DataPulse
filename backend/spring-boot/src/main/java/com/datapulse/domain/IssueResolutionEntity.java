package com.datapulse.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "issue_resolutions")
@Getter
@Setter
@NoArgsConstructor
public class IssueResolutionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resolution_id")
    private Long resolutionId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "issue_id", nullable = false)
    private QualityIssueEntity issue;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resolved_by_user_id", nullable = false)
    private UserEntity resolvedBy;

    @Column(nullable = false, length = 20)
    private String action;

    @Column(nullable = false, columnDefinition = "text")
    private String note;

    @Column(name = "resolved_at", nullable = false)
    private OffsetDateTime resolvedAt;

    @PrePersist
    void onCreate() {
        if (resolvedAt == null) resolvedAt = OffsetDateTime.now();
    }
}
