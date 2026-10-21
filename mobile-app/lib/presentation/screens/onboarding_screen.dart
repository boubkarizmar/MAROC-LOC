import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import '../../core/design_system/components/app_button.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../generated/l10n/app_localizations.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  int _currentPage = 0;
  late final PageController _pageController;
  late final List<AnimationController> _animControllers;

  static const List<_OnboardingPageMeta> _pageMeta = [
    _OnboardingPageMeta(
      icon: Icons.auto_awesome,
      color: AppTokens.primary600,
    ),
    _OnboardingPageMeta(
      icon: Icons.search,
      color: AppTokens.atlas500,
    ),
    _OnboardingPageMeta(
      icon: Icons.favorite,
      color: AppTokens.terracotta500,
    ),
    _OnboardingPageMeta(
      icon: Icons.chat_bubble,
      color: AppTokens.primary600,
    ),
    _OnboardingPageMeta(
      icon: Icons.workspace_premium,
      color: AppTokens.gold500,
    ),
  ];

  List<_OnboardingPage> _buildPages(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return [
      _OnboardingPage(
        icon: _pageMeta[0].icon,
        title: l10n.onboarding_title_1,
        description: l10n.onboarding_desc_1,
        color: _pageMeta[0].color,
      ),
      _OnboardingPage(
        icon: _pageMeta[1].icon,
        title: l10n.onboarding_title_2,
        description: l10n.onboarding_desc_2,
        color: _pageMeta[1].color,
      ),
      _OnboardingPage(
        icon: _pageMeta[2].icon,
        title: l10n.onboarding_title_3,
        description: l10n.onboarding_desc_3,
        color: _pageMeta[2].color,
      ),
      _OnboardingPage(
        icon: _pageMeta[3].icon,
        title: l10n.onboarding_title_4,
        description: l10n.onboarding_desc_4,
        color: _pageMeta[3].color,
      ),
      _OnboardingPage(
        icon: _pageMeta[4].icon,
        title: l10n.onboarding_title_5,
        description: l10n.onboarding_desc_5,
        color: _pageMeta[4].color,
      ),
    ];
  }

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _animControllers = List.generate(
      _pageMeta.length,
      (index) => AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 600),
      ),
    );
    _animControllers[0].forward();
  }

  @override
  void dispose() {
    _pageController.dispose();
    for (final controller in _animControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  void _onPageChanged(int page) {
    setState(() => _currentPage = page);
    for (int i = 0; i < _animControllers.length; i++) {
      if (i == page) {
        _animControllers[i].forward();
      } else {
        _animControllers[i].reverse();
      }
    }
  }

  void _nextPage() {
    if (_currentPage < _pageMeta.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOutCubic,
      );
    } else {
      _finish();
    }
  }

  void _finish() async {
    const storage = FlutterSecureStorage();
    await storage.write(key: 'onboarding_complete', value: 'true');
    if (mounted) {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final pages = _buildPages(context);
    final isLast = _currentPage == pages.length - 1;

    return Scaffold(
      backgroundColor: AppTokens.primary500,
      body: SafeArea(
        child: Column(
          children: [
            Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: TextButton(
                  onPressed: _finish,
                  child: Text(l10n.onboarding_skip,
                      style: TextStyle(
                          color: AppTokens.gray50.withValues(alpha: 0.7))),
                ),
              ),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: _onPageChanged,
                itemCount: pages.length,
                itemBuilder: (context, index) {
                  return _OnboardingPageView(
                    page: pages[index],
                    animation: _animControllers[index],
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      pages.length,
                      (index) => AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: _currentPage == index ? 24 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: _currentPage == index
                              ? AppTokens.gold500
                              : AppTokens.gray50.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  Row(
                    children: [
                      if (_currentPage > 0)
                        Expanded(
                          flex: 1,
                          child: AppButton(
                            label: l10n.onboarding_previous,
                            variant: AppButtonVariant.secondary,
                            onPressed: () => _pageController.previousPage(
                              duration: const Duration(milliseconds: 400),
                              curve: Curves.easeInOutCubic,
                            ),
                          ),
                        )
                      else
                        const Spacer(flex: 1),
                      const SizedBox(width: 12),
                      Expanded(
                        flex: 2,
                        child: AppButton(
                          label: isLast
                              ? l10n.onboarding_start
                              : l10n.onboarding_next,
                          variant: AppButtonVariant.primary,
                          onPressed: _nextPage,
                        ),
                      ),
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
}

class _OnboardingPageMeta {
  final IconData icon;
  final Color color;

  const _OnboardingPageMeta({
    required this.icon,
    required this.color,
  });
}

class _OnboardingPage {
  final IconData icon;
  final String title;
  final String description;
  final Color color;

  const _OnboardingPage({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });
}

class _OnboardingPageView extends StatelessWidget {
  final _OnboardingPage page;
  final AnimationController animation;

  const _OnboardingPageView({required this.page, required this.animation});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          ScaleTransition(
            scale: CurvedAnimation(
              parent: animation,
              curve: const Interval(0, 0.5, curve: Curves.elasticOut),
            ),
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppTokens.gray50.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(32),
              ),
              child: Icon(page.icon, size: 56, color: AppTokens.gold500),
            ),
          ),
          const SizedBox(height: 40),
          FadeTransition(
            opacity: CurvedAnimation(
                parent: animation,
                curve: const Interval(0.2, 0.7, curve: Curves.easeOut)),
            child: SlideTransition(
              position:
                  Tween<Offset>(begin: const Offset(0, 0.3), end: Offset.zero)
                      .animate(
                CurvedAnimation(
                    parent: animation,
                    curve: const Interval(0.2, 0.7, curve: Curves.easeOut)),
              ),
              child: Text(
                page.title,
                style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: AppTokens.gray50,
                    height: 1.2),
                textAlign: TextAlign.center,
              ),
            ),
          ),
          const SizedBox(height: 16),
          FadeTransition(
            opacity: CurvedAnimation(
                parent: animation,
                curve: const Interval(0.4, 0.9, curve: Curves.easeOut)),
            child: SlideTransition(
              position:
                  Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero)
                      .animate(
                CurvedAnimation(
                    parent: animation,
                    curve: const Interval(0.4, 0.9, curve: Curves.easeOut)),
              ),
              child: Text(
                page.description,
                style: TextStyle(
                    fontSize: 16,
                    color: AppTokens.gray50.withValues(alpha: 0.7),
                    height: 1.6),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
