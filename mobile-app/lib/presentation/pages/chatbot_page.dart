import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/theme/app_theme.dart';
import '../../generated/l10n/app_localizations.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/chat/chat_message_model.dart';
import '../../data/models/property_model.dart';
import '../providers/ai_chat_provider.dart';

class ChatbotPage extends ConsumerStatefulWidget {
  const ChatbotPage({super.key});

  @override
  ConsumerState<ChatbotPage> createState() => _ChatbotPageState();
}

class _ChatbotPageState extends ConsumerState<ChatbotPage>
    with TickerProviderStateMixin {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  late final AnimationController _typingController;
  late final AnimationController _micPulseController;
  final FocusNode _focusNode = FocusNode();
  final Map<String, bool?> _feedbackMap = {};

  @override
  void initState() {
    super.initState();
    _typingController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    _micPulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );

    Future.microtask(() {
      ref.read(aiChatProvider.notifier).initialize();
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    _typingController.dispose();
    _micPulseController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage({String? text}) async {
    final messageText = text ?? _textController.text.trim();
    if (messageText.isEmpty) return;

    if (text == null) {
      _textController.clear();
      _focusNode.unfocus();
    }

    HapticFeedback.lightImpact();
    await ref.read(aiChatProvider.notifier).sendMessage(messageText);
    _scrollToBottom();
  }

  Future<void> _toggleVoice() async {
    final chatState = ref.read(aiChatProvider);
    if (chatState.isListening) {
      await ref.read(aiChatProvider.notifier).stopVoiceInput();
      _micPulseController.stop();
    } else {
      _micPulseController.repeat(reverse: true);
      await ref.read(aiChatProvider.notifier).startVoiceInput();
    }
  }

  void _changeLanguage(String lang) {
    HapticFeedback.lightImpact();
    ref.read(aiChatProvider.notifier).changeLanguage(lang);
  }

  void _copyMessage(String text) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Copied'),
        duration: Duration(seconds: 1),
      ),
    );
  }

  void _handleFeedback(ChatMessageModel msg, bool helpful) {
    setState(() {
      _feedbackMap[msg.id] = helpful;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Thanks for your feedback'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  void _resetChat() {
    HapticFeedback.mediumImpact();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(AppLocalizations.of(context).chat_reset_title),
        content: Text(AppLocalizations.of(context).chat_reset_confirm),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(AppLocalizations.of(context).cancel),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(aiChatProvider.notifier).resetConversation();
            },
            child: Text(
              AppLocalizations.of(context).confirm,
              style: const TextStyle(color: AppTheme.error500),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(aiChatProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = isDark ? AppTheme.primary400 : AppTheme.primary500;

    // Auto-scroll quand les messages changent
    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: context.surfaceColor,
        foregroundColor: context.textPrimary,
        title: Row(
          children: [
            _buildStatusDot(chatState.isLoading),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  AppLocalizations.of(context).chatbot_title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: context.textPrimary,
                  ),
                ),
                Text(
                  chatState.isLoading
                      ? AppLocalizations.of(context).chatbot_typing
                      : AppLocalizations.of(context).chat_online,
                  style: TextStyle(
                    fontSize: 12,
                    color: context.textSecondary,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          _buildLanguageSelector(chatState.currentLanguage, isDark),
          Semantics(
            button: true,
            label: AppLocalizations.of(context).chatbot_new_conversation,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: AppLocalizations.of(context).chatbot_new_conversation,
              onPressed: _resetChat,
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: GestureDetector(
              onTap: () => _focusNode.unfocus(),
              child: ListView.builder(
                controller: _scrollController,
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                itemCount:
                    chatState.messages.length + (chatState.isLoading ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index >= chatState.messages.length) {
                    return _buildTypingIndicator(isDark);
                  }
                  final msg = chatState.messages[index];
                  return _buildMessageItem(msg, isDark, primaryColor);
                },
              ),
            ),
          ),

          // Quick replies
          if (chatState.lastQuickReplies != null &&
              chatState.lastQuickReplies!.isNotEmpty &&
              !chatState.isLoading)
            _buildQuickReplies(chatState.lastQuickReplies!, isDark),

          // Error banner
          if (chatState.error != null)
            _buildErrorBanner(chatState.error!, isDark),

          // Input area
          _buildInputArea(chatState, isDark, primaryColor),
        ],
      ),
    );
  }

  Widget _buildStatusDot(bool isLoading) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      width: 10,
      height: 10,
      decoration: BoxDecoration(
        color: isLoading ? AppTheme.gold500 : AppTheme.success500,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: (isLoading ? AppTheme.gold500 : AppTheme.success500)
                .withValues(alpha: 0.4),
            blurRadius: 6,
            spreadRadius: 1,
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageSelector(String currentLang, bool isDark) {
    final flags = {
      'fr': '🇫🇷',
      'ar': '🇸🇦',
      'en': '🇬🇧',
      'darija': '🇲🇦',
    };

    return PopupMenuButton<String>(
      icon: Text(flags[currentLang] ?? '🇫🇷',
          style: const TextStyle(fontSize: 20)),
      tooltip: AppLocalizations.of(context).chatbot_language,
      onSelected: _changeLanguage,
      itemBuilder: (context) => [
        PopupMenuItem(
            value: 'fr',
            child: Text(AppLocalizations.of(context).language_french_flag)),
        PopupMenuItem(
            value: 'ar',
            child: Text(AppLocalizations.of(context).language_arabic_flag)),
        PopupMenuItem(
            value: 'en',
            child: Text(AppLocalizations.of(context).language_english_flag)),
        PopupMenuItem(
            value: 'darija',
            child: Text(AppLocalizations.of(context).language_darija_flag)),
      ],
    );
  }

  Widget _buildMessageItem(
      ChatMessageModel msg, bool isDark, Color primaryColor) {
    if (msg.type == ChatMessageType.typingIndicator) {
      return _buildTypingIndicator(isDark);
    }

    if (msg.type == ChatMessageType.error) {
      return _buildErrorMessage(msg, isDark);
    }

    if (msg.type == ChatMessageType.system) {
      return _buildSystemMessage(msg, isDark);
    }

    final isUser = msg.isUser;
    final bgColor = isUser ? primaryColor : context.colors.surface;
    final textColor = isUser ? AppTheme.gray50 : context.textPrimary;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
      margin: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isUser) _buildBotAvatar(isDark),
          const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.75,
                  ),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadiusDirectional.only(
                      topStart: const Radius.circular(18),
                      topEnd: const Radius.circular(18),
                      bottomStart: Radius.circular(isUser ? 18 : 4),
                      bottomEnd: Radius.circular(isUser ? 4 : 18),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.gray900
                            .withValues(alpha: isDark ? 0.2 : 0.05),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        msg.text,
                        style: TextStyle(
                          color: textColor,
                          fontSize: 15,
                          height: 1.4,
                        ),
                      ),
                      if (!isUser && msg.audioUrl != null)
                        _buildAudioPlayer(msg.audioUrl!, isDark),
                    ],
                  ),
                ),
                // Property cards
                if (msg.properties != null && msg.properties!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: _buildPropertyCards(msg.properties!, isDark),
                  ),
                // Actions
                if (msg.actions != null && msg.actions!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: _buildActionButtons(msg.actions!, isDark),
                  ),
                const SizedBox(height: 2),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _formatTime(msg.timestamp),
                      style: TextStyle(
                        fontSize: 10,
                        color: context.textMuted,
                      ),
                    ),
                    if (!isUser && msg.type == ChatMessageType.text)
                      _buildMessageActions(msg),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (isUser) _buildUserAvatar(),
        ],
      ),
    );
  }

  Widget _buildMessageActions(ChatMessageModel msg) {
    final feedback = _feedbackMap[msg.id];
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(width: 8),
        InkWell(
          onTap: () => _copyMessage(msg.text),
          child: Icon(Icons.copy, size: 14, color: context.textMuted),
        ),
        const SizedBox(width: 8),
        InkWell(
          onTap: () => _handleFeedback(msg, true),
          child: Icon(
            Icons.thumb_up_alt_outlined,
            size: 14,
            color: feedback == true ? AppTheme.success500 : context.textMuted,
          ),
        ),
        const SizedBox(width: 8),
        InkWell(
          onTap: () => _handleFeedback(msg, false),
          child: Icon(
            Icons.thumb_down_alt_outlined,
            size: 14,
            color: feedback == false ? AppTheme.error500 : context.textMuted,
          ),
        ),
      ],
    );
  }

  Widget _buildBotAvatar(bool isDark) {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primary500, AppTheme.primary700],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Icon(
        Icons.auto_awesome,
        color: AppTheme.gray50,
        size: 18,
      ),
    );
  }

  Widget _buildUserAvatar() {
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: AppTheme.gold500.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.gold500, width: 1.5),
      ),
      child: const Icon(
        Icons.person,
        color: AppTheme.gold600,
        size: 18,
      ),
    );
  }

  Widget _buildTypingIndicator(bool isDark) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        _buildBotAvatar(isDark),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: context.colors.surface,
            borderRadius: const BorderRadiusDirectional.only(
              topStart: Radius.circular(18),
              topEnd: Radius.circular(18),
              bottomStart: Radius.circular(4),
              bottomEnd: Radius.circular(18),
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.gray900.withValues(alpha: isDark ? 0.2 : 0.05),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDot(0, isDark),
              const SizedBox(width: 4),
              _buildDot(1, isDark),
              const SizedBox(width: 4),
              _buildDot(2, isDark),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDot(int index, bool isDark) {
    return AnimatedBuilder(
      animation: _typingController,
      builder: (context, child) {
        final double offset = (index * 0.3 + _typingController.value) % 1.0;
        final double scale =
            0.5 + 0.5 * (offset < 0.5 ? offset * 2 : (1 - offset) * 2);
        return Transform.scale(
          scale: scale,
          child: Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: isDark ? AppTheme.gray400 : AppTheme.gray500,
              shape: BoxShape.circle,
            ),
          ),
        );
      },
    );
  }

  Widget _buildErrorMessage(ChatMessageModel msg, bool isDark) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: AppTheme.error50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.error400),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, color: AppTheme.error500, size: 18),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                msg.text,
                style: const TextStyle(color: AppTheme.error600, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSystemMessage(ChatMessageModel msg, bool isDark) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: context.surfaceColor.withValues(alpha: 0.7),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          msg.text,
          style: TextStyle(
            fontSize: 12,
            color: isDark ? AppTheme.gray400 : AppTheme.gray500,
          ),
        ),
      ),
    );
  }

  Widget _buildPropertyCards(List<PropertyModel> properties, bool isDark) {
    return SizedBox(
      height: 220,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: properties.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (context, index) {
          return _PropertyCard(
            property: properties[index],
            isDark: isDark,
            onTap: () {
              HapticFeedback.lightImpact();
              ref
                  .read(aiChatProvider.notifier)
                  .trackPropertyClick(properties[index].id);
              context.push('/property/${properties[index].id}');
            },
          );
        },
      ),
    );
  }

  Widget _buildActionButtons(List<ChatAction> actions, bool isDark) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: actions.map((action) {
        return ActionChip(
          avatar: _getActionIcon(action.type),
          label: Text(action.label),
          backgroundColor: isDark ? AppTheme.primary900 : AppTheme.primary50,
          side: BorderSide(
              color: isDark ? AppTheme.primary700 : AppTheme.primary200),
          labelStyle: TextStyle(
            color: isDark ? AppTheme.primary300 : AppTheme.primary700,
            fontSize: 12,
          ),
          onPressed: () {
            HapticFeedback.lightImpact();
            _sendMessage(text: action.label);
          },
        );
      }).toList(),
    );
  }

  Widget _getActionIcon(String type) {
    final iconMap = {
      'search': Icons.search,
      'filter': Icons.filter_list,
      'visit': Icons.calendar_today,
      'call': Icons.phone,
      'share': Icons.share,
      'favorite': Icons.favorite_border,
    };
    return Icon(iconMap[type] ?? Icons.touch_app, size: 16);
  }

  Widget _buildQuickReplies(List<QuickReply> replies, bool isDark) {
    return Container(
      height: 48,
      margin: const EdgeInsetsDirectional.only(bottom: 4, start: 8, end: 8),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: replies.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        itemBuilder: (context, index) {
          final qr = replies[index];
          return AnimatedScale(
            scale: 1.0,
            duration: const Duration(milliseconds: 200),
            child: ActionChip(
              avatar: _getQuickReplyIcon(qr.icon),
              label: Text(qr.label, style: const TextStyle(fontSize: 12)),
              backgroundColor: isDark
                  ? AppTheme.gold900.withValues(alpha: 0.3)
                  : AppTheme.gold50,
              side: BorderSide(
                  color: isDark ? AppTheme.gold700 : AppTheme.gold300),
              labelStyle: TextStyle(
                color: isDark ? AppTheme.gold300 : AppTheme.gold700,
                fontSize: 12,
              ),
              onPressed: () => _sendMessage(text: qr.label),
            ),
          );
        },
      ),
    );
  }

  Widget? _getQuickReplyIcon(String? icon) {
    if (icon == null) return null;
    final map = {
      'search': Icons.search,
      'price': Icons.attach_money,
      'trending': Icons.trending_up,
      'help': Icons.help_outline,
      'location': Icons.location_on,
      'home': Icons.home,
    };
    return Icon(map[icon], size: 16);
  }

  Widget _buildAudioPlayer(String audioUrl, bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: InkWell(
        onTap: () {
          final notifier = ref.read(aiChatProvider.notifier);
          notifier.speak(audioUrl);
        },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: context.backgroundColor,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.volume_up,
                size: 16,
                color: isDark ? AppTheme.primary300 : AppTheme.primary600,
              ),
              const SizedBox(width: 6),
              Text(
                AppLocalizations.of(context).chat_speak,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? AppTheme.primary300 : AppTheme.primary600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorBanner(String error, bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: AppTheme.error50,
      child: Row(
        children: [
          const Icon(Icons.signal_wifi_off, color: AppTheme.error500, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              error,
              style: const TextStyle(color: AppTheme.error600, fontSize: 13),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, color: AppTheme.error500, size: 18),
            tooltip: AppLocalizations.of(context).tooltip_close,
            onPressed: () => ref.read(aiChatProvider.notifier).clearError(),
          ),
        ],
      ),
    );
  }

  Widget _buildInputArea(
      AIChatState chatState, bool isDark, Color primaryColor) {
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(12, 8, 12, 16),
      decoration: BoxDecoration(
        color: context.surfaceColor,
        boxShadow: [
          BoxShadow(
            color: AppTheme.gray900.withValues(alpha: isDark ? 0.3 : 0.05),
            blurRadius: 12,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Mic button with pulse animation when listening
            AnimatedBuilder(
              animation: _micPulseController,
              builder: (context, child) {
                return Container(
                  decoration: chatState.isListening
                      ? BoxDecoration(
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppTheme.error500.withValues(
                                  alpha: _micPulseController.value * 0.5),
                              blurRadius: 12 + _micPulseController.value * 8,
                              spreadRadius: _micPulseController.value * 2,
                            ),
                          ],
                        )
                      : null,
                  child: IconButton(
                    icon: Icon(
                      chatState.isListening ? Icons.stop : Icons.mic,
                      color: chatState.isListening
                          ? AppTheme.error500
                          : isDark
                              ? AppTheme.gray400
                              : AppTheme.gray500,
                    ),
                    onPressed: _toggleVoice,
                    tooltip: chatState.isListening
                        ? AppLocalizations.of(context).chatbot_mic_stop
                        : AppLocalizations.of(context).chatbot_mic_start,
                  ),
                );
              },
            ),
            const SizedBox(width: 8),
            // Text field
            Expanded(
              child: Semantics(
                textField: true,
                label: AppLocalizations.of(context).chat_placeholder,
                child: TextField(
                  controller: _textController,
                  focusNode: _focusNode,
                  enabled: !chatState.isLoading,
                  decoration: InputDecoration(
                    hintText: AppLocalizations.of(context).chat_placeholder,
                    hintStyle: TextStyle(
                      color: isDark ? AppTheme.gray500 : AppTheme.gray400,
                    ),
                    filled: true,
                    fillColor: context.backgroundColor,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide(color: primaryColor, width: 1.5),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 18,
                      vertical: 12,
                    ),
                    suffixIcon: chatState.isLoading
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                        : null,
                  ),
                  style: TextStyle(
                    color: context.textPrimary,
                  ),
                  textInputAction: TextInputAction.send,
                  onSubmitted: (_) => _sendMessage(),
                  maxLines: 5,
                  minLines: 1,
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Send button
            Tooltip(
              message: AppLocalizations.of(context).chatbot_send,
              child: Semantics(
                button: true,
                label: AppLocalizations.of(context).chatbot_send,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  child: Material(
                    color: chatState.isLoading ||
                            _textController.text.trim().isEmpty
                        ? context.shimmerBase
                        : primaryColor,
                    borderRadius: BorderRadius.circular(24),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(24),
                      onTap: chatState.isLoading ? null : () => _sendMessage(),
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(22),
                          gradient: chatState.isLoading ||
                                  _textController.text.trim().isEmpty
                              ? null
                              : LinearGradient(
                                  colors: [primaryColor, AppTheme.primary600],
                                  begin: AlignmentDirectional.topStart,
                                  end: AlignmentDirectional.bottomEnd,
                                ),
                        ),
                        child: Icon(
                          Icons.send,
                          color: chatState.isLoading ||
                                  _textController.text.trim().isEmpty
                              ? context.textMuted
                              : AppTheme.gray50,
                          size: 20,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

// ==================== PROPERTY CARD WIDGET ====================

class _PropertyCard extends StatelessWidget {
  final PropertyModel property;
  final bool isDark;
  final VoidCallback onTap;

  const _PropertyCard({
    required this.property,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final imageUrl = property.coverImage;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 260,
        decoration: BoxDecoration(
          color: context.cardColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: AppTheme.gray900.withValues(alpha: isDark ? 0.3 : 0.08),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(16)),
              child: Stack(
                children: [
                  SizedBox(
                    height: 120,
                    width: double.infinity,
                    child: imageUrl != null
                        ? CachedNetworkImage(
                            imageUrl: imageUrl,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Shimmer.fromColors(
                              baseColor: context.shimmerBase,
                              highlightColor: context.shimmerHighlight,
                              child: Container(color: context.surfaceColor),
                            ),
                            errorWidget: (_, __, ___) => Container(
                              color: context.shimmerBase,
                              child: const Icon(Icons.image_not_supported,
                                  color: AppTheme.gray400),
                            ),
                          )
                        : Container(
                            color: context.shimmerBase,
                            child: const Icon(Icons.home,
                                color: AppTheme.gray400, size: 40),
                          ),
                  ),
                  // Price badge
                  PositionedDirectional(
                    top: 8,
                    end: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary500.withValues(alpha: 0.9),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        formatPrice(context, property.price, compact: true),
                        style: const TextStyle(
                          color: AppTheme.gray50,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            // Info
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
                      fontWeight: FontWeight.bold,
                      color: context.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.location_on,
                          size: 14, color: AppTheme.primary500),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          property.city,
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark ? AppTheme.gray400 : AppTheme.gray500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      _buildInfoChip(
                        Icons.square_foot,
                        formatArea(context, property.surface),
                        isDark,
                        context,
                      ),
                      const SizedBox(width: 8),
                      _buildInfoChip(
                        Icons.bed,
                        '${property.bedrooms ?? property.rooms}${AppLocalizations.of(context).property_bedrooms_unit}',
                        isDark,
                        context,
                      ),
                      const SizedBox(width: 8),
                      _buildInfoChip(
                        Icons.bathtub,
                        '${property.bathrooms ?? 1}${AppLocalizations.of(context).property_bathrooms_unit}',
                        isDark,
                        context,
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: onTap,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary500,
                        foregroundColor: AppTheme.gray50,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(
                        AppLocalizations.of(context).chatbot_view_detail,
                        style: TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(
      IconData icon, String text, bool isDark, BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: context.backgroundColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon,
              size: 12, color: isDark ? AppTheme.gray400 : AppTheme.gray500),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 11,
              color: isDark ? AppTheme.gray300 : AppTheme.gray600,
            ),
          ),
        ],
      ),
    );
  }
}
