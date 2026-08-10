package com.aijournal.file.storage.impl;

import com.aijournal.common.exception.BadRequestException;
import com.aijournal.file.storage.FileStorageStrategy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Component("localStorageStrategy")
public class LocalFileStorageStrategy implements FileStorageStrategy {

    @Value("${storage.local.dir:./uploads}")
    private String uploadDir;

    @Override
    public String storeFile(MultipartFile file, String subPath) {
        try {
            Path targetDir = Paths.get(uploadDir, subPath);
            Files.createDirectories(targetDir);

            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null && originalFilename.contains(".") ?
                    originalFilename.substring(originalFilename.lastIndexOf(".")) : "";

            String fileName = UUID.randomUUID() + fileExtension;
            Path filePath = targetDir.resolve(fileName);

            // transferTo(Path), not transferTo(File) - the File overload resolves relative
            // to the servlet container's internal multipart temp location on some Tomcat
            // versions and silently fails for a destination outside it (target directory
            // gets created, but the file itself never gets written). The Path overload
            // copies via the part's InputStream instead, which works for any destination.
            file.transferTo(filePath);
            return subPath + "/" + fileName;

        } catch (IOException e) {
            throw new BadRequestException("Could not store file locally: " + e.getMessage());
        }
    }

    @Override
    public byte[] getFile(String relativePath) {
        try {
            Path filePath = Paths.get(uploadDir, relativePath);
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            throw new BadRequestException("File not found or unreadable: " + relativePath);
        }
    }

    @Override
    public void deleteFile(String relativePath) {
        try {
            Path filePath = Paths.get(uploadDir, relativePath);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Ignore deletion error
        }
    }
}
