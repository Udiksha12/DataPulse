package com.datapulse.api;

import com.datapulse.security.CurrentUser;
import com.datapulse.service.IssueService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/issues")
public class IssueController {
    private final IssueService issueService;

    public IssueController(IssueService issueService) {
        this.issueService = issueService;
    }

    @PatchMapping("/{issueId}/status")
    public ApiDtos.IssueView updateStatus(@AuthenticationPrincipal Jwt jwt, @PathVariable long issueId,
                                           @Valid @RequestBody ApiDtos.StatusUpdateRequest request) {
        return issueService.updateStatus(issueId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt), request);
    }
}
