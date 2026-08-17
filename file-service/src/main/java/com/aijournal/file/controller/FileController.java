package com.aijournal.file.controller;

import com.aijournal.common.dto.ApiResponse;
import com.aijournal.common.exception.ForbiddenException;
import com.aijournal.file.storage.FileStorageStrategy;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
@Tag(name = "File Attachments API", description = "Upload & Download Images, Videos, PDFs, and Voice Notes with S3 & Local Abstraction")
public class FileController {

    private final FileStorageStrategy fileStorageStrategy;

    public FileController(FileStorageStrategy fileStorageStrategy) {
        this.fileStorageStrategy = fileStorageStrategy;
    }

    @PostMapping("/upload")
    @Operation(summary = "Upload image, video, PDF, or voice note attachment")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam("file") MultipartFile file) {
        String storedPath = fileStorageStrategy.storeFile(file, "user-" + userId);
        Map<String, String> result = Map.of(
                "filePath", storedPath,
                "originalName", file.getOriginalFilename() != null ? file.getOriginalFilename() : "file",
                "contentType", file.getContentType() != null ? file.getContentType() : "application/octet-stream",
                "sizeBytes", String.valueOf(file.getSize())
        );
        return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", result));
    }

    @GetMapping("/download")
    @Operation(summary = "Download attachment file")
    public ResponseEntity<byte[]> downloadFile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam("path") String path) {
        if (path.contains("..") || !path.startsWith("user-" + userId + "/")) {
            throw new ForbiddenException("You do not have access to this file");
        }
        byte[] data = fileStorageStrategy.getFile(path);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + path.substring(path.lastIndexOf("/") + 1) + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }

    @DeleteMapping
    @Operation(summary = "Delete an attachment file (e.g. replacing a profile avatar)")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam("path") String path) {
        if (path.contains("..") || !path.startsWith("user-" + userId + "/")) {
            throw new ForbiddenException("You do not have access to this file");
        }
        fileStorageStrategy.deleteFile(path);
        return ResponseEntity.ok(ApiResponse.success("File deleted successfully", null));
    }
}
