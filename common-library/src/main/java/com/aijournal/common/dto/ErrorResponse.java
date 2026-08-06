package com.aijournal.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ErrorResponse {
    private boolean success;
    private String message;
    private String errorCode;
    private String path;
    private Map<String, String> validationErrors;
    private LocalDateTime timestamp = LocalDateTime.now();

    public ErrorResponse() {
    }

    public ErrorResponse(boolean success, String message, String errorCode, String path, Map<String, String> validationErrors, LocalDateTime timestamp) {
        this.success = success;
        this.message = message;
        this.errorCode = errorCode;
        this.path = path;
        this.validationErrors = validationErrors;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(String errorCode) {
        this.errorCode = errorCode;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Map<String, String> getValidationErrors() {
        return validationErrors;
    }

    public void setValidationErrors(Map<String, String> validationErrors) {
        this.validationErrors = validationErrors;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
