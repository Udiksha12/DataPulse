package com.datapulse.repository;

import com.datapulse.domain.IssueStatus;
import com.datapulse.domain.QualityIssueEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QualityIssueRepository extends JpaRepository<QualityIssueEntity, Long> {
    Page<QualityIssueEntity> findAllByRun_RunIdOrderByRowNumberAsc(Long runId, Pageable pageable);
    long countByRun_Dataset_Owner_UserIdAndStatus(Long ownerId, IssueStatus status);
}
