package com.datapulse.repository;

import com.datapulse.domain.DatasetEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DatasetRepository extends JpaRepository<DatasetEntity, Long> {
    @Query("""
        select d from DatasetEntity d
        where (:query is null or lower(d.datasetName) like lower(concat('%', :query, '%')))
          and (:status is null or d.status = :status)
        """)
    Page<DatasetEntity> searchAll(@Param("query") String query, @Param("status") String status, Pageable pageable);

    @Query("""
        select d from DatasetEntity d
        where d.owner.userId = :ownerId
          and (:query is null or lower(d.datasetName) like lower(concat('%', :query, '%')))
          and (:status is null or d.status = :status)
        """)
    Page<DatasetEntity> searchOwned(@Param("ownerId") Long ownerId,
                                    @Param("query") String query,
                                    @Param("status") String status,
                                    Pageable pageable);
}
