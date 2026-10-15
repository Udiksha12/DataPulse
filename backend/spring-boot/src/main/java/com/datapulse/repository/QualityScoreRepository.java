package com.datapulse.repository;

import com.datapulse.domain.QualityScoreEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QualityScoreRepository extends JpaRepository<QualityScoreEntity, Long> {
    Optional<QualityScoreEntity> findByRun_RunId(Long runId);
}
