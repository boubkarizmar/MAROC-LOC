package com.marocloc.marocloc_backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private final String uploadDir = "uploads";

    // =====================================================
    // SAVE SINGLE IMAGE
    // =====================================================
    public String saveFile(MultipartFile file) {

        try {

            Path uploadPath = Paths.get(uploadDir, "images");

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            validateExtension(originalFilename);

            String extension = originalFilename.substring(
                    originalFilename.lastIndexOf("."));

            String filename = UUID.randomUUID() + extension.toLowerCase();

            Path filePath = uploadPath.resolve(filename);

            Files.copy(
                    file.getInputStream(),
                    filePath,
                    StandardCopyOption.REPLACE_EXISTING
            );

            log.info("Image saved: {}", filename);

            return "/uploads/images/" + filename;

        } catch (IOException e) {

            log.error("Error saving image", e);

            throw new RuntimeException("Failed to save image", e);
        }
    }

    // =====================================================
    // SAVE MULTIPLE IMAGES
    // =====================================================
    public List<String> saveImages(List<MultipartFile> images) {

        List<String> imageUrls = new ArrayList<>();

        for (MultipartFile image : images) {

            String imageUrl = saveFile(image);

            imageUrls.add(imageUrl);
        }

        return imageUrls;
    }

    // =====================================================
    // SAVE VIDEO
    // =====================================================
    public String saveVideo(MultipartFile file) {

        try {

            Path uploadPath = Paths.get(uploadDir, "videos");

            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFilename = file.getOriginalFilename();
            validateExtension(originalFilename);

            String extension = originalFilename.substring(
                    originalFilename.lastIndexOf("."));

            String filename = UUID.randomUUID() + extension.toLowerCase();

            Path filePath = uploadPath.resolve(filename);

            Files.copy(
                    file.getInputStream(),
                    filePath,
                    StandardCopyOption.REPLACE_EXISTING
            );

            log.info("Video saved: {}", filename);

            return "/uploads/videos/" + filename;

        } catch (IOException e) {

            log.error("Error saving video", e);

            throw new RuntimeException("Failed to save video", e);
        }
    }

    // =====================================================
    // STREAM FILE
    // =====================================================
    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp");
    private static final Set<String> ALLOWED_VIDEO_EXTENSIONS = Set.of(".mp4", ".mov", ".avi", ".webm");
    private static final Set<String> ALLOWED_ALL_EXTENSIONS = new HashSet<>();

    {
        ALLOWED_ALL_EXTENSIONS.addAll(ALLOWED_IMAGE_EXTENSIONS);
        ALLOWED_ALL_EXTENSIONS.addAll(ALLOWED_VIDEO_EXTENSIONS);
    }

    private void validateExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new RuntimeException("Invalid file: missing extension");
        }
        String extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
        if (!ALLOWED_ALL_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("File type not allowed: " + extension);
        }
    }

    public ResponseEntity<Resource> streamFile(String filename) {

        try {

            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path filePath = uploadPath.resolve(filename).normalize();

            // Path traversal protection: ensure resolved path is within upload directory
            if (!filePath.startsWith(uploadPath)) {
                log.warn("Path traversal attempt blocked: {}", filename);
                throw new RuntimeException("Invalid file path");
            }

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("File not found: " + filename);
            }

            String contentType = "application/octet-stream";

            if (filename.endsWith(".mp4")) {

                contentType = "video/mp4";

            } else if (
                    filename.endsWith(".jpg") ||
                    filename.endsWith(".jpeg")) {

                contentType = "image/jpeg";

            } else if (filename.endsWith(".png")) {

                contentType = "image/png";
            }

            return ResponseEntity.ok()
                    .header(
                            HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + filename + "\""
                    )
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);

        } catch (Exception e) {

            log.error("Error streaming file: {}", filename, e);

            return ResponseEntity.notFound().build();
        }
    }
}