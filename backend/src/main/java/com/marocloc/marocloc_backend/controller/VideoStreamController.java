package com.marocloc.marocloc_backend.controller;

import com.marocloc.marocloc_backend.config.ApiRoutes;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
@RestController
@RequestMapping(ApiRoutes.VIDEOS)
@Slf4j
public class VideoStreamController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @GetMapping("/{filename:.+}")
    public ResponseEntity<Resource> stream(@PathVariable String filename) {
        try {
            // Security: prevent path traversal attacks
            if (filename.contains("..") || filename.contains("//") || filename.startsWith("/")) {
                log.warn("Path traversal attempt blocked: {}", filename);
                return ResponseEntity.badRequest().build();
            }

            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path path = uploadPath.resolve(filename).normalize();

            // Ensure resolved path is within upload directory
            if (!path.startsWith(uploadPath)) {
                log.warn("Path escape attempt blocked: {} -> {}", filename, path);
                return ResponseEntity.badRequest().build();
            }

            if (!Files.exists(path)) {
                return ResponseEntity.notFound().build();
            }

            Resource resource = new UrlResource(path.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(path);
            if (contentType == null) contentType = "application/octet-stream";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                    .body(resource);

        } catch (Exception e) {
            log.error("Video streaming error: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
