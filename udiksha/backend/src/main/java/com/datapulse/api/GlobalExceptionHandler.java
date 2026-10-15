package com.datapulse.api;

import jakarta.validation.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiDtos.ApiError> handleApi(ApiException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(new ApiDtos.ApiError(ex.getCode(), ex.getMessage(), Map.of()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiDtos.ApiError> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> details = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                details.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return ResponseEntity.badRequest().body(
                new ApiDtos.ApiError("VALIDATION_ERROR", "Please correct the highlighted fields.", details));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ResponseEntity<ApiDtos.ApiError> handleConstraint(ConstraintViolationException ex) {
        return ResponseEntity.badRequest().body(
                new ApiDtos.ApiError("VALIDATION_ERROR", "A request constraint was not met.", Map.of()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    ResponseEntity<ApiDtos.ApiError> handleAccessDenied() {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                new ApiDtos.ApiError("FORBIDDEN", "You do not have access to this resource.", Map.of()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiDtos.ApiError> handleIntegrity() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(
                new ApiDtos.ApiError("DATA_CONFLICT", "This change conflicts with existing records or a database rule.", Map.of()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiDtos.ApiError> handleUploadTooLarge() {
        return ResponseEntity.badRequest().body(
                new ApiDtos.ApiError("FILE_TOO_LARGE", "CSV files must be 5 MB or smaller.", Map.of()));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiDtos.ApiError> handleUnexpected(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ApiDtos.ApiError("INTERNAL_ERROR", "The request could not be completed.", Map.of()));
    }
}
