package com.aijournal.file.storage;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageStrategy {
    String storeFile(MultipartFile file, String path);
    byte[] getFile(String path);
    void deleteFile(String path);
}
