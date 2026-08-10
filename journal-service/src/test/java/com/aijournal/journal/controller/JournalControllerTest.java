package com.aijournal.journal.controller;

import com.aijournal.common.dto.ApiResponse;
import com.aijournal.common.dto.PagedResponse;
import com.aijournal.journal.entity.Journal;
import com.aijournal.journal.service.JournalService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JournalControllerTest {

    @Mock
    private JournalService journalService;

    private JournalController controller;

    private JournalController controller() {
        return new JournalController(journalService);
    }

    @Test
    void createJournal_MissingUserIdHeader_ResolvesToUserOne() {
        controller = controller();
        Journal journal = new Journal();
        when(journalService.createJournal(eq(1L), any(Journal.class))).thenReturn(journal);

        ResponseEntity<ApiResponse<Journal>> response = controller.createJournal(null, journal);

        assertThat(response.getStatusCode().value()).isEqualTo(201);
        verify(journalService).createJournal(1L, journal);
    }

    @Test
    void createJournal_WithUserIdHeader_UsesHeaderValue() {
        controller = controller();
        Journal journal = new Journal();
        when(journalService.createJournal(eq(7L), any(Journal.class))).thenReturn(journal);

        controller.createJournal(7L, journal);

        verify(journalService).createJournal(7L, journal);
    }

    @Test
    void getUserJournals_SortDirAsc_BuildsAscendingSort() {
        controller = controller();
        PagedResponse<Journal> paged = new PagedResponse<>(Collections.emptyList(), 0, 10, 0, 0, true, true);
        ArgumentCaptor<PageRequest> captor = ArgumentCaptor.forClass(PageRequest.class);
        when(journalService.getUserJournals(eq(1L), captor.capture())).thenReturn(paged);

        controller.getUserJournals(1L, 0, 10, "createdAt", "ASC");

        Sort.Order order = captor.getValue().getSort().getOrderFor("createdAt");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.ASC);
    }

    @Test
    void getUserJournals_SortDirDefault_BuildsDescendingSort() {
        controller = controller();
        PagedResponse<Journal> paged = new PagedResponse<>(Collections.emptyList(), 0, 10, 0, 0, true, true);
        ArgumentCaptor<PageRequest> captor = ArgumentCaptor.forClass(PageRequest.class);
        when(journalService.getUserJournals(eq(1L), captor.capture())).thenReturn(paged);

        controller.getUserJournals(1L, 0, 10, "createdAt", "DESC");

        Sort.Order order = captor.getValue().getSort().getOrderFor("createdAt");
        assertThat(order).isNotNull();
        assertThat(order.getDirection()).isEqualTo(Sort.Direction.DESC);
    }

    @Test
    void permanentDeleteJournal_MissingUserIdHeader_ResolvesToUserOne() {
        controller = controller();

        controller.permanentDeleteJournal(null, 5L);

        verify(journalService).permanentDeleteJournal(1L, 5L);
    }
}
