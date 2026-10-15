package com.datapulse.api;

import com.datapulse.security.CurrentUser;
import com.datapulse.service.DashboardService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public ApiDtos.DashboardView summary(@AuthenticationPrincipal Jwt jwt) {
        return dashboardService.summary(CurrentUser.id(jwt), CurrentUser.isAdmin(jwt));
    }
}
