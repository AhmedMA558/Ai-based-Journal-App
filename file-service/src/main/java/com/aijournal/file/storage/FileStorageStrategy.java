package com.aijournal.file.storage;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageStrategy {
    String storeFile(MultipartFile file, String path);
    byte[] getFile(String path);
    void deleteFile(String path);
    // Removes every file under a directory prefix (e.g. "user-{id}") in one
    // call - used by account deletion, where deleting one file at a time
    // would need the caller to first enumerate every upload the user ever
    // made.
    void deleteDirectory(String subPath);
}
