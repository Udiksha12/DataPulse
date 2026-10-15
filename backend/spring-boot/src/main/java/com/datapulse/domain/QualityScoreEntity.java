package com.datapulse.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "quality_scores")
@Getter
@Setter
@NoArgsConstructor
public class QualityScoreEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "score_id")
    private Long scoreId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "run_id", nullable = false, unique = true)
    private ValidationRunEntity run;

    @Column(name = "completeness_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal completenessScore;

    @Column(name = "validity_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal validityScore;

    @Column(name = "uniqueness_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal uniquenessScore;

    @Column(name = "overall_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal overallScore;

    @Column(name = "calculated_at", nullable = false)
    private OffsetDateTime calculatedAt;

    @PrePersist
    void onCreate() {
        if (calculatedAt == null) calculatedAt = OffsetDateTime.now();
    }
}
