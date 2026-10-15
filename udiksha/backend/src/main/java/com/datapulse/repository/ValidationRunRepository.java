package com.datapulse.repository;

import com.datapulse.domain.ValidationRunEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ValidationRunRepository extends JpaRepository<ValidationRunEntity, Long> {
    List<ValidationRunEntity> findAllByDataset_DatasetIdOrderByStartedAtDesc(Long datasetId);
}
