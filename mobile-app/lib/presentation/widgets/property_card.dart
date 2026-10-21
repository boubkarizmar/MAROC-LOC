import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/utils/formatters.dart';
import '../../domain/entities/property.dart';
import '../../generated/l10n/app_localizations.dart';
import 'favorite_button.dart';

class PropertyCard extends StatelessWidget {
  final Property? property;

  const PropertyCard({super.key, this.property});

  factory PropertyCard.placeholder() {
    return const PropertyCard();
  }

  @override
  Widget build(BuildContext context) {
    if (property == null) {
      return _buildPlaceholder(context);
    }

    final p = property!;
    final l10n = AppLocalizations.of(context);
    final displayPrice = p.finalPrice ?? p.price;
    return Semantics(
      container: true,
      label:
          '${p.title}, ${p.city}, ${formatPrice(context, displayPrice)}, ${p.rooms}${l10n.property_rooms_unit}',
      child: Card(
        clipBehavior: Clip.antiAlias,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image with favorite button
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Semantics(
                image: true,
                label: l10n.property_image_of(p.title),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    Container(
                      color: AppTheme.gray300,
                      child: p.coverImage != null
                          ? CachedNetworkImage(
                              imageUrl: p.coverImage!,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Shimmer.fromColors(
                                baseColor: context.shimmerBase,
                                highlightColor: context.shimmerHighlight,
                                child: Container(color: context.surfaceColor),
                              ),
                              errorWidget: (context, url, error) => Container(
                                color: context.shimmerBase,
                                child: const Icon(Icons.image_not_supported,
                                    color: AppTheme.gray500),
                              ),
                            )
                          : const Icon(Icons.image, size: 48),
                    ),
                    PositionedDirectional(
                      top: 12,
                      end: 12,
                      child: FavoriteButton(propertyId: p.id),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Semantics(
                    header: true,
                    child: Text(
                      p.title,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    p.city,
                    style: TextStyle(color: context.textSecondary),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Semantics(
                        label: formatPrice(context, displayPrice),
                        child: Text(
                          formatPrice(context, displayPrice),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      ),
                      Row(
                        children: [
                          const Icon(Icons.square_foot, size: 16),
                          const SizedBox(width: 4),
                          Text(formatArea(context, p.surface)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      _FeatureChip(
                          icon: Icons.bed,
                          label: '${p.rooms}${l10n.property_rooms_unit}'),
                      if (p.bedrooms != null)
                        _FeatureChip(
                            icon: Icons.bedroom_parent,
                            label:
                                '${p.bedrooms}${l10n.property_bedrooms_unit}'),
                      if (p.hasParking == true)
                        _FeatureChip(
                            icon: Icons.local_parking,
                            label: l10n.property_feature_parking),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 16 / 9,
            child: Container(
              color: AppTheme.gray300,
              child: const Center(child: Icon(Icons.image, size: 48)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 16,
                  width: 200,
                  decoration: BoxDecoration(
                    color: AppTheme.gray300,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  height: 14,
                  width: 120,
                  decoration: BoxDecoration(
                    color: AppTheme.gray300,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FeatureChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _FeatureChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      child: Chip(
        avatar: Icon(icon, size: 16),
        label: Text(label, style: const TextStyle(fontSize: 12)),
        padding: EdgeInsets.zero,
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
      ),
    );
  }
}
