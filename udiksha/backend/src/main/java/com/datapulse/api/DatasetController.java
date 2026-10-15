package com.datapulse.api;

import com.datapulse.security.CurrentUser;
import com.datapulse.service.DatasetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DatasetController {
    private final DatasetService service;

    public DatasetController(DatasetService service) {
        this.service = service;
    }

    @GetMapping("/datasets")
    public ApiDtos.PageView<ApiDtos.DatasetView> list(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status) {
        return service.list(CurrentUser.id(jwt), CurrentUser.isAdmin(jwt), page, size, q, status);
    }

    @PostMapping("/datasets")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiDtos.DatasetView create(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ApiDtos.DatasetRequest request) {
        return service.create(CurrentUser.id(jwt), request);
    }

    @GetMapping("/datasets/{datasetId}")
    public ApiDtos.DatasetView get(@AuthenticationPrincipal Jwt jwt, @PathVariable long datasetId) {
        return service.get(datasetId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt));
    }

    @PutMapping("/datasets/{datasetId}")
    public ApiDtos.DatasetView update(@AuthenticationPrincipal Jwt jwt, @PathVariable long datasetId,
                                      @Valid @RequestBody ApiDtos.DatasetRequest request) {
        return service.update(datasetId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt), request);
    }

    @DeleteMapping("/datasets/{datasetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archive(@AuthenticationPrincipal Jwt jwt, @PathVariable long datasetId) {
        service.archive(datasetId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt));
    }

    @GetMapping("/datasets/{datasetId}/fields")
    public List<ApiDtos.FieldView> listFields(@AuthenticationPrincipal Jwt jwt, @PathVariable long datasetId) {
        return service.listFields(datasetId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt));
    }

    @PostMapping("/datasets/{datasetId}/fields")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiDtos.FieldView addField(@AuthenticationPrincipal Jwt jwt, @PathVariable long datasetId,
                                      @Valid @RequestBody ApiDtos.FieldRequest request) {
        return service.addField(datasetId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt), request);
    }

    @PutMapping("/fields/{fieldId}")
    public ApiDtos.FieldView updateField(@AuthenticationPrincipal Jwt jwt, @PathVariable long fieldId,
                                         @Valid @RequestBody ApiDtos.FieldRequest request) {
        return service.updateField(fieldId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt), request);
    }

    @DeleteMapping("/fields/{fieldId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteField(@AuthenticationPrincipal Jwt jwt, @PathVariable long fieldId) {
        service.deleteField(fieldId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt));
    }

    @GetMapping("/fields/{fieldId}/rules")
    public List<ApiDtos.RuleView> listRules(@AuthenticationPrincipal Jwt jwt, @PathVariable long fieldId) {
        return service.listRules(fieldId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt));
    }

    @PostMapping("/fields/{fieldId}/rules")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiDtos.RuleView addRule(@AuthenticationPrincipal Jwt jwt, @PathVariable long fieldId,
                                    @Valid @RequestBody ApiDtos.RuleRequest request) {
        return service.addRule(fieldId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt), request);
    }

    @PutMapping("/rules/{ruleId}")
    public ApiDtos.RuleView updateRule(@AuthenticationPrincipal Jwt jwt, @PathVariable long ruleId,
                                       @Valid @RequestBody ApiDtos.RuleRequest request) {
        return service.updateRule(ruleId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt), request);
    }

    @DeleteMapping("/rules/{ruleId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivateRule(@AuthenticationPrincipal Jwt jwt, @PathVariable long ruleId) {
        service.deactivateRule(ruleId, CurrentUser.id(jwt), CurrentUser.isAdmin(jwt));
    }
}
