package com.datapulse.repository;

import com.datapulse.domain.ValidationRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ValidationRuleRepository extends JpaRepository<ValidationRuleEntity, Long> {
    List<ValidationRuleEntity> findAllByField_FieldIdOrderByRuleIdAsc(Long fieldId);
    List<ValidationRuleEntity> findAllByField_Dataset_DatasetIdAndField_ActiveTrueAndActiveTrueOrderByRuleIdAsc(Long datasetId);
    Optional<ValidationRuleEntity> findByRuleIdAndField_Dataset_DatasetId(Long ruleId, Long datasetId);
}
