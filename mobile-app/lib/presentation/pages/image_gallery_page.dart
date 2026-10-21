import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_theme.dart';

import '../../core/design_system/tokens/app_tokens.dart';

class ImageGalleryPage extends StatefulWidget {
  final List<String> images;
  final int initialIndex;

  const ImageGalleryPage({
    super.key,
    required this.images,
    this.initialIndex = 0,
  });

  @override
  State<ImageGalleryPage> createState() => _ImageGalleryPageState();
}

class _ImageGalleryPageState extends State<ImageGalleryPage> {
  late final PageController _pageController;
  late int _currentIndex;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTokens.darkBg,
      body: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            itemCount: widget.images.length,
            onPageChanged: (index) => setState(() => _currentIndex = index),
            itemBuilder: (context, index) {
              return InteractiveViewer(
                minScale: 0.5,
                maxScale: 4.0,
                child: Center(
                  child: CachedNetworkImage(
                    imageUrl: widget.images[index],
                    fit: BoxFit.contain,
                    placeholder: (_, __) => const Center(
                      child: CircularProgressIndicator(color: AppTokens.gray50),
                    ),
                    errorWidget: (_, __, ___) => const Center(
                      child: Icon(Icons.image_not_supported,
                          color: AppTokens.gray50, size: 64),
                    ),
                  ),
                ),
              );
            },
          ),
          // Top bar
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: AppTokens.gray900.withValues(alpha: 0.54),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.close, color: AppTokens.gray50),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppTokens.gray900.withValues(alpha: 0.54),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      '${_currentIndex + 1} / ${widget.images.length}',
                      style: const TextStyle(
                          color: AppTokens.gray50, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Thumbnail strip at bottom
          if (widget.images.length > 1)
            Positioned(
              bottom: 24,
              left: 0,
              right: 0,
              child: SafeArea(
                child: SizedBox(
                  height: 60,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: widget.images.length,
                    itemBuilder: (context, index) {
                      final isSelected = index == _currentIndex;
                      return GestureDetector(
                        onTap: () {
                          _pageController.animateToPage(
                            index,
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                        child: Container(
                          margin: const EdgeInsetsDirectional.only(end: 8),
                          width: 60,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            border: isSelected
                                ? Border.all(color: AppTheme.gold400, width: 2)
                                : null,
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Opacity(
                              opacity: isSelected ? 1.0 : 0.5,
                              child: CachedNetworkImage(
                                imageUrl: widget.images[index],
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
