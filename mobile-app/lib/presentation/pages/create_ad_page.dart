import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/design_system/components/app_button.dart';
import '../../core/design_system/components/app_input.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../core/theme/theme_extensions.dart';
import '../../generated/l10n/app_localizations.dart';
import '../../presentation/providers/ads_provider.dart';
import '../../presentation/providers/auth_provider.dart';
import '../../presentation/providers/property_provider.dart';

class CreateAdPage extends ConsumerStatefulWidget {
  const CreateAdPage({super.key});

  @override
  ConsumerState<CreateAdPage> createState() => _CreateAdPageState();
}

class _CreateAdPageState extends ConsumerState<CreateAdPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _budgetController = TextEditingController();

  String? _adType;
  int? _selectedPropertyId;
  DateTime? _startDate;
  DateTime? _endDate;
  String? _selectedPlan;
  String _paymentMethod = 'cmi';
  bool _isSubmitting = false;
  bool _isLoadingPlans = true;
  List<Map<String, dynamic>> _plans = [];

  static const _adTypes = [
    'BANNER',
    'PROPERTY',
    'BOOST_PUBLICATION',
    'FEATURED_PROPERTY',
    'HOMEPAGE_ADS',
    'PREMIUM_LISTING',
  ];

  @override
  void initState() {
    super.initState();
    Future.microtask(() async {
      ref.read(propertyProvider.notifier).loadMyProperties();
      await _loadPlans();
    });
  }

  Future<void> _loadPlans() async {
    try {
      final plans = await ref.read(adsServiceProvider).getPlans();
      setState(() {
        _plans = plans;
        if (plans.isNotEmpty) {
          _selectedPlan = plans.first['name'] as String?;
        }
        _isLoadingPlans = false;
      });
    } catch (e) {
      setState(() => _isLoadingPlans = false);
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _budgetController.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool isStart}) async {
    final now = DateTime.now();
    final initial = isStart
        ? (_startDate ?? now)
        : (_endDate ?? now.add(const Duration(days: 7)));
    final first = isStart ? now : (_startDate ?? now);
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: first,
      lastDate: DateTime(now.year + 2),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(
                  primary: AppTokens.primary500,
                ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate != null &&
              (_endDate!.isBefore(_startDate!) ||
                  _endDate!.isAtSameMomentAs(_startDate!))) {
            _endDate = null;
          }
        } else {
          _endDate = picked;
        }
      });
    }
  }

  String _formatDate(DateTime date) {
    return '${date.year.toString().padLeft(4, '0')}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_startDate == null || _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(
                AppLocalizations.of(context).advertisement_select_dates_error)),
      );
      return;
    }
    if (_endDate!.isBefore(_startDate!) ||
        _endDate!.isAtSameMomentAs(_startDate!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(AppLocalizations.of(context)
                .advertisement_end_date_after_start_error)),
      );
      return;
    }
    if (_selectedPlan == null || _selectedPlan!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(
                AppLocalizations.of(context).advertisement_select_plan_error)),
      );
      return;
    }
    if (_selectedPropertyId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(AppLocalizations.of(context)
                .advertisement_select_property_error)),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final baseData = {
        'title': _titleController.text.trim(),
        'description': _descriptionController.text.trim(),
        'type': _adType,
        'plan': _selectedPlan,
        'propertyIds': [_selectedPropertyId!],
        'propertyId': _selectedPropertyId,
        'budget': double.parse(_budgetController.text.trim()),
        'startDate': _formatDate(_startDate!),
        'endDate': _formatDate(_endDate!),
        'currency': 'MAD',
      };

      if (_paymentMethod == 'stripe') {
        final session = await ref.read(adsServiceProvider).createCheckoutSession({
          'plan': _selectedPlan,
          'propertyIds': [_selectedPropertyId!],
          'durationMonths': 1,
          'successUrl': 'https://marocloc.ma/payment/success',
          'cancelUrl': 'https://marocloc.ma/payment/cancel',
        });
        final checkoutUrl = session['checkoutUrl'] as String?;
        if (checkoutUrl != null && checkoutUrl.isNotEmpty) {
          await launchUrl(
            Uri.parse(checkoutUrl),
            mode: LaunchMode.externalApplication,
          );
        } else {
          throw Exception('No checkout URL returned');
        }
      } else {
        final adId = await ref.read(adsServiceProvider).createAdRequest(baseData);
        if (adId == null) {
          throw Exception('No advertisement id returned');
        }
        final amount = double.tryParse(_budgetController.text.trim()) ?? 0.0;
        final orderId = 'AD-$adId-${DateTime.now().millisecondsSinceEpoch}';
        if (mounted) {
          context.push(
            '/payment/cmi',
            extra: <String, dynamic>{
              'amount': amount,
              'description': AppLocalizations.of(context).payment_cmi_title,
              'orderId': orderId,
              'advertisementId': adId,
              'email': ref.read(authProvider).user?.email ?? '',
            },
          );
        }
        return;
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content:
                  Text(AppLocalizations.of(context).advertisement_success)),
        );
        context.pop();
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
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Widget _buildDropdown<T>({
    required String label,
    required T? value,
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
          style: Theme.of(context)
              .textTheme
              .labelMedium
              ?.copyWith(fontWeight: FontWeight.w600),
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
          validator: (v) => v == null
              ? AppLocalizations.of(context).common_required_field
              : null,
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

  Widget _buildDateField({
    required String label,
    required DateTime? date,
    required VoidCallback onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: Theme.of(context)
              .textTheme
              .labelMedium
              ?.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: context.isDark ? AppTokens.darkSurface : AppTokens.gray100,
              borderRadius: BorderRadius.circular(AppTokens.radiusMd),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    date != null
                        ? '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}'
                        : AppLocalizations.of(context).common_date_format_hint,
                    style: TextStyle(
                      color: date != null
                          ? context.textPrimary
                          : AppTokens.gray400,
                      fontSize: 16,
                    ),
                  ),
                ),
                const Icon(Icons.calendar_today,
                    size: 20, color: AppTokens.gray400),
              ],
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final propertyState = ref.watch(propertyProvider);
    final myProperties = propertyState.myProperties;

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).advertisement_title),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppTokens.space4),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildDropdown<String>(
                label: AppLocalizations.of(context).advertisement_type_label,
                value: _adType,
                items: _adTypes,
                onChanged: (v) => setState(() => _adType = v),
                hint: AppLocalizations.of(context).advertisement_type_hint,
              ),
              const SizedBox(height: AppTokens.space4),
              if (_isLoadingPlans)
                const Center(child: CircularProgressIndicator())
              else
                _buildDropdown<String>(
                  label: AppLocalizations.of(context).advertisement_plan_label,
                  value: _selectedPlan,
                  items: _plans.map((p) => p['name'] as String).toList(),
                  onChanged: (v) => setState(() => _selectedPlan = v),
                  hint: AppLocalizations.of(context).advertisement_plan_hint,
                  itemLabel: (name) {
                    final plan = _plans.firstWhere((p) => p['name'] == name);
                    final displayName = plan['displayName'] as String? ?? name;
                    final amount = plan['amountMinorUnits'] as int? ?? 0;
                    return '$displayName — ${(amount / 100).toStringAsFixed(0)} DH';
                  },
                ),
              const SizedBox(height: AppTokens.space4),
              if (propertyState.isLoading && myProperties.isEmpty)
                const Center(child: CircularProgressIndicator())
              else
                _buildDropdown<int>(
                  label:
                      AppLocalizations.of(context).advertisement_property_label,
                  value: _selectedPropertyId,
                  items: myProperties.map((p) => p.id).toList(),
                  onChanged: (v) => setState(() => _selectedPropertyId = v),
                  hint:
                      AppLocalizations.of(context).advertisement_property_hint,
                  itemLabel: (id) {
                    final prop = myProperties.firstWhere((p) => p.id == id);
                    return prop.title;
                  },
                ),
              const SizedBox(height: AppTokens.space4),
              AppInput(
                label: AppLocalizations.of(context).advertisement_title_label,
                hint: AppLocalizations.of(context).advertisement_title_hint,
                controller: _titleController,
                validator: (v) => v == null || v.trim().isEmpty
                    ? AppLocalizations.of(context).advertisement_title_label
                    : null,
              ),
              const SizedBox(height: AppTokens.space4),
              AppInput(
                label: AppLocalizations.of(context)
                    .advertisement_description_label,
                hint:
                    AppLocalizations.of(context).advertisement_description_hint,
                controller: _descriptionController,
                maxLines: 3,
                validator: (v) => v == null || v.trim().isEmpty
                    ? AppLocalizations.of(context)
                        .advertisement_description_label
                    : null,
              ),
              const SizedBox(height: AppTokens.space4),
              AppInput(
                label: AppLocalizations.of(context).advertisement_budget_label,
                hint: AppLocalizations.of(context).advertisement_budget_hint,
                controller: _budgetController,
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v == null || v.trim().isEmpty) {
                    return AppLocalizations.of(context)
                        .advertisement_budget_required;
                  }
                  final value = double.tryParse(v.trim());
                  if (value == null || value < 100) {
                    return AppLocalizations.of(context)
                        .advertisement_budget_min;
                  }
                  return null;
                },
              ),
              const SizedBox(height: AppTokens.space4),
              Row(
                children: [
                  Expanded(
                    child: _buildDateField(
                      label: AppLocalizations.of(context)
                          .advertisement_start_date_label,
                      date: _startDate,
                      onTap: () => _pickDate(isStart: true),
                    ),
                  ),
                  const SizedBox(width: AppTokens.space3),
                  Expanded(
                    child: _buildDateField(
                      label: AppLocalizations.of(context)
                          .advertisement_end_date_label,
                      date: _endDate,
                      onTap: () => _pickDate(isStart: false),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppTokens.space4),
              _buildDropdown<String>(
                label: AppLocalizations.of(context).advertisement_payment_method_label,
                value: _paymentMethod,
                items: const ['cmi', 'stripe'],
                onChanged: (v) => setState(() => _paymentMethod = v ?? 'cmi'),
                hint: AppLocalizations.of(context).advertisement_payment_method_hint,
                itemLabel: (method) => method == 'stripe'
                    ? AppLocalizations.of(context).advertisement_payment_method_stripe
                    : AppLocalizations.of(context).advertisement_payment_method_cmi,
              ),
              const SizedBox(height: AppTokens.space6),
              AppButton(
                label: AppLocalizations.of(context).advertisement_submit,
                variant: AppButtonVariant.primary,
                fullWidth: true,
                isLoading: _isSubmitting,
                onPressed: _submit,
              ),
              const SizedBox(height: AppTokens.space4),
            ],
          ),
        ),
      ),
    );
  }
}
