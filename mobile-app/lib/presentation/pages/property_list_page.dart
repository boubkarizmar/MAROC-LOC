import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/design_system/components/app_button.dart';
import '../../core/design_system/components/app_input.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../core/theme/theme_extensions.dart';
import '../../generated/l10n/app_localizations.dart';
import '../providers/category_provider.dart';
import '../providers/property_provider.dart';
import '../widgets/property_card.dart';

class PropertyListPage extends ConsumerStatefulWidget {
  const PropertyListPage({super.key});

  @override
  ConsumerState<PropertyListPage> createState() => _PropertyListPageState();
}

class _PropertyListPageState extends ConsumerState<PropertyListPage> {
  final ScrollController _scrollController = ScrollController();
  final TextEditingController _searchController = TextEditingController();
  Timer? _searchDebounce;
  bool _isLoadingMore = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _searchController.addListener(() => setState(() {}));
    Future.microtask(() {
      ref.read(propertyProvider.notifier).loadProperties(refresh: true);
      ref.read(categoryProvider.notifier).loadAll();
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _applyQueryParams();
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    _searchDebounce?.cancel();
    super.dispose();
  }

  void _applyQueryParams() {
    final state = GoRouterState.of(context);
    final ownerIdParam = state.uri.queryParameters['ownerId'];
    if (ownerIdParam != null && ownerIdParam.isNotEmpty) {
      final ownerId = int.tryParse(ownerIdParam);
      if (ownerId != null) {
        ref.read(propertyProvider.notifier).search(ownerId: ownerId, debounce: false);
      }
    }
  }

  void _onSearchChanged(String value) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 500), () {
      if (!mounted) return;
      ref.read(propertyProvider.notifier).search(
            city: value.trim().isNotEmpty ? value.trim() : null,
            debounce: false,
          );
    });
  }

  void _onScroll() {
    if (_isLoadingMore) return;
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      _isLoadingMore = true;
      ref.read(propertyProvider.notifier).loadProperties().whenComplete(() {
        if (mounted) _isLoadingMore = false;
      });
    }
  }

  void _showFilterSheet() {
    final l10n = AppLocalizations.of(context);
    final categoryState = ref.read(categoryProvider);
    final cities = categoryState.cities;
    final categories = categoryState.categories;
    final transactionTypes = categoryState.transactionTypes;

    double? minPrice;
    double? maxPrice;
    String? selectedCity;
    String? selectedCategory;
    String? selectedTransactionType;
    int? minRooms;
    double? minSurface;
    bool furnished = false;
    bool hasParking = false;
    bool hasPool = false;
    bool hasGarden = false;
    bool hasAirConditioning = false;
    bool hasInternet = false;
    bool hasSecurity = false;
    bool hasBalcony = false;
    bool hasElevator = false;
    bool nearSchool = false;
    bool nearHospital = false;
    bool nearMosque = false;
    bool nearBus = false;
    bool nearTram = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: context.surfaceColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppTokens.radiusXl),
        ),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
              ),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(AppTokens.space4),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          l10n.filter_advanced_title,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          tooltip: l10n.close,
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppTokens.space4),
                    Row(
                      children: [
                        Expanded(
                          child: AppInput(
                            label:
                                l10n.filter_min_price(l10n.property_currency),
                            hint: '0',
                            keyboardType: TextInputType.number,
                            onChanged: (v) => minPrice = double.tryParse(v),
                          ),
                        ),
                        const SizedBox(width: AppTokens.space3),
                        Expanded(
                          child: AppInput(
                            label:
                                l10n.filter_max_price(l10n.property_currency),
                            hint: 'Max',
                            keyboardType: TextInputType.number,
                            onChanged: (v) => maxPrice = double.tryParse(v),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppTokens.space4),
                    _buildDropdown<String?>(
                      label: l10n.filter_city,
                      value: selectedCity,
                      items: [null, ...cities],
                      onChanged: (v) => setState(() => selectedCity = v),
                      hint: l10n.filter_all_cities,
                      itemLabel: (v) => v ?? l10n.filter_all_cities,
                    ),
                    const SizedBox(height: AppTokens.space4),
                    _buildDropdown<String?>(
                      label: l10n.filter_property_type,
                      value: selectedCategory,
                      items: [null, ...categories],
                      onChanged: (v) => setState(() => selectedCategory = v),
                      hint: l10n.filter_all_types,
                      itemLabel: (v) => v ?? l10n.filter_all_types,
                    ),
                    const SizedBox(height: AppTokens.space4),
                    _buildDropdown<String?>(
                      label: l10n.filter_transaction,
                      value: selectedTransactionType,
                      items: [null, ...transactionTypes],
                      onChanged: (v) =>
                          setState(() => selectedTransactionType = v),
                      hint: l10n.filter_all_transactions,
                      itemLabel: (v) => v ?? l10n.filter_all_transactions,
                    ),
                    const SizedBox(height: AppTokens.space4),
                    _buildDropdown<int?>(
                      label: l10n.filter_rooms,
                      value: minRooms,
                      items: const [null, 1, 2, 3, 4],
                      onChanged: (v) => setState(() => minRooms = v),
                      hint: l10n.filter_all_rooms,
                      itemLabel: (v) =>
                          v == null ? l10n.filter_all_rooms : '$v+',
                    ),
                    const SizedBox(height: AppTokens.space4),
                    AppInput(
                      label: l10n.filter_min_surface(l10n.unit_area),
                      hint: '0',
                      keyboardType: TextInputType.number,
                      onChanged: (v) => minSurface = double.tryParse(v),
                    ),
                    const SizedBox(height: AppTokens.space4),
                    Text(
                      l10n.filter_equipment,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: AppTokens.space2),
                    Wrap(
                      spacing: AppTokens.space2,
                      runSpacing: AppTokens.space2,
                      children: [
                        _buildToggle(l10n.filter_furnished, furnished,
                            (v) => setState(() => furnished = v)),
                        _buildToggle(l10n.filter_parking, hasParking,
                            (v) => setState(() => hasParking = v)),
                        _buildToggle(l10n.filter_pool, hasPool,
                            (v) => setState(() => hasPool = v)),
                        _buildToggle(l10n.filter_garden, hasGarden,
                            (v) => setState(() => hasGarden = v)),
                        _buildToggle(l10n.filter_ac, hasAirConditioning,
                            (v) => setState(() => hasAirConditioning = v)),
                        _buildToggle(l10n.filter_internet, hasInternet,
                            (v) => setState(() => hasInternet = v)),
                        _buildToggle(l10n.filter_security, hasSecurity,
                            (v) => setState(() => hasSecurity = v)),
                        _buildToggle(l10n.filter_balcony, hasBalcony,
                            (v) => setState(() => hasBalcony = v)),
                        _buildToggle(l10n.filter_elevator, hasElevator,
                            (v) => setState(() => hasElevator = v)),
                      ],
                    ),
                    const SizedBox(height: AppTokens.space4),
                    Text(
                      l10n.filter_environment,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: AppTokens.space2),
                    Wrap(
                      spacing: AppTokens.space2,
                      runSpacing: AppTokens.space2,
                      children: [
                        _buildToggle(l10n.filter_school, nearSchool,
                            (v) => setState(() => nearSchool = v)),
                        _buildToggle(l10n.filter_hospital, nearHospital,
                            (v) => setState(() => nearHospital = v)),
                        _buildToggle(l10n.filter_mosque, nearMosque,
                            (v) => setState(() => nearMosque = v)),
                        _buildToggle(l10n.filter_bus, nearBus,
                            (v) => setState(() => nearBus = v)),
                        _buildToggle(l10n.filter_tram, nearTram,
                            (v) => setState(() => nearTram = v)),
                      ],
                    ),
                    const SizedBox(height: AppTokens.space6),
                    Row(
                      children: [
                        Expanded(
                          child: AppButton(
                            label: l10n.filter_reset,
                            variant: AppButtonVariant.ghost,
                            onPressed: () {
                              setState(() {
                                minPrice = null;
                                maxPrice = null;
                                selectedCity = null;
                                selectedCategory = null;
                                selectedTransactionType = null;
                                minRooms = null;
                                minSurface = null;
                                furnished = false;
                                hasParking = false;
                                hasPool = false;
                                hasGarden = false;
                                hasAirConditioning = false;
                                hasInternet = false;
                                hasSecurity = false;
                                hasBalcony = false;
                                hasElevator = false;
                                nearSchool = false;
                                nearHospital = false;
                                nearMosque = false;
                                nearBus = false;
                                nearTram = false;
                              });
                            },
                          ),
                        ),
                        const SizedBox(width: AppTokens.space3),
                        Expanded(
                          child: AppButton(
                            label: l10n.filter_apply,
                            variant: AppButtonVariant.primary,
                            onPressed: () {
                              ref.read(propertyProvider.notifier).search(
                                    city: selectedCity,
                                    category: selectedCategory,
                                    type: selectedTransactionType,
                                    minPrice: minPrice,
                                    maxPrice: maxPrice,
                                    minRooms: minRooms,
                                    minSurface: minSurface,
                                    furnished: furnished,
                                    hasParking: hasParking,
                                    hasPool: hasPool,
                                    hasGarden: hasGarden,
                                    hasAirConditioning: hasAirConditioning,
                                    hasInternet: hasInternet,
                                    hasSecurity: hasSecurity,
                                    hasBalcony: hasBalcony,
                                    hasElevator: hasElevator,
                                    nearSchool: nearSchool,
                                    nearHospital: nearHospital,
                                    nearMosque: nearMosque,
                                    nearBus: nearBus,
                                    nearTram: nearTram,
                                    debounce: true,
                                  );
                              Navigator.pop(context);
                            },
                          ),
                        ),
                      ],
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

  Widget _buildDropdown<T>({
    required String label,
    required T value,
    required List<T> items,
    required ValueChanged<T?> onChanged,
    required String hint,
    String Function(T)? itemLabel,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context).textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 6),
        DropdownButtonFormField<T>(
          value: value,
          isExpanded: true,
          decoration: InputDecoration(
            filled: true,
            fillColor:
                context.isDark ? AppTokens.darkSurface : AppTokens.gray100,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTokens.radiusMd),
              borderSide: BorderSide.none,
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
          hint: Text(hint, style: const TextStyle(color: AppTokens.gray400)),
          items: items.map((item) {
            final text = itemLabel != null ? itemLabel(item) : item.toString();
            return DropdownMenuItem<T>(
              value: item,
              child: Text(text),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildToggle(String label, bool value, ValueChanged<bool> onChanged) {
    return FilterChip(
      label: Text(label),
      selected: value,
      onSelected: onChanged,
      backgroundColor:
          context.isDark ? AppTokens.darkSurfaceElevated : AppTokens.gray100,
      selectedColor: AppTokens.gold50,
      checkmarkColor: AppTokens.primary500,
      labelStyle: TextStyle(
        color: value ? AppTokens.primary600 : context.textSecondary,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(propertyProvider);
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.search_title),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune),
            tooltip: l10n.tooltip_filters,
            onPressed: _showFilterSheet,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          _searchController.clear();
          await ref
              .read(propertyProvider.notifier)
              .loadProperties(refresh: true);
        },
        child: state.isLoading && state.properties.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : state.error != null && state.properties.isEmpty
                ? LayoutBuilder(
                    builder: (context, constraints) {
                      return SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: ConstrainedBox(
                          constraints:
                              BoxConstraints(minHeight: constraints.maxHeight),
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.error_outline,
                                    size: 48, color: AppTokens.gray400),
                                const SizedBox(height: 16),
                                Text(state.error!, textAlign: TextAlign.center),
                                const SizedBox(height: 16),
                                ElevatedButton(
                                  onPressed: () => ref
                                      .read(propertyProvider.notifier)
                                      .loadProperties(refresh: true),
                                  child: Text(l10n.retry),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  )
                : state.properties.isEmpty
                    ? LayoutBuilder(
                        builder: (context, constraints) {
                          return SingleChildScrollView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            child: ConstrainedBox(
                              constraints: BoxConstraints(
                                  minHeight: constraints.maxHeight),
                              child: Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.search_off,
                                        size: 64, color: AppTokens.gray400),
                                    const SizedBox(height: 16),
                                    Text(
                                      l10n.search_no_results,
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                          color: AppTokens.gray600,
                                          fontSize: 16),
                                    ),
                                    const SizedBox(height: 16),
                                    ElevatedButton(
                                      onPressed: () => ref
                                          .read(propertyProvider.notifier)
                                          .loadProperties(refresh: true),
                                      child: Text(l10n.search_reset_filters),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      )
                    : Column(
                        children: [
                          Padding(
                            padding: const EdgeInsetsDirectional.fromSTEB(
                                16, 12, 16, 0),
                            child: TextField(
                              controller: _searchController,
                              onChanged: _onSearchChanged,
                              decoration: InputDecoration(
                                hintText: l10n.search_hint,
                                prefixIcon: const Icon(Icons.search),
                                suffixIcon: _searchController.text.isNotEmpty
                                    ? IconButton(
                                        icon: const Icon(Icons.clear),
                                        tooltip: l10n.tooltip_clear,
                                        onPressed: () {
                                          _searchController.clear();
                                          _onSearchChanged('');
                                        },
                                      )
                                    : null,
                                filled: true,
                                fillColor: context.isDark
                                    ? AppTokens.darkSurface
                                    : AppTokens.gray100,
                                border: OutlineInputBorder(
                                  borderRadius:
                                      BorderRadius.circular(AppTokens.radiusMd),
                                  borderSide: BorderSide.none,
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 14),
                              ),
                            ),
                          ),
                          Expanded(
                            child: ListView.builder(
                              controller: _scrollController,
                              padding: const EdgeInsets.all(16),
                              itemCount: state.properties.length +
                                  (state.hasMore ? 1 : 0),
                              itemBuilder: (context, index) {
                                if (index >= state.properties.length) {
                                  return const Padding(
                                    padding: EdgeInsets.all(16),
                                    child: Center(
                                        child: CircularProgressIndicator()),
                                  );
                                }
                                final property = state.properties[index];
                                return Padding(
                                  padding: const EdgeInsets.only(bottom: 12),
                                  child: GestureDetector(
                                    onTap: () {
                                      context.push('/property/${property.id}');
                                    },
                                    child: PropertyCard(property: property),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
      ),
    );
  }
}
