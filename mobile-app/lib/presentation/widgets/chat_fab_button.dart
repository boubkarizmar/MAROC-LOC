import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_theme.dart';

import '../../core/design_system/tokens/app_tokens.dart';

/// Bouton flottant global pour accéder au chatbot IA
/// Accessible depuis Home, Dashboard et autres pages principales
class ChatFabButton extends StatefulWidget {
  final double bottomOffset;
  final double rightOffset;

  const ChatFabButton({
    super.key,
    this.bottomOffset = 24,
    this.rightOffset = 24,
  });

  @override
  State<ChatFabButton> createState() => _ChatFabButtonState();
}

class _ChatFabButtonState extends State<ChatFabButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.15).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _pulseController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  void _onTap() {
    HapticFeedback.mediumImpact();
    context.push('/chatbot');
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      bottom: widget.bottomOffset,
      right: widget.rightOffset,
      child: AnimatedBuilder(
        animation: _pulseAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _pulseAnimation.value,
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primary500.withValues(alpha: 0.4),
                    blurRadius: 16,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Material(
                color:
                    Theme.of(context).colorScheme.surface.withValues(alpha: 0),
                child: InkWell(
                  onTap: _onTap,
                  customBorder: const CircleBorder(),
                  child: Ink(
                    width: 56,
                    height: 56,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppTheme.primary500, AppTheme.primary700],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Stack(
                      alignment: Alignment.center,
                      children: [
                        Icon(
                          Icons.auto_awesome,
                          color: AppTokens.gray50,
                          size: 26,
                        ),
                        // Notification dot (placeholder for unread messages)
                        Positioned(
                          top: 12,
                          right: 12,
                          child: SizedBox.shrink(),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Version mini du bouton chatbot pour les listes scrollables
class ChatFabMini extends StatelessWidget {
  const ChatFabMini({super.key});

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton.small(
      heroTag: 'chatbot_mini',
      backgroundColor: AppTheme.primary500,
      onPressed: () {
        HapticFeedback.lightImpact();
        context.push('/chatbot');
      },
      child: const Icon(Icons.auto_awesome, color: AppTokens.gray50, size: 20),
    );
  }
}
