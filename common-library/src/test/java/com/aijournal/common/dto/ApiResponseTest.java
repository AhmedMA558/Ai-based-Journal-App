package com.aijournal.common.dto;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ApiResponseTest {

    private final ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @Test
    void success_WithDataOnly_UsesDefaultMessage() {
        ApiResponse<String> response = ApiResponse.success("payload");

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Operation completed successfully");
        assertThat(response.getData()).isEqualTo("payload");
        assertThat(response.getTimestamp()).isNotNull();
    }

    @Test
    void success_WithCustomMessage_UsesProvidedMessage() {
        ApiResponse<Integer> response = ApiResponse.success("Created", 7);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Created");
        assertThat(response.getData()).isEqualTo(7);
    }

    @Test
    void error_HasNullDataAndSuccessFalse() {
        ApiResponse<Object> response = ApiResponse.error("Something went wrong");

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("Something went wrong");
        assertThat(response.getData()).isNull();
    }

    @Test
    void serialization_NullDataField_IsOmittedFromJson() throws Exception {
        ApiResponse<Object> response = ApiResponse.error("failed");

        String json = mapper.writeValueAsString(response);

        assertThat(json).doesNotContain("\"data\"");
    }

    @Test
    void serialization_NonNullData_IncludesDataField() throws Exception {
        ApiResponse<String> response = ApiResponse.success("value");

        String json = mapper.writeValueAsString(response);

        assertThat(json).contains("\"data\":\"value\"");
    }
}
