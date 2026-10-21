package com.marocloc.marocloc_backend.service;

import com.marocloc.marocloc_backend.dto.PropertyDTO;
import com.marocloc.marocloc_backend.exception.NotFoundException;
import com.marocloc.marocloc_backend.model.Favorite;
import com.marocloc.marocloc_backend.model.Property;
import com.marocloc.marocloc_backend.model.User;
import com.marocloc.marocloc_backend.repository.FavoriteRepository;
import com.marocloc.marocloc_backend.repository.PropertyRepository;
import com.marocloc.marocloc_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;

    @Override
    @Transactional
    public void addFavorite(String userEmail, Long propertyId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", 0L));

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new NotFoundException("Property", propertyId));

        if (favoriteRepository.existsByUserIdAndPropertyId(user.getId(), propertyId)) {
            throw new IllegalStateException("Property already in favorites");
        }

        Favorite favorite = Favorite.builder()
                .user(user)
                .property(property)
                .build();

        favoriteRepository.save(favorite);
    }

    @Override
    @Transactional
    public void removeFavorite(String userEmail, Long propertyId) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", 0L));

        favoriteRepository.deleteByUserIdAndPropertyId(user.getId(), propertyId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertyDTO> getUserFavorites(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NotFoundException("User", 0L));

        return favoriteRepository.findByUserId(user.getId()).stream()
                .map(fav -> mapToDTO(fav.getProperty()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isFavorite(String userEmail, Long propertyId) {
        return userRepository.findByEmail(userEmail)
                .map(user -> favoriteRepository.existsByUserIdAndPropertyId(user.getId(), propertyId))
                .orElse(false);
    }

    private PropertyDTO mapToDTO(Property property) {
        return PropertyDTO.builder()
                .id(property.getId())
                .title(property.getTitle())
                .description(property.getDescription())
                .price(property.getPrice())
                .additionalFees(property.getAdditionalFees() != null ? property.getAdditionalFees().doubleValue() : null)
                .discountPercentage(property.getDiscountPercentage() != null ? property.getDiscountPercentage().doubleValue() : null)
                .city(property.getCity())
                .address(property.getAddress())
                .images(property.getImages())
                .videoTour(property.getVideoTour())
                .ownerId(property.getOwner().getId())
                .ownerName(property.getOwner().getName())
                .createdAt(property.getCreatedAt())
                .build();
    }
}