import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../generated/l10n/app_localizations.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/theme/app_theme.dart';
import '../../core/design_system/components/app_button.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../services/api_client.dart';
import '../../services/property_reservation_service.dart';
import '../../services/property_visit_service.dart';
import '../../services/recently_viewed_service.dart';
import '../../core/constants/api_constants.dart';
import '../../core/utils/formatters.dart';

import '../providers/property_provider.dart';
import '../providers/favorite_provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/boost_bottom_sheet.dart';
import 'image_gallery_page.dart';

class PropertyDetailPage extends ConsumerStatefulWidget {
  final int propertyId;

  const PropertyDetailPage({super.key, required this.propertyId});

  @override
  ConsumerState<PropertyDetailPage> createState() => _PropertyDetailPageState();
}

class _PropertyDetailPageState extends ConsumerState<PropertyDetailPage> {
  List<dynamic> _reviews = [];
  bool _reviewsLoading = false;
  String? _reviewsError;
  bool _isReserving = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      await ref
          .read(propertyProvider.notifier)
          .loadPropertyDetail(widget.propertyId);
      final property = ref.read(propertyProvider).selectedProperty;
      if (property != null) {
        await RecentlyViewedService().addRecentlyViewed(widget.propertyId);
      }
      ref.read(favoriteProvider.notifier).checkFavorite(widget.propertyId);
      ref
          .read(propertyProvider.notifier)
          .loadSimilarProperties(widget.propertyId);
      _fetchReviews();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(propertyProvider);
    final property = state.selectedProperty;
    final favoriteState = ref.watch(favoriteProvider);
    final isFav = favoriteState.isFavorite(widget.propertyId);
    final authState = ref.watch(authProvider);
    final isOwner =
        property?.ownerId != null && property?.ownerId == authState.user?.id;

    final isAuthenticated = authState.isAuthenticated;
    final isAvailableForTransaction = property != null &&
        (property.status.toString().toUpperCase() == 'AVAILABLE' ||
            property.status.toString().toUpperCase() == 'APPROVED');
    final canScheduleVisit = property != null &&
        isAuthenticated &&
        !isOwner &&
        isAvailableForTransaction;

    return Scaffold(
      backgroundColor: context.backgroundColor,
      floatingActionButton: canScheduleVisit
          ? FloatingActionButton.extended(
              onPressed: () => _showScheduleVisitBottomSheet(property),
              icon: Icon(Icons.calendar_today,
                  color: Theme.of(context).colorScheme.onPrimary),
              label: Text(
                  AppLocalizations.of(context).property_detail_schedule_visit),
              backgroundColor: Theme.of(context).colorScheme.primary,
              foregroundColor: Theme.of(context).colorScheme.onPrimary,
            )
          : null,
      body: state.isLoading
          ? Center(
              child: CircularProgressIndicator(
                  color: Theme.of(context).colorScheme.primary))
          : state.error != null
              ? _buildError(state.error!)
              : property == null
                  ? Center(
                      child:
                          Text(AppLocalizations.of(context).property_not_found))
                  : CustomScrollView(
                      slivers: [
                        _buildSliverAppBar(
                            property, isFav, isOwner, isAuthenticated),
                        SliverPadding(
                          padding: const EdgeInsets.all(16),
                          sliver: SliverList(
                            delegate: SliverChildListDelegate([
                              _buildImageGallery(property),
                              const SizedBox(height: 24),
                              _buildTitleSection(property),
                              const SizedBox(height: 24),
                              _buildFeaturesSection(property),
                              const SizedBox(height: 24),
                              _buildDescriptionSection(property),
                              const SizedBox(height: 24),
                              if (property.videoTour != null &&
                                  property.videoTour!.isNotEmpty) ...[
                                _buildVideoTour(property.videoTour),
                                const SizedBox(height: 24),
                              ],
                              _buildContactSection(
                                property,
                                isOwner: isOwner,
                                isAuthenticated: isAuthenticated,
                              ),
                              const SizedBox(height: 24),
                              _buildSimilarProperties(),
                              const SizedBox(height: 24),
                              _buildReviewsSection(),
                              const SizedBox(height: 32),
                            ]),
                          ),
                        ),
                      ],
                    ),
    );
  }

  Widget _buildSliverAppBar(
      dynamic property, bool isFav, bool isOwner, bool isAuthenticated) {
    return SliverAppBar(
      expandedHeight: 280,
      floating: false,
      pinned: true,
      elevation: 0,
      backgroundColor: Theme.of(context).colorScheme.primary,
      flexibleSpace: FlexibleSpaceBar(
        background: property?.coverImage != null
            ? CachedNetworkImage(
                imageUrl: property.coverImage!,
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(
                    color:
                        Theme.of(context).colorScheme.surfaceContainerHighest),
                errorWidget: (_, __, ___) => Container(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  child: Icon(Icons.image,
                      size: 48,
                      color: Theme.of(context).colorScheme.onSurfaceVariant),
                ),
              )
            : Container(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                child: Icon(Icons.home,
                    size: 48,
                    color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),
      ),
      actions: [
        if (isOwner)
          IconButton(
            icon: Icon(Icons.rocket_launch,
                color: Theme.of(context).colorScheme.onPrimary),
            tooltip: AppLocalizations.of(context).tooltip_boost,
            onPressed: () {
              final property = ref.read(propertyProvider).selectedProperty;
              if (property != null) {
                showBoostBottomSheet(
                  context,
                  propertyId: property.id,
                  propertyTitle: property.title,
                );
              }
            },
          ),
        IconButton(
          icon: Icon(
            isFav ? Icons.favorite : Icons.favorite_border,
            color: isFav
                ? Theme.of(context).colorScheme.error
                : Theme.of(context).colorScheme.onPrimary,
          ),
          tooltip: isFav
              ? AppLocalizations.of(context).tooltip_unfavorite
              : AppLocalizations.of(context).tooltip_favorite,
          onPressed: () {
            if (!isAuthenticated) {
              _showLoginPrompt(context);
              return;
            }
            ref
                .read(favoriteProvider.notifier)
                .toggleFavorite(widget.propertyId);
          },
        ),
        IconButton(
          icon:
              Icon(Icons.share, color: Theme.of(context).colorScheme.onPrimary),
          tooltip: AppLocalizations.of(context).tooltip_share,
          onPressed: () {
            final property = ref.read(propertyProvider).selectedProperty;
            if (property != null) {
              Share.share(
                  '${property.title} - ${property.price.toStringAsFixed(0)} MAD\n${property.city}');
            }
          },
        ),
      ],
    );
  }

  Widget _buildTitleSection(dynamic property) {
    final colorScheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context);
    final price = property.finalPrice?.toStringAsFixed(0) ??
        property.price.toStringAsFixed(0);
    final typeUpper = property.type?.toString().toUpperCase() ?? '';
    final typeLabel = typeUpper == 'RENT'
        ? l10n.property_type_rent
        : typeUpper == 'MORTGAGE'
            ? l10n.property_type_mortgage
            : l10n.property_type_buy;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(AppTokens.radiusSm),
              ),
              child: Text(
                typeLabel,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: colorScheme.primary,
                ),
              ),
            ),
            if (property.isVerified == true)
              Container(
                margin: const EdgeInsetsDirectional.only(start: 8),
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.success50,
                  borderRadius: BorderRadius.circular(AppTokens.radiusSm),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.verified,
                        size: 12, color: AppTheme.success500),
                    const SizedBox(width: 4),
                    Text(
                      AppLocalizations.of(context).property_verified,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.success500,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
        const SizedBox(height: 12),
        Text(
          property.title,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: context.textPrimary,
            height: 1.2,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Icon(Icons.location_on, size: 16, color: colorScheme.secondary),
            const SizedBox(width: 4),
            Text(
              '${property.city}${property.address.isNotEmpty ? ', ${property.address}' : ''}',
              style: TextStyle(fontSize: 14, color: context.textSecondary),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Text(
              '$price MAD',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w800,
                color: colorScheme.primary,
              ),
            ),
            if (typeUpper == 'RENT')
              Text(
                AppLocalizations.of(context).property_per_month,
                style: TextStyle(
                  fontSize: 14,
                  color: context.textMuted,
                  fontWeight: FontWeight.w600,
                ),
              ),
          ],
        ),
        if (property.discountPercentage != null &&
            property.discountPercentage! > 0)
          Text(
            AppLocalizations.of(context).property_detail_original_price(
                formatPrice(context, property.price)),
            style: TextStyle(
              fontSize: 14,
              color: context.textMuted,
              decoration: TextDecoration.lineThrough,
            ),
          ),
      ],
    );
  }

  Widget _buildFeaturesSection(dynamic property) {
    final colorScheme = Theme.of(context).colorScheme;
    final features = <Map<String, dynamic>>[
      {
        'icon': Icons.square_foot,
        'label': formatArea(context, property.surface)
      },
      {
        'icon': Icons.bed,
        'label':
            '${property.rooms}${AppLocalizations.of(context).property_rooms_unit}'
      },
      if (property.bedrooms != null)
        {
          'icon': Icons.bedroom_parent,
          'label':
              '${property.bedrooms}${AppLocalizations.of(context).property_bedrooms_unit}'
        },
      if (property.bathrooms != null)
        {
          'icon': Icons.bathroom,
          'label':
              '${property.bathrooms}${AppLocalizations.of(context).property_bathrooms_unit}'
        },
      if (property.hasParking == true)
        {
          'icon': Icons.local_parking,
          'label': AppLocalizations.of(context).property_feature_parking
        },
      if (property.hasPool == true)
        {
          'icon': Icons.pool,
          'label': AppLocalizations.of(context).property_feature_pool
        },
      if (property.furnished == true)
        {
          'icon': Icons.chair,
          'label': AppLocalizations.of(context).property_feature_furnished
        },
      if (property.hasAirConditioning == true)
        {
          'icon': Icons.ac_unit,
          'label': AppLocalizations.of(context).property_feature_ac
        },
      if (property.hasGarden == true)
        {
          'icon': Icons.yard,
          'label': AppLocalizations.of(context).property_feature_garden
        },
      if (property.hasElevator == true)
        {
          'icon': Icons.elevator,
          'label': AppLocalizations.of(context).property_feature_elevator
        },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context).property_characteristics,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: context.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: features.map((f) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: colorScheme.secondaryContainer.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                border: Border.all(
                    color: colorScheme.outlineVariant.withValues(alpha: 0.5)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(f['icon'] as IconData,
                      size: 16, color: colorScheme.primary),
                  const SizedBox(width: 6),
                  Text(
                    f['label'] as String,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: context.textPrimary,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildDescriptionSection(dynamic property) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context).property_description,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: context.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          property.description,
          style: TextStyle(
            fontSize: 15,
            color: context.textSecondary,
            height: 1.6,
          ),
        ),
      ],
    );
  }

  Widget _buildContactSection(
    dynamic property, {
    required bool isOwner,
    required bool isAuthenticated,
  }) {
    final colorScheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context);
    final status = property.status?.toString().toUpperCase() ?? '';
    final isAvailableForTransaction =
        status == 'AVAILABLE' || status == 'APPROVED';
    final canTransact = isAuthenticated &&
        !isOwner &&
        isAvailableForTransaction;
    final typeUpper = property.type?.toString().toUpperCase() ?? '';
    final isRent = typeUpper == 'RENT';
    final isBuy = typeUpper == 'BUY';
    final isMortgage = typeUpper == 'MORTGAGE';
    final transactionType = isRent ? 'RESERVATION' : 'PURCHASE';

    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  if (property.ownerId != null) {
                    context.push(
                        '/chat/${property.ownerId}?name=${Uri.encodeComponent(property.ownerName ?? l10n.property_detail_owner_default)}&propertyId=${property.id}');
                  } else {
                    context.push('/messages');
                  }
                },
                icon: const Icon(Icons.message, size: 18),
                label: Text(l10n.property_message_cta),
                style: ElevatedButton.styleFrom(
                  backgroundColor: colorScheme.primary,
                  foregroundColor: colorScheme.onPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  final phone = property.phoneNumber;
                  if (phone != null && phone.isNotEmpty) {
                    launchUrl(Uri.parse('tel:$phone'));
                  }
                },
                icon: const Icon(Icons.phone, size: 18),
                label: Text(l10n.property_call_cta),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.success500,
                  foregroundColor: colorScheme.onPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                  ),
                ),
              ),
            ),
          ],
        ),
        if (property.whatsappNumber != null &&
            property.whatsappNumber.isNotEmpty) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                final wa =
                    property.whatsappNumber.replaceAll(RegExp(r'\D'), '');
                final message =
                    '${l10n.property_whatsapp_default_message}: ${property.title}';
                launchUrl(Uri.parse(
                    'https://wa.me/$wa?text=${Uri.encodeComponent(message)}'));
              },
              icon: const Icon(Icons.chat, size: 18),
              label: Text(l10n.property_whatsapp),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTokens.whatsappBrand,
                foregroundColor: colorScheme.onPrimary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                ),
              ),
            ),
          ),
        ],
        if (!isOwner && property.ownerId != null) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => context.push('/owners/${property.ownerId}'),
              icon: const Icon(Icons.person_outline, size: 18),
              label: Text(l10n.property_detail_view_owner_profile),
              style: OutlinedButton.styleFrom(
                foregroundColor: colorScheme.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                ),
              ),
            ),
          ),
        ],
        if (isMortgage) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _showRahnInfoBottomSheet(property),
              icon: const Icon(Icons.info_outline, size: 18),
              label: Text(l10n.property_detail_rahn),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.gold400,
                foregroundColor: colorScheme.onSurface,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                ),
              ),
            ),
          ),
        ] else if (canTransact && (isRent || isBuy)) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isReserving
                  ? null
                  : () => _handleReserveOrBuy(property, transactionType),
              icon: _isReserving
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Icon(isRent ? Icons.calendar_month : Icons.shopping_cart,
                      size: 18),
              label: Text(
                  isRent ? l10n.property_detail_reserve : l10n.property_detail_buy),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary500,
                foregroundColor: colorScheme.onPrimary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }

  void _showRahnInfoBottomSheet(dynamic property) {
    final l10n = AppLocalizations.of(context);
    showModalBottomSheet(
      context: context,
      backgroundColor: context.backgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AppTokens.radiusLg)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: context.borderColor,
                  borderRadius: BorderRadius.circular(AppTokens.radiusFull),
                ),
              ),
            ),
            Text(
              l10n.property_detail_rahn,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: context.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              l10n.property_detail_rahn_info,
              style: TextStyle(
                fontSize: 15,
                color: context.textSecondary,
                height: 1.6,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: Text(l10n.close),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Future<void> _handleReserveOrBuy(dynamic property, String transactionType) async {
    final l10n = AppLocalizations.of(context);
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _isReserving = true);

    try {
      final params = await PropertyReservationService().initiateTransaction(
        property.id as int,
        transactionType,
        lang: Localizations.localeOf(context).languageCode,
      );

      final orderId = params['orderId']?.toString() ?? params['oid']?.toString();
      final amount = (params['amount'] as num?)?.toDouble();
      if (orderId == null || orderId.isEmpty || amount == null) {
        throw Exception('Réponse de réservation invalide');
      }

      if (!mounted) return;
      context.push(
        '/payment/cmi',
        extra: <String, dynamic>{
          'amount': amount,
          'description': transactionType == 'RESERVATION'
              ? l10n.payment_reservation_description
              : l10n.payment_purchase_description,
          'orderId': orderId,
          'propertyId': property.id as int,
          'transactionType': transactionType,
          'email': ref.read(authProvider).user?.email ?? '',
        },
      );
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(
          content: Text('${l10n.payment_error_initiation}: ${e.toString()}'),
          backgroundColor: Theme.of(context).colorScheme.error,
        ),
      );
    } finally {
      if (mounted) setState(() => _isReserving = false);
    }
  }

  Widget _buildImageGallery(dynamic property) {
    final colorScheme = Theme.of(context).colorScheme;
    final images = property.images ?? [];
    if (images.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: images.length,
            itemBuilder: (context, index) {
              return Semantics(
                button: true,
                label: AppLocalizations.of(context)
                    .property_image_of(property.title),
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ImageGalleryPage(
                          images: images.cast<String>(),
                          initialIndex: index,
                        ),
                      ),
                    );
                  },
                  child: Container(
                    width: 100,
                    margin: const EdgeInsetsDirectional.only(end: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                      border: index == 0
                          ? Border.all(color: colorScheme.primary, width: 2)
                          : null,
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                      child: CachedNetworkImage(
                        imageUrl: images[index],
                        fit: BoxFit.cover,
                        placeholder: (_, __) => Container(
                            color: colorScheme.surfaceContainerHighest),
                        errorWidget: (_, __, ___) => Container(
                          color: colorScheme.surfaceContainerHighest,
                          child: Icon(Icons.image,
                              color: colorScheme.onSurfaceVariant),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildVideoTour(String? videoUrl) {
    final colorScheme = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          AppLocalizations.of(context).property_video_visit,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: context.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        Semantics(
          button: true,
          label: AppLocalizations.of(context).property_start_video,
          child: GestureDetector(
            onTap: () {
              if (videoUrl != null && videoUrl.isNotEmpty) {
                launchUrl(Uri.parse(videoUrl));
              }
            },
            child: Container(
              height: 200,
              decoration: BoxDecoration(
                color: colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(AppTokens.radiusLg),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: colorScheme.primary.withValues(alpha: 0.9),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.play_arrow,
                          color: colorScheme.onPrimary, size: 32),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      AppLocalizations.of(context).property_start_video,
                      style: TextStyle(
                          color: colorScheme.onPrimary,
                          fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSimilarProperties() {
    final colorScheme = Theme.of(context).colorScheme;
    return Consumer(
      builder: (context, ref, child) {
        final state = ref.watch(propertyProvider);
        final similar = state.similarProperties;

        if (similar.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              AppLocalizations.of(context).property_similar,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: context.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 260,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: similar.length,
                itemBuilder: (context, index) {
                  final property = similar[index];
                  return Semantics(
                    button: true,
                    label:
                        '${property.title}, ${property.city}, ${property.price.toStringAsFixed(0)} ${AppLocalizations.of(context).property_currency}',
                    child: GestureDetector(
                      onTap: () => context.push('/property/${property.id}'),
                      child: Container(
                        width: 200,
                        margin: const EdgeInsetsDirectional.only(end: 12),
                        decoration: BoxDecoration(
                          color: context.cardColor,
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusLg),
                          boxShadow: [
                            BoxShadow(
                              color: colorScheme.shadow.withValues(alpha: 0.05),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            ClipRRect(
                              borderRadius: const BorderRadius.vertical(
                                  top: Radius.circular(AppTokens.radiusLg)),
                              child: CachedNetworkImage(
                                imageUrl: property.coverImage ?? '',
                                height: 130,
                                width: 200,
                                fit: BoxFit.cover,
                                placeholder: (_, __) => Container(
                                    color: colorScheme.surfaceContainerHighest),
                                errorWidget: (_, __, ___) => Container(
                                  color: colorScheme.surfaceContainerHighest,
                                  child: Icon(Icons.home,
                                      color: colorScheme.onSurfaceVariant),
                                ),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    property.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: context.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(Icons.location_on,
                                          size: 12,
                                          color: colorScheme.secondary),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          property.city,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: context.textSecondary,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    '${property.finalPrice?.toStringAsFixed(0) ?? property.price.toStringAsFixed(0)} MAD',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800,
                                      color: colorScheme.primary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildError(String error) {
    final colorScheme = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: colorScheme.error),
            const SizedBox(height: 16),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(color: context.textSecondary),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                ref
                    .read(propertyProvider.notifier)
                    .loadPropertyDetail(widget.propertyId);
              },
              child: Text(AppLocalizations.of(context).property_retry),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _fetchReviews() async {
    setState(() {
      _reviewsLoading = true;
      _reviewsError = null;
    });
    try {
      final client = ApiClient();
      final response = await client
          .get('${ApiConstants.reviews}/property/${widget.propertyId}');
      setState(() {
        _reviews = response.data as List<dynamic>? ?? [];
        _reviewsLoading = false;
      });
    } catch (e) {
      setState(() {
        _reviewsError = e.toString();
        _reviewsLoading = false;
      });
    }
  }

  Widget _buildReviewsSection() {
    final colorScheme = Theme.of(context).colorScheme;
    final averageRating = _reviews.isNotEmpty
        ? _reviews.fold<double>(
                0, (sum, r) => sum + ((r['rating'] ?? 0) as num).toDouble()) /
            _reviews.length
        : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              AppLocalizations.of(context).property_detail_reviews_title,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: context.textPrimary,
              ),
            ),
            if (_reviews.isNotEmpty)
              Row(
                children: [
                  Icon(Icons.star, size: 16, color: AppTheme.gold400),
                  const SizedBox(width: 4),
                  Text(
                    averageRating.toStringAsFixed(1),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: context.textPrimary,
                    ),
                  ),
                  Text(
                    ' (${_reviews.length})',
                    style: TextStyle(
                      fontSize: 14,
                      color: context.textSecondary,
                    ),
                  ),
                ],
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (_reviewsLoading)
          Center(child: CircularProgressIndicator(color: colorScheme.primary))
        else if (_reviewsError != null)
          Text(
            AppLocalizations.of(context).property_detail_reviews_error,
            style: TextStyle(color: colorScheme.error),
          )
        else if (_reviews.isEmpty)
          Text(
            AppLocalizations.of(context).property_detail_no_reviews,
            style: TextStyle(color: context.textSecondary),
          )
        else
          ..._reviews.map((review) {
            final rating = ((review['rating'] ?? 0) as num).toInt();
            final date = review['createdAt'] != null
                ? DateTime.tryParse(review['createdAt'].toString())
                : null;
            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(AppTokens.space4),
              decoration: BoxDecoration(
                color: context.cardColor,
                borderRadius: BorderRadius.circular(AppTokens.radiusMd),
                border: Border.all(color: context.borderColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 16,
                        backgroundColor: colorScheme.primaryContainer,
                        child: Text(
                          (review['reviewerName']?.toString() ?? 'A')[0]
                              .toUpperCase(),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: colorScheme.primary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              review['reviewerName']?.toString() ??
                                  AppLocalizations.of(context)
                                      .property_detail_anonymous,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: context.textPrimary,
                              ),
                            ),
                            Row(
                              children: List.generate(5, (i) {
                                return Icon(
                                  i < rating ? Icons.star : Icons.star_border,
                                  size: 14,
                                  color: i < rating
                                      ? AppTheme.gold400
                                      : colorScheme.outlineVariant,
                                );
                              }),
                            ),
                          ],
                        ),
                      ),
                      if (date != null)
                        Text(
                          '${date.day}/${date.month}/${date.year}',
                          style: TextStyle(
                            fontSize: 12,
                            color: context.textMuted,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    review['comment']?.toString() ?? '',
                    style: TextStyle(
                      fontSize: 14,
                      color: context.textSecondary,
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            );
          }),
        const SizedBox(height: 12),
        if (ref.watch(authProvider).isAuthenticated)
          AppButton(
            label: AppLocalizations.of(context).property_detail_write_review,
            variant: AppButtonVariant.outlined,
            fullWidth: true,
            onPressed: () => _showWriteReviewBottomSheet(),
          )
        else
          AppButton(
            label: AppLocalizations.of(context).property_detail_login_to_review,
            variant: AppButtonVariant.ghost,
            fullWidth: true,
            onPressed: () => context.push('/login'),
          ),
      ],
    );
  }

  void _showWriteReviewBottomSheet() {
    int selectedRating = 0;
    final commentController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.backgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AppTokens.radiusLg)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsetsDirectional.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
                start: AppTokens.space4,
                end: AppTokens.space4,
                top: AppTokens.space4,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: AppTokens.space4),
                        decoration: BoxDecoration(
                          color: context.borderColor,
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusFull),
                        ),
                      ),
                    ),
                    Text(
                      AppLocalizations.of(context).property_detail_write_review,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: context.textPrimary,
                      ),
                    ),
                    const SizedBox(height: AppTokens.space4),
                    Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: List.generate(5, (index) {
                          return GestureDetector(
                            onTap: () =>
                                setModalState(() => selectedRating = index + 1),
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 4),
                              child: Icon(
                                index < selectedRating
                                    ? Icons.star
                                    : Icons.star_border,
                                size: 32,
                                color: index < selectedRating
                                    ? AppTheme.gold400
                                    : Theme.of(ctx).colorScheme.outlineVariant,
                              ),
                            ),
                          );
                        }),
                      ),
                    ),
                    const SizedBox(height: AppTokens.space4),
                    TextField(
                      controller: commentController,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: AppLocalizations.of(context)
                            .property_detail_review_hint,
                        hintStyle: TextStyle(color: context.textMuted),
                        filled: true,
                        fillColor: context.surfaceContainerHighestColor,
                        border: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusMd),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusMd),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusMd),
                          borderSide: BorderSide(
                              color: Theme.of(ctx).colorScheme.primary,
                              width: 2),
                        ),
                      ),
                    ),
                    const SizedBox(height: AppTokens.space4),
                    AppButton(
                      label: AppLocalizations.of(context)
                          .property_detail_review_send,
                      fullWidth: true,
                      isLoading: isSubmitting,
                      onPressed: selectedRating == 0
                          ? null
                          : () async {
                              setModalState(() => isSubmitting = true);
                              try {
                                final client = ApiClient();
                                final comment = commentController.text.trim();
                                final data = <String, dynamic>{
                                  'rating': selectedRating,
                                };
                                if (comment.isNotEmpty) {
                                  data['comment'] = comment;
                                }
                                await client.post(
                                  '${ApiConstants.reviews}/property/${widget.propertyId}',
                                  data: data,
                                );
                                if (ctx.mounted) Navigator.pop(ctx);
                                _fetchReviews();
                              } catch (e) {
                                setModalState(() => isSubmitting = false);
                                if (ctx.mounted) {
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    SnackBar(
                                        content: Text(AppLocalizations.of(ctx)
                                            .common_error_with_message(
                                                e.toString()))),
                                  );
                                }
                              }
                            },
                    ),
                    const SizedBox(height: AppTokens.space4),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showScheduleVisitBottomSheet(dynamic property) {
    DateTime? selectedDate;
    TimeOfDay? selectedTime;
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    final notesController = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.backgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AppTokens.radiusLg)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            Future<void> pickDate() async {
              final now = DateTime.now();
              final date = await showDatePicker(
                context: ctx,
                initialDate: now,
                firstDate: now,
                lastDate: now.add(const Duration(days: 90)),
              );
              if (date != null) {
                setModalState(() => selectedDate = date);
              }
            }

            Future<void> pickTime() async {
              final time = await showTimePicker(
                context: ctx,
                initialTime: TimeOfDay.now(),
              );
              if (time != null) {
                setModalState(() => selectedTime = time);
              }
            }

            String? formatDate() {
              if (selectedDate == null) return null;
              return '${selectedDate!.year.toString().padLeft(4, '0')}-${selectedDate!.month.toString().padLeft(2, '0')}-${selectedDate!.day.toString().padLeft(2, '0')}';
            }

            String? formatTime() {
              if (selectedTime == null) return null;
              return '${selectedTime!.hour.toString().padLeft(2, '0')}:${selectedTime!.minute.toString().padLeft(2, '0')}';
            }

            return Padding(
              padding: EdgeInsetsDirectional.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
                start: AppTokens.space4,
                end: AppTokens.space4,
                top: AppTokens.space4,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        margin: const EdgeInsets.only(bottom: AppTokens.space4),
                        decoration: BoxDecoration(
                          color: context.borderColor,
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusFull),
                        ),
                      ),
                    ),
                    Text(
                      AppLocalizations.of(context)
                          .property_detail_schedule_visit,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: context.textPrimary,
                      ),
                    ),
                    const SizedBox(height: AppTokens.space4),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: pickDate,
                            icon: const Icon(Icons.calendar_today, size: 18),
                            label: Text(
                              selectedDate != null
                                  ? '${selectedDate!.day}/${selectedDate!.month}/${selectedDate!.year}'
                                  : AppLocalizations.of(context)
                                      .property_detail_visit_date,
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: context.textPrimary,
                              side: BorderSide(color: context.borderColor),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.circular(AppTokens.radiusMd),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: AppTokens.space3),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: pickTime,
                            icon: const Icon(Icons.access_time, size: 18),
                            label: Text(
                              selectedTime != null
                                  ? '${selectedTime!.hour.toString().padLeft(2, '0')}:${selectedTime!.minute.toString().padLeft(2, '0')}'
                                  : AppLocalizations.of(context)
                                      .property_detail_visit_time,
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: context.textPrimary,
                              side: BorderSide(color: context.borderColor),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.circular(AppTokens.radiusMd),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppTokens.space4),
                    TextField(
                      controller: nameController,
                      decoration: InputDecoration(
                        hintText: AppLocalizations.of(context)
                            .property_detail_visit_name,
                        hintStyle: TextStyle(color: context.textMuted),
                        filled: true,
                        fillColor: context.surfaceContainerHighestColor,
                        border: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusMd),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusMd),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusMd),
                          borderSide: BorderSide(
                              color: Theme.of(ctx).colorScheme.primary,
                              width: 2),
                        ),
                      ),
                    ),
                    const SizedBox(height: AppTokens.space4),
                    TextField(
                      controller: phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(
                        hintText: AppLocalizations.of(context)
                            .property_detail_visit_phone,
                        hintStyle: TextStyle(color: context.textMuted),
                        filled: true,
                        fillColor: context.surfaceContainerHighestColor,
                        border: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusMd),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusMd),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusMd),
                          borderSide: BorderSide(
                              color: Theme.of(ctx).colorScheme.primary,
                              width: 2),
                        ),
                      ),
                    ),
                    const SizedBox(height: AppTokens.space4),
                    TextField(
                      controller: notesController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText: AppLocalizations.of(context)
                            .property_detail_visit_notes,
                        hintStyle: TextStyle(color: context.textMuted),
                        filled: true,
                        fillColor: context.surfaceContainerHighestColor,
                        border: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusMd),
                          borderSide: BorderSide.none,
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusMd),
                          borderSide: BorderSide.none,
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius:
                              BorderRadius.circular(AppTokens.radiusMd),
                          borderSide: BorderSide(
                              color: Theme.of(ctx).colorScheme.primary,
                              width: 2),
                        ),
                      ),
                    ),
                    const SizedBox(height: AppTokens.space4),
                    AppButton(
                      label: AppLocalizations.of(context)
                          .property_detail_visit_confirm,
                      fullWidth: true,
                      isLoading: isSubmitting,
                      onPressed: selectedDate == null ||
                              selectedTime == null ||
                              nameController.text.trim().isEmpty ||
                              phoneController.text.trim().isEmpty
                          ? null
                          : () async {
                              setModalState(() => isSubmitting = true);
                              try {
                                final visitDate = formatDate()!;
                                final visitTimeStr = formatTime()!;
                                final visitorName = nameController.text.trim();
                                final visitorPhone =
                                    phoneController.text.trim();
                                final notes = notesController.text.isNotEmpty
                                    ? notesController.text
                                    : null;
                                await PropertyVisitService().scheduleVisit(
                                  propertyId: widget.propertyId,
                                  visitDate: visitDate,
                                  visitTime: visitTimeStr,
                                  visitorName: visitorName,
                                  visitorPhone: visitorPhone,
                                  notes: notes,
                                );
                                if (ctx.mounted) Navigator.pop(ctx);
                                if (mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                        content: Text(AppLocalizations.of(
                                                context)
                                            .property_detail_visit_success)),
                                  );
                                }
                              } catch (e) {
                                setModalState(() => isSubmitting = false);
                                if (ctx.mounted) {
                                  ScaffoldMessenger.of(ctx).showSnackBar(
                                    SnackBar(
                                        content: Text(AppLocalizations.of(ctx)
                                            .common_error_with_message(
                                                e.toString()))),
                                  );
                                }
                              }
                            },
                    ),
                    const SizedBox(height: AppTokens.space4),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showLoginPrompt(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(
            AppLocalizations.of(context).property_detail_login_required_title),
        content: Text(
          AppLocalizations.of(context).property_detail_login_required_message,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(AppLocalizations.of(context).cancel),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.push('/login');
            },
            child: Text(AppLocalizations.of(context).property_detail_login),
          ),
        ],
      ),
    );
  }
}
