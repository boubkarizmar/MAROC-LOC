package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.PropertyDTO;

import java.util.List;

public interface FavoriteService {

    void addFavorite(String userEmail, Long propertyId);

    void removeFavorite(String userEmail, Long propertyId);

    List<PropertyDTO> getUserFavorites(String userEmail);

    boolean isFavorite(String userEmail, Long propertyId);
}