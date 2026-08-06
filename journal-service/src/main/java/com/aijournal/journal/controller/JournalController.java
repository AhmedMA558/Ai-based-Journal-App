package com.aijournal.journal.controller;

import com.aijournal.common.dto.ApiResponse;
import com.aijournal.common.dto.PagedResponse;
import com.aijournal.journal.entity.Journal;
import com.aijournal.journal.service.JournalService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/journals")
@Tag(name = "Journal Management API", description = "CRUD operations, Drafts, Pinned, Favorites, Archive, Soft/Permanent Delete, Tags & Metrics")
public class JournalController {

    private final JournalService journalService;

    public JournalController(JournalService journalService) {
        this.journalService = journalService;
    }

    @PostMapping
    @Operation(summary = "Create a new journal entry or draft")
    public ResponseEntity<ApiResponse<Journal>> createJournal(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Journal journal) {
        Journal created = journalService.createJournal(userId, journal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Journal entry created successfully", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing journal entry")
    public ResponseEntity<ApiResponse<Journal>> updateJournal(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id,
            @RequestBody Journal journal) {
        Journal updated = journalService.updateJournal(userId, id, journal);
        return ResponseEntity.ok(ApiResponse.success("Journal entry updated successfully", updated));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get journal entry by ID")
    public ResponseEntity<ApiResponse<Journal>> getJournalById(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        Journal journal = journalService.getJournalById(userId, id);
        return ResponseEntity.ok(ApiResponse.success(journal));
    }

    @GetMapping
    @Operation(summary = "Get all active journals with pagination")
    public ResponseEntity<ApiResponse<PagedResponse<Journal>>> getUserJournals(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        PagedResponse<Journal> journals = journalService.getUserJournals(userId, PageRequest.of(page, size, sort));
        return ResponseEntity.ok(ApiResponse.success(journals));
    }

    @GetMapping("/pinned")
    @Operation(summary = "Get pinned journals")
    public ResponseEntity<ApiResponse<PagedResponse<Journal>>> getPinnedJournals(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<Journal> journals = journalService.getPinnedJournals(userId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(journals));
    }

    @GetMapping("/favorites")
    @Operation(summary = "Get favorite journals")
    public ResponseEntity<ApiResponse<PagedResponse<Journal>>> getFavoriteJournals(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<Journal> journals = journalService.getFavoriteJournals(userId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(journals));
    }

    @GetMapping("/archived")
    @Operation(summary = "Get archived journals")
    public ResponseEntity<ApiResponse<PagedResponse<Journal>>> getArchivedJournals(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<Journal> journals = journalService.getArchivedJournals(userId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(journals));
    }

    @PatchMapping("/{id}/pin")
    @Operation(summary = "Toggle pin status")
    public ResponseEntity<ApiResponse<Journal>> togglePin(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Pin status updated", journalService.togglePin(userId, id)));
    }

    @PatchMapping("/{id}/favorite")
    @Operation(summary = "Toggle favorite status")
    public ResponseEntity<ApiResponse<Journal>> toggleFavorite(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Favorite status updated", journalService.toggleFavorite(userId, id)));
    }

    @PatchMapping("/{id}/archive")
    @Operation(summary = "Toggle archive status")
    public ResponseEntity<ApiResponse<Journal>> toggleArchive(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Archive status updated", journalService.toggleArchive(userId, id)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete journal entry")
    public ResponseEntity<ApiResponse<Void>> softDeleteJournal(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        journalService.softDeleteJournal(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Journal soft deleted successfully", null));
    }

    @DeleteMapping("/{id}/permanent")
    @Operation(summary = "Permanently delete journal entry")
    public ResponseEntity<ApiResponse<Void>> permanentDeleteJournal(@RequestHeader("X-User-Id") Long userId, @PathVariable Long id) {
        journalService.permanentDeleteJournal(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Journal permanently deleted", null));
    }
}
