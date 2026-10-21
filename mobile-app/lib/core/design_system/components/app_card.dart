import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../theme/theme_extensions.dart';
import '../tokens/app_tokens.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final double borderRadius;
  final List<BoxShadow>? shadows;
  final Color? backgroundColor;
  final Border? border;
  final bool animate;

  const AppCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(16),
    this.borderRadius = AppTokens.radiusLg,
    this.shadows,
    this.backgroundColor,
    this.border,
    this.animate = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    Widget card = Container(
      decoration: BoxDecoration(
        color: backgroundColor ?? colorScheme.surface,
        borderRadius: BorderRadius.circular(borderRadius),
        border: border ??
            Border.all(
              color: colorScheme.outlineVariant,
              width: 1,
            ),
        boxShadow: shadows ??
            (theme.brightness == Brightness.dark
                ? null
                : [
                    BoxShadow(
                      color: colorScheme.shadow.withValues(alpha: 0.06),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ]),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: Padding(
          padding: padding,
          child: child,
        ),
      ),
    );

    if (onTap != null) {
      card = Material(
        color: Theme.of(context).colorScheme.surface.withValues(alpha: 0),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(borderRadius),
          child: card,
        ),
      );
    }

    if (animate && onTap != null) {
      return AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeOut,
        child: card,
      );
    }

    return card;
  }
}

class AppPropertyCard extends StatelessWidget {
  final String? imageUrl;
  final String title;
  final String? location;
  final String? price;
  final String? pricePerMeter;
  final List<String>? tags;
  final VoidCallback? onTap;
  final VoidCallback? onFavorite;
  final bool isFavorite;

  const AppPropertyCard({
    super.key,
    this.imageUrl,
    required this.title,
    this.location,
    this.price,
    this.pricePerMeter,
    this.tags,
    this.onTap,
    this.onFavorite,
    this.isFavorite = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return AppCard(
      padding: EdgeInsets.zero,
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          Stack(
            children: [
              ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(AppTokens.radiusLg),
                ),
                child: AspectRatio(
                  aspectRatio: 16 / 10,
                  child: imageUrl != null
                      ? CachedNetworkImage(
                          imageUrl: imageUrl!,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Shimmer.fromColors(
                            baseColor: context.shimmerBase,
                            highlightColor: context.shimmerHighlight,
                            child: Container(color: colorScheme.surface),
                          ),
                          errorWidget: (context, url, error) => Container(
                            color: colorScheme.surfaceContainerHighest,
                            child: Icon(
                              Icons.image_not_supported_outlined,
                              color: colorScheme.onSurfaceVariant,
                              size: 40,
                            ),
                          ),
                        )
                      : Container(
                          color: colorScheme.surfaceContainerHighest,
                          child: Icon(
                            Icons.home_outlined,
                            color: colorScheme.onSurfaceVariant,
                            size: 40,
                          ),
                        ),
                ),
              ),
              if (tags != null && tags!.isNotEmpty)
                Positioned(
                  top: 12,
                  left: 12,
                  child: Wrap(
                    spacing: 6,
                    children: tags!.map((tag) {
                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: colorScheme.primary.withValues(alpha: 0.9),
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusFull),
                        ),
                        child: Text(
                          tag,
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: colorScheme.onPrimary,
                            fontSize: 10,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              Positioned(
                top: 12,
                right: 12,
                child: GestureDetector(
                  onTap: onFavorite,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: colorScheme.surface.withValues(alpha: 0.9),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isFavorite ? Icons.favorite : Icons.favorite_border,
                      color: isFavorite
                          ? colorScheme.error
                          : colorScheme.onSurfaceVariant,
                      size: 18,
                    ),
                  ),
                ),
              ),
            ],
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (location != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.location_on_outlined,
                        size: 14,
                        color: colorScheme.onSurfaceVariant,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          location!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 12),
                Row(
                  children: [
                    if (price != null)
                      Text(
                        price!,
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    if (pricePerMeter != null) ...[
                      const SizedBox(width: 8),
                      Text(
                        pricePerMeter!,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
