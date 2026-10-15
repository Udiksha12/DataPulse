package com.datapulse.api;

import com.datapulse.security.CurrentUser;
import com.datapulse.service.CsvValidationService;
import com.datapulse.service.RunQueryService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class RunController {
    private final CsvValidationService validationService;
    private final RunQueryService runQueryService;

    public RunController(CsvValidationService validationService, RunQueryService runQueryService) {
        this.validationService = validationService;
        this.runQueryService = runQueryService;
    }

    @PostMapping(value = "/datasets/{datasetId}/runs", consumes = "multipart/form-data")
    public ApiDtos.RunView run(@AuthenticationPrincipal Jwt jwt, @PathVariable long datasetId,
                               @RequestPart("file") MultipartFile file) {
        return validationService.run(datasetId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt), file);
    }

    @GetMapping("/runs/{runId}")
    public ApiDtos.RunView get(@AuthenticationPrincipal Jwt jwt, @PathVariable long runId) {
        return runQueryService.get(runId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt));
    }

    @GetMapping("/runs/{runId}/issues")
    public ApiDtos.PageView<ApiDtos.IssueView> issues(@AuthenticationPrincipal Jwt jwt, @PathVariable long runId,
                                                       @RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "25") int size) {
        return runQueryService.listIssues(runId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt), page, size);
    }
}
