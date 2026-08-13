package com.aijournal.analytics.controller;

import com.aijournal.analytics.service.AnalyticsService;
import com.aijournal.common.dto.ApiResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsControllerTest {

    @Mock
    private AnalyticsService analyticsService;

    @InjectMocks
    private AnalyticsController controller;

    @Test
    void getInsights_DelegatesToServiceWithHeaderUserIdAndAuthorization() {
        Map<String, Object> insights = Map.of("userId", 5L, "totalWordsWritten", 400);
        when(analyticsService.getUserJournalInsights(5L, "Bearer token")).thenReturn(insights);

        ResponseEntity<ApiResponse<Map<String, Object>>> response = controller.getInsights(5L, "Bearer token");

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody().getData()).isEqualTo(insights);
        verify(analyticsService).getUserJournalInsights(5L, "Bearer token");
    }
}
