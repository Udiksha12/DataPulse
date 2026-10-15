package com.datapulse.repository;

import com.datapulse.domain.IssueResolutionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IssueResolutionRepository extends JpaRepository<IssueResolutionEntity, Long> {
    List<IssueResolutionEntity> findAllByIssue_IssueIdOrderByResolvedAtDesc(Long issueId);
}
