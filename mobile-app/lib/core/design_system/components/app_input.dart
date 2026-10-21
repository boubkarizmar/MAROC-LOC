import 'package:flutter/material.dart';
import '../tokens/app_tokens.dart';

class AppInput extends StatefulWidget {
  final String? label;
  final String? hint;
  final String? helperText;
  final String? errorText;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final bool obscureText;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final VoidCallback? onSuffixTap;
  final ValueChanged<String>? onChanged;
  final FormFieldValidator<String>? validator;
  final int? maxLines;
  final bool enabled;

  const AppInput({
    super.key,
    this.label,
    this.hint,
    this.helperText,
    this.errorText,
    this.controller,
    this.keyboardType,
    this.obscureText = false,
    this.prefixIcon,
    this.suffixIcon,
    this.onSuffixTap,
    this.onChanged,
    this.validator,
    this.maxLines = 1,
    this.enabled = true,
  });

  @override
  State<AppInput> createState() => _AppInputState();
}

class _AppInputState extends State<AppInput> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(
            widget.label!,
            style: theme.textTheme.labelMedium?.copyWith(
              color: theme.colorScheme.onSurface,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
        ],
        TextFormField(
          controller: widget.controller,
          keyboardType: widget.keyboardType,
          obscureText: widget.obscureText && _obscure,
          onChanged: widget.onChanged,
          validator: widget.validator,
          maxLines: widget.obscureText ? 1 : widget.maxLines,
          enabled: widget.enabled,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurface,
          ),
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: theme.textTheme.bodySmall?.copyWith(
              color: AppTokens.gray400,
            ),
            prefixIcon: widget.prefixIcon != null
                ? Padding(
                    padding: const EdgeInsetsDirectional.only(start: 12, end: 8),
                    child: widget.prefixIcon,
                  )
                : null,
            prefixIconConstraints: const BoxConstraints(
              minWidth: 40,
              minHeight: 40,
            ),
            suffixIcon: _buildSuffixIcon(theme),
            suffixIconConstraints: const BoxConstraints(
              minWidth: 40,
              minHeight: 40,
            ),
            filled: true,
            fillColor: isDark ? AppTokens.darkSurface : AppTokens.gray100,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTokens.radiusMd),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTokens.radiusMd),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTokens.radiusMd),
              borderSide: const BorderSide(
                color: AppTokens.primary500,
                width: 2,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTokens.radiusMd),
              borderSide: const BorderSide(
                color: AppTokens.error500,
                width: 1,
              ),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(AppTokens.radiusMd),
              borderSide: const BorderSide(
                color: AppTokens.error500,
                width: 2,
              ),
            ),
            errorText: widget.errorText,
          ),
        ),
        if (widget.helperText != null && widget.errorText == null) ...[
          const SizedBox(height: 6),
          Text(
            widget.helperText!,
            style: theme.textTheme.labelSmall?.copyWith(
              color: AppTokens.gray400,
            ),
          ),
        ],
      ],
    );
  }

  Widget? _buildSuffixIcon(ThemeData theme) {
    if (widget.obscureText) {
      return GestureDetector(
        onTap: () => setState(() => _obscure = !_obscure),
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: Icon(
            _obscure
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
            key: ValueKey(_obscure),
            color: AppTokens.gray400,
            size: 20,
          ),
        ),
      );
    }
    if (widget.suffixIcon != null) {
      return GestureDetector(
        onTap: widget.onSuffixTap,
        child: widget.suffixIcon,
      );
    }
    return null;
  }
}
