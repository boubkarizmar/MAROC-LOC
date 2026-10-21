package com.marocloc.marocloc_backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
@Slf4j
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve uploaded files
        String uploadPath = System.getenv("UPLOAD_DIR");
        if (uploadPath == null || uploadPath.isEmpty()) {
            // Use relative path from working directory
            File uploadsDir = new File("uploads");
            if (!uploadsDir.isAbsolute()) {
                uploadsDir = new File(System.getProperty("user.dir"), "uploads");
            }
            uploadPath = uploadsDir.getAbsolutePath().replace("\\", "/");
            if (!uploadPath.endsWith("/")) {
                uploadPath += "/";
            }
        }

        // Spring file: protocol needs file:/// on Windows
        String resourceLocation;
        if (uploadPath.startsWith("file:")) {
            resourceLocation = uploadPath;
        } else if (uploadPath.matches("^[A-Za-z]:/.*")) {
            // Windows absolute path: C:/... -> file:///C:/...
            resourceLocation = "file:///" + uploadPath;
        } else {
            resourceLocation = "file:" + uploadPath;
        }

        log.info("[WebMvcConfig] Upload path resolved to: {}", resourceLocation);

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation)
                .setCachePeriod(31536000);

        // FIX: also handle /api/uploads/** since frontend requests use this prefix
        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations(resourceLocation)
                .setCachePeriod(31536000);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(
                    "http://localhost:3000",
                    "http://localhost:5173",
                    "http://localhost:5174"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .exposedHeaders("Authorization");
    }
}
