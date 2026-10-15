package com.datapulse.service;

import com.datapulse.api.ApiDtos;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class DashboardService {
    private final JdbcTemplate jdbcTemplate;

    public DashboardService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public ApiDtos.DashboardView summary(long userId, boolean admin) {
        String accessClause = admin ? "" : " WHERE d.owner_id = ?";
        String aggregateSql = """
                SELECT count(*) AS dataset_count,
                       coalesce(sum(s.open_issue_count), 0) AS open_issue_count,
                       coalesce(round(avg(s.latest_overall_score), 2), 0) AS average_score
                  FROM dataset_quality_summary s
                  JOIN datasets d ON d.dataset_id = s.dataset_id
                """ + accessClause;
        Long[] aggregates = jdbcTemplate.query(aggregateSql, ps -> {
            if (!admin) ps.setLong(1, userId);
        }, rs -> {
            if (!rs.next()) return new Long[]{0L, 0L, 0L};
            BigDecimal average = rs.getBigDecimal("average_score");
            return new Long[]{rs.getLong("dataset_count"), rs.getLong("open_issue_count"),
                    average == null ? 0L : average.movePointRight(2).longValue()};
        });
        BigDecimal averageScore = BigDecimal.valueOf(aggregates[2], 2);

        String listSql = """
                SELECT s.dataset_id, s.dataset_name, s.dataset_status, s.latest_run_id,
                       s.latest_overall_score, s.open_issue_count
                  FROM dataset_quality_summary s
                  JOIN datasets d ON d.dataset_id = s.dataset_id
                """ + accessClause + " ORDER BY d.created_at DESC";
        List<ApiDtos.DashboardDataset> datasets = jdbcTemplate.query(listSql, ps -> {
            if (!admin) ps.setLong(1, userId);
        }, (rs, rowNum) -> new ApiDtos.DashboardDataset(
                rs.getLong("dataset_id"), rs.getString("dataset_name"), rs.getString("dataset_status"),
                (Long) rs.getObject("latest_run_id"), rs.getBigDecimal("latest_overall_score"),
                rs.getLong("open_issue_count")));
        return new ApiDtos.DashboardView(aggregates[0], aggregates[1], averageScore, datasets);
    }
}
