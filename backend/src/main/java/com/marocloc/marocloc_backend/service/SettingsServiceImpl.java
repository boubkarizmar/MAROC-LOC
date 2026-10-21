package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.model.Settings;
import com.marocloc.marocloc_backend.repository.SettingsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SettingsServiceImpl implements SettingsService {

    private final SettingsRepository settingsRepository;

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getAllSettings() {
        return settingsRepository.findAll().stream()
                .collect(Collectors.toMap(
                        Settings::getKey,
                        s -> s.getValue() != null ? s.getValue() : ""
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public String getSetting(String key) {
        return settingsRepository.findByKey(key)
                .map(Settings::getValue)
                .orElse("");
    }

    @Override
    @Transactional
    public void updateSetting(String key, String value, String updatedBy) {
        Settings setting = settingsRepository.findByKey(key)
                .orElseGet(() -> Settings.builder().key(key).build());
        setting.setValue(value);
        setting.setUpdatedAt(LocalDateTime.now());
        setting.setUpdatedBy(updatedBy);
        settingsRepository.save(setting);
        log.info("Setting '{}' updated to '{}' by {}", key, value, updatedBy);
    }

    @Override
    @Transactional
    public void updateSettings(Map<String, String> settings, String updatedBy) {
        settings.forEach((key, value) -> updateSetting(key, value, updatedBy));
    }
}
