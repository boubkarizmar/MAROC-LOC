package com.marocloc.marocloc_backend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;

/**
 * File validation service for secure file uploads
 */
@Service
public class FileValidationService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final int MAX_FILES_PER_UPLOAD = 10;

    // Allowed image MIME types
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/gif"
    );

    // Allowed video MIME types
    private static final List<String> ALLOWED_VIDEO_TYPES = Arrays.asList(
            "video/mp4",
            "video/avi",
            "video/x-msvideo",
            "video/mov",
            "video/quicktime",
            "video/wmv",
            "video/x-ms-wmv",
            "video/flv",
            "video/x-flv",
            "video/webm"
    );

    // Maximum video file size (50MB)
    private static final long MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024; // 50MB

    /**
     * Validate image file
     */
    public void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        // Check file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size of 5MB");
        }

        // Check MIME type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed");
        }

        // Check file extension matches content type
        String filename = file.getOriginalFilename();
        if (filename != null) {
            String extension = getFileExtension(filename).toLowerCase();
            if (!isValidImageExtension(extension, contentType)) {
                throw new IllegalArgumentException("File extension does not match content type");
            }
        }

        // Additional security: Check for malicious content in filename
        if (filename != null && containsMaliciousPath(filename)) {
            throw new IllegalArgumentException("Invalid filename");
        }
    }

    /**
     * Validate multiple image files
     */
    public void validateImageFiles(MultipartFile[] files) {
        if (files == null) {
            return;
        }

        if (files.length > MAX_FILES_PER_UPLOAD) {
            throw new IllegalArgumentException("Maximum " + MAX_FILES_PER_UPLOAD + " files allowed per upload");
        }

        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                validateImageFile(file);
            }
        }
    }

    /**
     * Validate CIN image file (same as regular images but different size limit)
     */
    public void validateCinImageFile(MultipartFile file) {
        validateImageFile(file);

        // CIN images should be smaller (2MB max)
        if (file.getSize() > 2 * 1024 * 1024) { // 2MB
            throw new IllegalArgumentException("CIN image size exceeds maximum allowed size of 2MB");
        }
    }

    /**
     * Validate video file
     */
    public void validateVideoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Video file cannot be empty");
        }

        // Check file size
        if (file.getSize() > MAX_VIDEO_FILE_SIZE) {
            throw new IllegalArgumentException("Video file size exceeds maximum allowed size of 50MB");
        }

        // Check MIME type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_VIDEO_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Invalid video file type. Only MP4, AVI, MOV, WMV, FLV, and WebM videos are allowed");
        }

        // Check file extension matches content type
        String filename = file.getOriginalFilename();
        if (filename != null) {
            String extension = getFileExtension(filename).toLowerCase();
            if (!isValidVideoExtension(extension, contentType)) {
                throw new IllegalArgumentException("Video file extension does not match content type");
            }
        }

        // Additional security: Check for malicious content in filename
        if (filename != null && containsMaliciousPath(filename)) {
            throw new IllegalArgumentException("Invalid video filename");
        }
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1 || lastDotIndex == filename.length() - 1) {
            return "";
        }
        return filename.substring(lastDotIndex + 1);
    }

    /**
     * Check if file extension matches content type
     */
    private boolean isValidImageExtension(String extension, String contentType) {
        return switch (extension) {
            case "jpg", "jpeg" -> "image/jpeg".equals(contentType);
            case "png" -> "image/png".equals(contentType);
            case "webp" -> "image/webp".equals(contentType);
            case "gif" -> "image/gif".equals(contentType);
            default -> false;
        };
    }

    /**
     * Check if video file extension matches content type
     */
    private boolean isValidVideoExtension(String extension, String contentType) {
        return switch (extension) {
            case "mp4" -> "video/mp4".equals(contentType);
            case "avi" -> "video/avi".equals(contentType) || "video/x-msvideo".equals(contentType);
            case "mov" -> "video/mov".equals(contentType) || "video/quicktime".equals(contentType);
            case "wmv" -> "video/wmv".equals(contentType) || "video/x-ms-wmv".equals(contentType);
            case "flv" -> "video/flv".equals(contentType) || "video/x-flv".equals(contentType);
            case "webm" -> "video/webm".equals(contentType);
            default -> false;
        };
    }

    /**
     * Check for malicious path traversal in filename
     */
    private boolean containsMaliciousPath(String filename) {
        return filename.contains("..") ||
               filename.contains("/") ||
               filename.contains("\\") ||
               filename.contains(":") ||
               filename.toLowerCase().contains("script") ||
               filename.toLowerCase().contains("javascript") ||
               filename.toLowerCase().contains("<") ||
               filename.toLowerCase().contains(">");
    }

    /**
     * Sanitize filename for safe storage
     */
    public String sanitizeFilename(String originalFilename) {
        if (originalFilename == null) {
            return null;
        }

        // Remove path traversal
        String sanitized = originalFilename.replaceAll("[/\\\\:*?\"<>|]", "");

        // Remove potentially dangerous characters
        sanitized = sanitized.replaceAll("[<>\"'&]", "");

        // Limit length
        if (sanitized.length() > 100) {
            sanitized = sanitized.substring(0, 100);
        }

        return sanitized;
    }
}
