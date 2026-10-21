import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../core/design_system/components/app_button.dart';
import '../providers/auth_provider.dart';
import '../../core/design_system/components/app_input.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../core/theme/app_theme.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/property_model.dart';
import '../../generated/l10n/app_localizations.dart';
import '../../services/ai_property_service.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';

class PropertyFormWizard extends ConsumerStatefulWidget {
  final PropertyModel? initialProperty;
  final Future<void> Function(Map<String, dynamic> data,
      List<MultipartFile> images, MultipartFile? video) onSubmit;
  final bool isSaving;

  const PropertyFormWizard({
    super.key,
    this.initialProperty,
    required this.onSubmit,
    this.isSaving = false,
  });

  @override
  ConsumerState<PropertyFormWizard> createState() => _PropertyFormWizardState();
}

class _PropertyFormWizardState extends ConsumerState<PropertyFormWizard> {
  final _formKey = GlobalKey<FormState>();
  final _pageController = PageController();
  int _currentStep = 0;

  // Step 1: Basic Info
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final _cityController = TextEditingController();
  final _addressController = TextEditingController();
  String _type = 'RENT';
  String _category = 'APARTMENT';

  // Step 2: Features
  final _surfaceController = TextEditingController();
  final _roomsController = TextEditingController();
  final _bedroomsController = TextEditingController();
  final _bathroomsController = TextEditingController();
  final _floorController = TextEditingController();
  String _condition = 'GOOD';
  bool _furnished = false;

  // Step 3: Amenities
  final Map<String, bool> _amenities = {
    'hasParking': false,
    'hasPool': false,
    'hasGarden': false,
    'hasAirConditioning': false,
    'hasInternet': false,
    'hasSecurity': false,
    'hasBalcony': false,
    'hasElevator': false,
  };

  final _aiPropertyService = AiPropertyService();
  bool _isGeneratingDescription = false;
  bool _isSuggestingPrice = false;

  // Step 4: Environment
  final Map<String, bool> _environment = {
    'cityCenter': false,
    'nearSchool': false,
    'nearUniversity': false,
    'nearMosque': false,
    'nearHospital': false,
    'nearMarket': false,
    'nearBus': false,
    'nearTram': false,
    'nearTrainStation': false,
    'popularArea': false,
    'modernArea': false,
    'quietArea': false,
    'familyArea': false,
    'gardenView': false,
    'streetView': false,
    'seaView': false,
  };
  LatLng? _location;

  // Step 5: Media
  final List<XFile> _selectedImages = [];
  final List<String> _existingImages = [];
  XFile? _selectedVideo;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    if (widget.initialProperty != null) {
      _loadInitialData(widget.initialProperty!);
    }
  }

  void _loadInitialData(PropertyModel p) {
    _titleController.text = p.title;
    _descriptionController.text = p.description;
    _priceController.text = p.price.toString();
    _cityController.text = p.city;
    _addressController.text = p.address;
    _type = p.type;
    _category = p.category;
    _surfaceController.text = p.surface.toString();
    _roomsController.text = p.rooms.toString();
    _bedroomsController.text = p.bedrooms?.toString() ?? '';
    _bathroomsController.text = p.bathrooms?.toString() ?? '';
    _floorController.text = p.floorNumber?.toString() ?? '';
    _condition = p.condition ?? 'GOOD';
    _furnished = p.furnished ?? false;
    _amenities['hasParking'] = p.hasParking ?? false;
    _amenities['hasPool'] = p.hasPool ?? false;
    _amenities['hasGarden'] = p.hasGarden ?? false;
    _amenities['hasAirConditioning'] = p.hasAirConditioning ?? false;
    _amenities['hasInternet'] = p.hasInternet ?? false;
    _amenities['hasSecurity'] = p.hasSecurity ?? false;
    _amenities['hasBalcony'] = p.hasBalcony ?? false;
    _amenities['hasElevator'] = p.hasElevator ?? false;
    _environment['cityCenter'] = p.cityCenter ?? false;
    _environment['nearSchool'] = p.nearSchool ?? false;
    _environment['nearUniversity'] = p.nearUniversity ?? false;
    _environment['nearMosque'] = p.nearMosque ?? false;
    _environment['nearHospital'] = p.nearHospital ?? false;
    _environment['nearMarket'] = p.nearMarket ?? false;
    _environment['nearBus'] = p.nearBus ?? false;
    _environment['nearTram'] = p.nearTram ?? false;
    _environment['nearTrainStation'] = p.nearTrainStation ?? false;
    _environment['popularArea'] = p.popularArea ?? false;
    _environment['modernArea'] = p.modernArea ?? false;
    _environment['quietArea'] = p.quietArea ?? false;
    _environment['familyArea'] = p.familyArea ?? false;
    _environment['gardenView'] = p.gardenView ?? false;
    _environment['streetView'] = p.streetView ?? false;
    _environment['seaView'] = p.seaView ?? false;
    if (p.latitude != null && p.longitude != null) {
      _location = LatLng(p.latitude!, p.longitude!);
    }
    _existingImages.addAll(p.images ?? []);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    _cityController.dispose();
    _addressController.dispose();
    _surfaceController.dispose();
    _roomsController.dispose();
    _bedroomsController.dispose();
    _bathroomsController.dispose();
    _floorController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    final picked = await _picker.pickMultiImage();
    if (picked.isNotEmpty) {
      setState(() {
        _selectedImages.addAll(picked);
      });
    }
  }

  Future<void> _pickVideo() async {
    final picked = await _picker.pickVideo(source: ImageSource.gallery);
    if (picked != null) {
      setState(() {
        _selectedVideo = picked;
      });
    }
  }

  Future<void> _getCurrentLocation() async {
    final status = await Permission.location.request();
    if (status.isGranted) {
      final pos = await Geolocator.getCurrentPosition();
      setState(() {
        _location = LatLng(pos.latitude, pos.longitude);
      });
    }
  }

  bool _validateCurrentStep() {
    if (_currentStep == 0) {
      if (_titleController.text.trim().isEmpty) return false;
      if (_descriptionController.text.trim().length < 50) return false;
      if (_priceController.text.isEmpty) return false;
      if (_cityController.text.trim().isEmpty) return false;
      if (_addressController.text.trim().isEmpty) return false;
    }
    if (_currentStep == 1) {
      if (_surfaceController.text.isEmpty) return false;
      if (_roomsController.text.isEmpty) return false;
    }
    return true;
  }

  MediaType? _mediaTypeForFile(String filename) {
    final ext = filename.split('.').last.toLowerCase();
    return switch (ext) {
      'jpg' || 'jpeg' => MediaType.parse('image/jpeg'),
      'png' => MediaType.parse('image/png'),
      'gif' => MediaType.parse('image/gif'),
      'webp' => MediaType.parse('image/webp'),
      'mp4' => MediaType.parse('video/mp4'),
      'mov' => MediaType.parse('video/quicktime'),
      'avi' => MediaType.parse('video/x-msvideo'),
      'wmv' => MediaType.parse('video/x-ms-wmv'),
      'flv' => MediaType.parse('video/x-flv'),
      'webm' => MediaType.parse('video/webm'),
      _ => null,
    };
  }

  Future<LatLng?> _geocodeCity(String city) async {
    if (city.isEmpty) return null;
    try {
      final dio = Dio();
      final response = await dio.get(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'format': 'json',
          'q': '$city, Morocco',
          'limit': 1,
          'countrycodes': 'ma',
        },
        options: Options(
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'MarocLoc-Flutter/1.0',
          },
        ),
      );
      final results = response.data as List<dynamic>?;
      if (results != null && results.isNotEmpty) {
        final lat = double.tryParse(results[0]['lat'].toString());
        final lng = double.tryParse(results[0]['lon'].toString());
        if (lat != null && lng != null) return LatLng(lat, lng);
      }
    } catch (e) {
      debugPrint('Geocoding failed: $e');
    }
    return null;
  }

  Future<void> _submit() async {
    // Ensure we have coordinates. If the user did not pick a GPS location,
    // geocode the city like the React frontend does.
    if (_location == null) {
      final coords = await _geocodeCity(_cityController.text.trim());
      if (coords != null) {
        setState(() => _location = coords);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text(
                  'Veuillez saisir une ville valide ou activer la localisation.'),
              backgroundColor: AppTheme.error500,
            ),
          );
        }
        return;
      }
    }

    // Add parity defaults so the backend result matches the React client.
    final authUser = ref.read(authProvider).user;

    final data = <String, dynamic>{
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'price': double.tryParse(_priceController.text) ?? 0,
      'city': _cityController.text.trim(),
      'address': _addressController.text.trim(),
      'type': _type,
      'category': _category,
      'surface': double.tryParse(_surfaceController.text) ?? 0,
      'rooms': int.tryParse(_roomsController.text) ?? 0,
      'bedrooms': int.tryParse(_bedroomsController.text),
      'bathrooms': int.tryParse(_bathroomsController.text),
      'floorNumber': int.tryParse(_floorController.text),
      'condition': _condition,
      'furnished': _furnished,
      'paymentMethod': 'BANK_TRANSFER',
      ..._amenities,
      ..._environment,
      'latitude': _location!.latitude,
      'longitude': _location!.longitude,
      if (authUser?.phoneNumber != null)
        'phoneNumber': authUser!.phoneNumber,
      if (authUser?.whatsappNumber != null)
        'whatsappNumber': authUser!.whatsappNumber,
      if (authUser?.firstNameLatin != null)
        'firstNameLatin': authUser!.firstNameLatin,
      if (authUser?.lastNameLatin != null)
        'lastNameLatin': authUser!.lastNameLatin,
      if (authUser?.firstNameArabic != null)
        'firstNameArabic': authUser!.firstNameArabic,
      if (authUser?.lastNameArabic != null)
        'lastNameArabic': authUser!.lastNameArabic,
      if (authUser?.cin != null) 'cin': authUser!.cin,
    };

    // Read image bytes and create MultipartFiles with proper content types
    // so the backend FileValidationService accepts them.
    final imageFiles = <MultipartFile>[];
    for (final xFile in _selectedImages) {
      final bytes = await xFile.readAsBytes();
      imageFiles.add(MultipartFile.fromBytes(
        bytes,
        filename: xFile.name,
        contentType: _mediaTypeForFile(xFile.name),
      ));
    }

    // Read video bytes if a video was selected
    MultipartFile? videoFile;
    if (_selectedVideo != null) {
      final bytes = await _selectedVideo!.readAsBytes();
      videoFile = MultipartFile.fromBytes(
        bytes,
        filename: _selectedVideo!.name,
        contentType: _mediaTypeForFile(_selectedVideo!.name),
      );
    }

    await widget.onSubmit(data, imageFiles, videoFile);
  }

  Map<String, dynamic> _collectFormDataForAi() {
    return {
      'title': _titleController.text.trim(),
      'type': _type,
      'category': _category,
      'city': _cityController.text.trim(),
      'surface': double.tryParse(_surfaceController.text) ?? 0,
      'rooms': int.tryParse(_roomsController.text) ?? 0,
      'bedrooms': int.tryParse(_bedroomsController.text),
      'bathrooms': int.tryParse(_bathroomsController.text),
      ..._amenities,
    };
  }

  Future<void> _onGenerateDescription() async {
    if (_isGeneratingDescription) return;
    setState(() => _isGeneratingDescription = true);
    try {
      final data = _collectFormDataForAi();
      final description = await _aiPropertyService.generateDescription(data);
      if (mounted) {
        setState(() {
          _descriptionController.text = description;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(AppLocalizations.of(context)
                  .property_form_description_generated)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(AppLocalizations.of(context)
                  .common_error_with_message(e.toString()))),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isGeneratingDescription = false);
      }
    }
  }

  Future<void> _onSuggestPrice() async {
    if (_isSuggestingPrice) return;
    setState(() => _isSuggestingPrice = true);
    try {
      final data = _collectFormDataForAi();
      final result = await _aiPropertyService.suggestPrice(data);
      if (mounted) {
        _showPriceSuggestion(result);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(AppLocalizations.of(context)
                  .common_error_with_message(e.toString()))),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSuggestingPrice = false);
      }
    }
  }

  void _showPriceSuggestion(Map<String, dynamic> result) {
    final minPrice = (result['minPrice'] as num?)?.toDouble();
    final maxPrice = (result['maxPrice'] as num?)?.toDouble();
    final suggestedPrice = (result['suggestedPrice'] as num?)?.toDouble();

    showModalBottomSheet(
      context: context,
      backgroundColor: context.surfaceColor,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AppTokens.radiusXl)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppTokens.space4),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: context.borderColor,
                    borderRadius: BorderRadius.circular(AppTokens.radiusFull),
                  ),
                ),
                const SizedBox(height: AppTokens.space4),
                Text(
                  AppLocalizations.of(context)
                      .property_form_price_suggestion_title,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        color: context.textPrimary,
                      ),
                ),
                const SizedBox(height: AppTokens.space4),
                if (suggestedPrice != null) ...[
                  Text(
                    formatPrice(context, suggestedPrice),
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          color: AppTokens.primary500,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: AppTokens.space2),
                ],
                if (minPrice != null && maxPrice != null)
                  Text(
                    AppLocalizations.of(context).property_form_price_range(
                        formatPrice(context, minPrice),
                        formatPrice(context, maxPrice)),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: context.textSecondary,
                        ),
                  ),
                const SizedBox(height: AppTokens.space6),
                AppButton(
                  label: AppLocalizations.of(context).property_form_apply_price,
                  variant: AppButtonVariant.primary,
                  fullWidth: true,
                  onPressed: () {
                    if (suggestedPrice != null && mounted) {
                      setState(() {
                        _priceController.text =
                            suggestedPrice.toStringAsFixed(0);
                      });
                    }
                    Navigator.pop(ctx);
                  },
                ),
                const SizedBox(height: AppTokens.space3),
                AppButton(
                  label: AppLocalizations.of(context).close,
                  variant: AppButtonVariant.ghost,
                  fullWidth: true,
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final steps = [
      l10n.property_form_step_info,
      l10n.property_form_step_features,
      l10n.property_form_step_amenities,
      l10n.property_form_step_environment,
      l10n.property_form_step_media,
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.initialProperty != null
            ? AppLocalizations.of(context).property_form_edit_title
            : AppLocalizations.of(context).property_form_create_title),
        backgroundColor: AppTheme.primary500,
        foregroundColor: AppTokens.gray50,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(48),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: List.generate(steps.length, (i) {
                return Expanded(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    height: 4,
                    decoration: BoxDecoration(
                      color: i <= _currentStep
                          ? AppTheme.gold400
                          : AppTheme.gray300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
      body: Form(
        key: _formKey,
        child: PageView(
          controller: _pageController,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            _buildStep1(),
            _buildStep2(),
            _buildStep3(),
            _buildStep4(),
            _buildStep5(),
          ],
        ),
      ),
      bottomNavigationBar: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            if (_currentStep > 0)
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    setState(() => _currentStep--);
                    _pageController.previousPage(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                    );
                  },
                  child:
                      Text(AppLocalizations.of(context).property_form_previous),
                ),
              ),
            if (_currentStep > 0) const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                key: const Key('propertyFormWizardNextButton'),
                onPressed: widget.isSaving
                    ? null
                    : () {
                        if (!_validateCurrentStep()) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                                content: Text(AppLocalizations.of(context)
                                    .property_form_fill_required)),
                          );
                          return;
                        }
                        if (_currentStep < steps.length - 1) {
                          setState(() => _currentStep++);
                          _pageController.nextPage(
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        } else {
                          _submit();
                        }
                      },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary500,
                  foregroundColor: AppTokens.gray50,
                ),
                child: widget.isSaving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: AppTokens.gray50),
                      )
                    : Text(_currentStep < steps.length - 1
                        ? AppLocalizations.of(context).property_form_next
                        : AppLocalizations.of(context).property_form_save),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep1() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTextField(
              AppLocalizations.of(context).property_form_title_label,
              _titleController,
              required: true),
          const SizedBox(height: 12),
          AppInput(
            label: AppLocalizations.of(context).property_form_description_label,
            controller: _descriptionController,
            maxLines: 4,
            suffixIcon: _isGeneratingDescription
                ? SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        context.isDark
                            ? AppTokens.primary400
                            : AppTokens.primary500,
                      ),
                    ),
                  )
                : Icon(
                    Icons.auto_fix_high,
                    size: 20,
                    color: context.isDark
                        ? AppTokens.primary400
                        : AppTokens.primary500,
                  ),
            onSuffixTap:
                _isGeneratingDescription ? null : _onGenerateDescription,
          ),
          const SizedBox(height: 8),
          AppButton(
            label:
                AppLocalizations.of(context).property_form_generate_description,
            variant: AppButtonVariant.outlined,
            size: AppButtonSize.small,
            isLoading: _isGeneratingDescription,
            leading: Icon(
              Icons.auto_fix_high,
              size: 18,
              color:
                  context.isDark ? AppTokens.primary400 : AppTokens.primary500,
            ),
            fullWidth: true,
            onPressed: _onGenerateDescription,
          ),
          const SizedBox(height: 12),
          AppInput(
            label: AppLocalizations.of(context).property_form_price_label,
            controller: _priceController,
            keyboardType: TextInputType.number,
            suffixIcon: _isSuggestingPrice
                ? SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        context.isDark
                            ? AppTokens.primary400
                            : AppTokens.primary500,
                      ),
                    ),
                  )
                : Icon(
                    Icons.trending_up,
                    size: 20,
                    color: context.isDark
                        ? AppTokens.primary400
                        : AppTokens.primary500,
                  ),
            onSuffixTap: _isSuggestingPrice ? null : _onSuggestPrice,
          ),
          const SizedBox(height: 8),
          AppButton(
            label: AppLocalizations.of(context).property_form_price_suggestion,
            variant: AppButtonVariant.outlined,
            size: AppButtonSize.small,
            isLoading: _isSuggestingPrice,
            leading: Icon(
              Icons.trending_up,
              size: 18,
              color:
                  context.isDark ? AppTokens.primary400 : AppTokens.primary500,
            ),
            fullWidth: true,
            onPressed: _onSuggestPrice,
          ),
          const SizedBox(height: 12),
          _buildTextField(AppLocalizations.of(context).property_form_city_label,
              _cityController,
              required: true),
          const SizedBox(height: 12),
          _buildTextField(
              AppLocalizations.of(context).property_form_address_label,
              _addressController,
              required: true),
          const SizedBox(height: 12),
          _buildDropdown(
              AppLocalizations.of(context).property_form_type_label,
              _type,
              ['RENT', 'BUY', 'MORTGAGE'],
              (v) => setState(() => _type = v)),
          const SizedBox(height: 12),
          _buildDropdown(
              AppLocalizations.of(context).property_form_category_label,
              _category,
              ['APARTMENT', 'HOUSE', 'OFFICE', 'SHOP', 'LAND', 'RIAD'],
              (v) => setState(() => _category = v)),
        ],
      ),
    );
  }

  Widget _buildStep2() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildTextField(
              AppLocalizations.of(context).property_form_surface_label,
              _surfaceController,
              keyboardType: TextInputType.number,
              required: true),
          const SizedBox(height: 12),
          _buildTextField(
              AppLocalizations.of(context).property_form_rooms_label,
              _roomsController,
              keyboardType: TextInputType.number,
              required: true),
          const SizedBox(height: 12),
          _buildTextField(
              AppLocalizations.of(context).property_form_bedrooms_label,
              _bedroomsController,
              keyboardType: TextInputType.number),
          const SizedBox(height: 12),
          _buildTextField(
              AppLocalizations.of(context).property_form_bathrooms_label,
              _bathroomsController,
              keyboardType: TextInputType.number),
          const SizedBox(height: 12),
          _buildTextField(
              AppLocalizations.of(context).property_form_floor_label,
              _floorController,
              keyboardType: TextInputType.number),
          const SizedBox(height: 12),
          _buildDropdown(
              AppLocalizations.of(context).property_form_condition_label,
              _condition,
              ['NEW', 'GOOD', 'RENOVATED', 'TO_RENOVATE'],
              (v) => setState(() => _condition = v)),
          const SizedBox(height: 12),
          SwitchListTile(
            title: Text(AppLocalizations.of(context).property_form_furnished),
            value: _furnished,
            onChanged: (v) => setState(() => _furnished = v),
            activeColor: AppTheme.primary500,
          ),
        ],
      ),
    );
  }

  Widget _buildStep3() {
    final l10n = AppLocalizations.of(context);
    final labels = {
      'hasParking': l10n.property_form_amenity_parking,
      'hasPool': l10n.property_form_amenity_pool,
      'hasGarden': l10n.property_form_amenity_garden,
      'hasAirConditioning': l10n.property_form_amenity_ac,
      'hasInternet': l10n.property_form_amenity_internet,
      'hasSecurity': l10n.property_form_amenity_security,
      'hasBalcony': l10n.property_form_amenity_balcony,
      'hasElevator': l10n.property_form_amenity_elevator,
    };
    return ListView(
      padding: const EdgeInsets.all(16),
      children: _amenities.entries.map((e) {
        return SwitchListTile(
          title: Text(labels[e.key] ?? e.key),
          value: e.value,
          onChanged: (v) => setState(() => _amenities[e.key] = v),
          activeColor: AppTheme.primary500,
        );
      }).toList(),
    );
  }

  Widget _buildStep4() {
    final l10n = AppLocalizations.of(context);
    final labels = {
      'cityCenter': l10n.property_form_env_cityCenter,
      'nearSchool': l10n.property_form_env_nearSchool,
      'nearUniversity': l10n.property_form_env_nearUniversity,
      'nearMosque': l10n.property_form_env_nearMosque,
      'nearHospital': l10n.property_form_env_nearHospital,
      'nearMarket': l10n.property_form_env_nearMarket,
      'nearBus': l10n.property_form_env_nearBus,
      'nearTram': l10n.property_form_env_nearTram,
      'nearTrainStation': l10n.property_form_env_nearTrainStation,
      'popularArea': l10n.property_form_env_popularArea,
      'modernArea': l10n.property_form_env_modernArea,
      'quietArea': l10n.property_form_env_quietArea,
      'familyArea': l10n.property_form_env_familyArea,
      'gardenView': l10n.property_form_env_gardenView,
      'streetView': l10n.property_form_env_streetView,
      'seaView': l10n.property_form_env_seaView,
    };
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          ..._environment.entries.map((e) {
            return SwitchListTile(
              title: Text(labels[e.key] ?? e.key),
              value: e.value,
              onChanged: (v) => setState(() => _environment[e.key] = v),
              activeColor: AppTheme.primary500,
            );
          }),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _getCurrentLocation,
              icon: const Icon(Icons.my_location),
              label: Text(_location != null
                  ? AppLocalizations.of(context).property_form_location_coordinates(
                      _location!.latitude.toStringAsFixed(4),
                      _location!.longitude.toStringAsFixed(4),
                    )
                  : AppLocalizations.of(context).property_form_get_location),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary500,
                foregroundColor: AppTokens.gray50,
              ),
            ),
          ),
          if (_location != null)
            Container(
              margin: const EdgeInsets.only(top: 12),
              height: 200,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.gray300),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: _location!,
                    zoom: 14,
                  ),
                  markers: {
                    Marker(
                      markerId: const MarkerId('property'),
                      position: _location!,
                    ),
                  },
                  onTap: (latLng) => setState(() => _location = latLng),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStep5() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _pickImages,
              icon: const Icon(Icons.add_photo_alternate),
              label:
                  Text(AppLocalizations.of(context).property_form_add_photos),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary500,
                foregroundColor: AppTokens.gray50,
              ),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _pickVideo,
              icon: const Icon(Icons.video_call),
              label: Text(AppLocalizations.of(context).property_form_add_video),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary500,
                foregroundColor: AppTokens.gray50,
              ),
            ),
          ),
          if (_selectedVideo != null) ...[
            const SizedBox(height: 12),
            Chip(
              avatar: const Icon(Icons.videocam, size: 18),
              label: Text(
                '${AppLocalizations.of(context).property_form_video_selected}: ${_selectedVideo!.name}',
                overflow: TextOverflow.ellipsis,
              ),
              onDeleted: () => setState(() => _selectedVideo = null),
            ),
          ],
          if (_existingImages.isNotEmpty) ...[
            Text(AppLocalizations.of(context).property_form_existing_images,
                style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _existingImages.map((url) {
                return Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: CachedNetworkImage(
                        imageUrl: url,
                        width: 100,
                        height: 100,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Shimmer.fromColors(
                          baseColor: context.shimmerBase,
                          highlightColor: context.shimmerHighlight,
                          child: Container(
                              color: Theme.of(context).colorScheme.surface),
                        ),
                        errorWidget: (context, url, error) => Container(
                          color: context.shimmerBase,
                          child: const Icon(Icons.image_not_supported,
                              color: AppTokens.gray400),
                        ),
                      ),
                    ),
                    PositionedDirectional(top: 4, end: 4,
                      child: GestureDetector(
                        onTap: () =>
                            setState(() => _existingImages.remove(url)),
                        child: Container(
                          decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.error,
                              shape: BoxShape.circle),
                          child: const Icon(Icons.close,
                              color: AppTokens.gray50, size: 18),
                        ),
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
            const SizedBox(height: 16),
          ],
          if (_selectedImages.isNotEmpty) ...[
            Text(AppLocalizations.of(context).property_form_new_images,
                style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _selectedImages.asMap().entries.map((e) {
                return Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: FutureBuilder<Uint8List>(
                        future: e.value.readAsBytes(),
                        builder: (context, snapshot) {
                          if (snapshot.hasData) {
                            return Image.memory(snapshot.data!,
                                width: 100, height: 100, fit: BoxFit.cover);
                          }
                          return Container(
                              width: 100,
                              height: 100,
                              color: AppTokens.gray300);
                        },
                      ),
                    ),
                    PositionedDirectional(top: 4, end: 4,
                      child: GestureDetector(
                        onTap: () =>
                            setState(() => _selectedImages.removeAt(e.key)),
                        child: Container(
                          decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.error,
                              shape: BoxShape.circle),
                          child: const Icon(Icons.close,
                              color: AppTokens.gray50, size: 18),
                        ),
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller, {
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    bool required = false,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label + (required ? ' *' : ''),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.primary500),
        ),
      ),
      validator: required && maxLines == 1
          ? (v) => v == null || v.trim().isEmpty
              ? AppLocalizations.of(context).common_required_field
              : null
          : null,
    );
  }

  Widget _buildDropdown(String label, String value, List<String> items,
      ValueChanged<String> onChanged) {
    return DropdownButtonFormField<String>(
      value: value,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
      items:
          items.map((i) => DropdownMenuItem(value: i, child: Text(i))).toList(),
      onChanged: (v) => onChanged(v!),
    );
  }
}
