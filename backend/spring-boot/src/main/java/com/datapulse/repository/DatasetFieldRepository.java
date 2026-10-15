package com.datapulse.repository;

import com.datapulse.domain.DatasetFieldEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DatasetFieldRepository extends JpaRepository<DatasetFieldEntity, Long> {
    List<DatasetFieldEntity> findAllByDataset_DatasetIdOrderByFieldIdAsc(Long datasetId);
    List<DatasetFieldEntity> findAllByDataset_DatasetIdAndActiveTrueOrderByFieldIdAsc(Long datasetId);
    Optional<DatasetFieldEntity> findByFieldIdAndDataset_DatasetId(Long fieldId, Long datasetId);
}
