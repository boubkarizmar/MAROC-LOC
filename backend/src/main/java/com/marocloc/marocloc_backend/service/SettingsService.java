package com.marocloc.marocloc_backend.service;

import java.util.Map;

public interface SettingsService {

    Map<String, String> getAllSettings();

    String getSetting(String key);

    void updateSetting(String key, String value, String updatedBy);

    void updateSettings(Map<String, String> settings, String updatedBy);
}
