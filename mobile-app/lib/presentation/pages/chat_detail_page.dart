import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/media_url_utils.dart';
import '../../generated/l10n/app_localizations.dart';
import '../../data/models/message_model.dart';
import '../providers/auth_provider.dart';
import '../providers/message_provider.dart';

import '../../core/design_system/tokens/app_tokens.dart';

class ChatDetailPage extends ConsumerStatefulWidget {
  final int userId;
  final String userName;
  final int? propertyId;
  final String? propertyTitle;

  const ChatDetailPage({
    super.key,
    required this.userId,
    required this.userName,
    this.propertyId,
    this.propertyTitle,
  });

  @override
  ConsumerState<ChatDetailPage> createState() => _ChatDetailPageState();
}

class _ChatDetailPageState extends ConsumerState<ChatDetailPage> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  bool _initialScrollDone = false;
  int? _lastMessageCount;

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(messageProvider.notifier).setActivePartner(widget.userId);
      ref.read(messageProvider.notifier).loadConversation(widget.userId);
      _subscribe();
    });
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _unsubscribe();
    ref.read(messageProvider.notifier).setActivePartner(null);
    super.dispose();
  }

  void _subscribe() {
    final currentUserId = ref.read(authProvider).user?.id ?? 0;
    if (currentUserId == 0) return;
    final roomId = MessageModel.roomIdFor(currentUserId, widget.userId);
    ref.read(messageProvider.notifier).subscribeToRoom(roomId);
  }

  void _unsubscribe() {
    final currentUserId = ref.read(authProvider).user?.id ?? 0;
    if (currentUserId == 0) return;
    final roomId = MessageModel.roomIdFor(currentUserId, widget.userId);
    ref.read(messageProvider.notifier).unsubscribeFromRoom(roomId);
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    if (position.pixels < 120) {
      final hasMore = ref.read(messageProvider.select((s) => s.hasMore));
      final isLoadingMore = ref.read(messageProvider.select((s) => s.isLoadingMore));
      if (hasMore && !isLoadingMore) {
        ref.read(messageProvider.notifier).loadMoreMessages(widget.userId);
      }
    }
  }

  void _sendMessage() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    final currentUser = ref.read(authProvider).user;
    if (currentUser == null) return;

    ref.read(messageProvider.notifier).sendMessage(
          receiverId: widget.userId,
          content: text,
          propertyId: widget.propertyId,
        );

    _textController.clear();
    _scrollToBottom();
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

  void _maybeScrollToBottom(int messageCount) {
    if (_lastMessageCount != null && messageCount > _lastMessageCount!) {
      if (_scrollController.hasClients) {
        final nearBottom = _scrollController.position.maxScrollExtent -
                _scrollController.position.pixels <
            120;
        if (nearBottom) _scrollToBottom();
      }
    }
    _lastMessageCount = messageCount;
  }

  String _formatHeader() {
    if (widget.propertyTitle != null && widget.propertyTitle!.isNotEmpty) {
      return '${widget.userName} · ${widget.propertyTitle}';
    }
    return widget.userName;
  }

  void _confirmDelete(MessageModel message) {
    final l10n = AppLocalizations.of(context);
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.delete),
        content: Text('${l10n.delete} ce message ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              ref.read(messageProvider.notifier).deleteMessage(message.id);
            },
            child: Text(l10n.confirm, style: const TextStyle(color: AppTheme.error500)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(messageProvider);
    final currentUser = ref.watch(authProvider).user;
    final currentUserId = currentUser?.id ?? 0;
    final colorScheme = Theme.of(context).colorScheme;
    final l10n = AppLocalizations.of(context);

    final partnerConversation = ref.watch(
      messageProvider.select(
        (s) => s.conversations.firstWhere(
          (c) => c.partnerId == widget.userId,
          orElse: () => ConversationModel(
            partnerId: widget.userId,
            partnerName: widget.userName,
            lastMessage: '',
            unreadCount: 0,
          ),
        ),
      ),
    );

    final grouped = _groupByDate(state.messages);
    if (!_initialScrollDone && !state.isLoading && state.messages.isNotEmpty) {
      _initialScrollDone = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    }
    _maybeScrollToBottom(state.messages.length);

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            _HeaderAvatar(
              avatar: partnerConversation.partnerAvatar,
              name: widget.userName,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _formatHeader(),
                    style: const TextStyle(fontSize: 15),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Row(
                    children: [
                      if (partnerConversation.partnerRole != null)
                        _RoleBadge(label: _localizedRole(l10n, partnerConversation.partnerRole)),
                      if (partnerConversation.partnerRole != null) const SizedBox(width: 6),
                      if (state.isTyping && state.typingUserId == widget.userId)
                        Text(
                          l10n.chat_typing,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w400),
                        )
                      else if (state.isConnected)
                        Text(
                          l10n.chat_online,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                            color: AppTokens.success500,
                          ),
                        )
                      else
                        Text(
                          l10n.chat_offline,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w400),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        backgroundColor: colorScheme.primary,
        foregroundColor: colorScheme.onPrimary,
        actions: [
          if (!state.isConnected)
            IconButton(
              icon: const Icon(Icons.refresh),
              tooltip: l10n.tooltip_refresh,
              onPressed: () => ref.read(messageProvider.notifier).reconnect(),
            ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: state.isLoading && state.messages.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(12),
                    itemCount: grouped.length,
                    itemBuilder: (context, index) {
                      final group = grouped[index];
                      return Column(
                        children: [
                          _DateHeader(date: group.date, l10n: l10n),
                          ...group.messages.map((message) {
                            final isMe = message.senderId == currentUserId;
                            final isPending = state.pendingMessageIds.contains(message.id);
                            final isFailed = state.failedMessageIds.contains(message.id);
                            return _MessageBubble(
                              message: message,
                              isMe: isMe,
                              isPending: isPending,
                              isFailed: isFailed,
                              onDelete: isMe ? () => _confirmDelete(message) : null,
                            );
                          }),
                        ],
                      );
                    },
                  ),
          ),
          if (state.isTyping && state.typingUserId == widget.userId)
            Container(
              padding: const EdgeInsetsDirectional.only(start: 16, bottom: 4),
              alignment: AlignmentDirectional.centerStart,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: context.surfaceColor,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        const SizedBox(width: 8),
                        Text(l10n.chat_typing, style: const TextStyle(fontSize: 12)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: context.surfaceColor,
              boxShadow: [
                BoxShadow(
                  color: colorScheme.shadow.withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      decoration: InputDecoration(
                        hintText: l10n.chat_placeholder,
                        filled: true,
                        fillColor: context.backgroundColor,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                      onChanged: (_) {
                        if (currentUserId > 0) {
                          ref.read(messageProvider.notifier).sendTyping(widget.userId);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: colorScheme.primary,
                    child: IconButton(
                      icon: Icon(Icons.send, color: colorScheme.onPrimary, size: 20),
                      tooltip: l10n.chat_send,
                      onPressed: _sendMessage,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<_MessageGroup> _groupByDate(List<MessageModel> messages) {
    final groups = <_MessageGroup>[];
    for (final msg in messages) {
      final dt = DateTime.tryParse(msg.timestamp ?? msg.createdAt ?? '');
      if (dt == null) continue;
      final date = DateTime(dt.year, dt.month, dt.day);
      if (groups.isEmpty || !groups.last.date.isAtSameMomentAs(date)) {
        groups.add(_MessageGroup(date: date, messages: [msg]));
      } else {
        groups.last.messages.add(msg);
      }
    }
    return groups;
  }
}

class _MessageGroup {
  final DateTime date;
  final List<MessageModel> messages;

  _MessageGroup({required this.date, required this.messages});
}

class _DateHeader extends StatelessWidget {
  final DateTime date;
  final AppLocalizations l10n;

  const _DateHeader({required this.date, required this.l10n});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));

    String label;
    if (date.isAtSameMomentAs(today)) {
      label = l10n.today;
    } else if (date.isAtSameMomentAs(yesterday)) {
      label = l10n.yesterday;
    } else {
      label = DateFormat.yMMMMd().format(date);
    }

    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final MessageModel message;
  final bool isMe;
  final bool isPending;
  final bool isFailed;
  final VoidCallback? onDelete;

  const _MessageBubble({
    required this.message,
    required this.isMe,
    this.isPending = false,
    this.isFailed = false,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Align(
      alignment: isMe
          ? AlignmentDirectional.centerEnd
          : AlignmentDirectional.centerStart,
      child: GestureDetector(
        onLongPress: onDelete,
        child: Semantics(
          label: message.content,
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.75,
            ),
            decoration: BoxDecoration(
              color: isMe
                  ? colorScheme.primary
                  : colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadiusDirectional.only(
                topStart: const Radius.circular(16),
                topEnd: const Radius.circular(16),
                bottomStart: Radius.circular(isMe ? 16 : 4),
                bottomEnd: Radius.circular(isMe ? 4 : 16),
              ),
              boxShadow: [
                BoxShadow(
                  color: colorScheme.shadow.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  message.content,
                  style: TextStyle(
                    color: isMe ? colorScheme.onPrimary : colorScheme.onSurface,
                    fontSize: 15,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _formatTime(message.timestamp),
                      style: TextStyle(
                        color: isMe
                            ? colorScheme.onPrimary.withValues(alpha: 0.7)
                            : colorScheme.onSurfaceVariant,
                        fontSize: 11,
                      ),
                    ),
                    if (isMe) ...[
                      const SizedBox(width: 4),
                      if (isPending)
                        SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(
                            strokeWidth: 1.5,
                            color: colorScheme.onPrimary.withValues(alpha: 0.7),
                          ),
                        )
                      else if (isFailed)
                        Icon(
                          Icons.error_outline,
                          size: 14,
                          color: colorScheme.onPrimary.withValues(alpha: 0.9),
                        )
                      else
                        Icon(
                          message.isRead ? Icons.done_all : Icons.done,
                          size: 14,
                          color: message.isRead
                              ? colorScheme.onPrimary.withValues(alpha: 0.7)
                              : colorScheme.onPrimary.withValues(alpha: 0.54),
                        ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatTime(String? timestamp) {
    if (timestamp == null) return '';
    try {
      final dt = DateTime.parse(timestamp);
      return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '';
    }
  }
}

String _localizedRole(AppLocalizations l10n, String? role) {
  if (role == null) return '';
  final normalized = role.trim().toUpperCase();
  switch (normalized) {
    case 'ADMIN':
      return l10n.roleAdmin;
    case 'PROPRIETAIRE':
    case 'OWNER':
      return l10n.roleOwner;
    case 'LOCATAIRE':
    case 'TENANT':
    case 'USER':
      return l10n.roleTenant;
    default:
      return '';
  }
}

class _RoleBadge extends StatelessWidget {
  final String label;

  const _RoleBadge({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: AppTheme.primary100,
        borderRadius: BorderRadius.circular(AppTokens.radiusFull),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: AppTheme.primary600,
        ),
      ),
    );
  }
}

class _HeaderAvatar extends StatelessWidget {
  final String? avatar;
  final String name;

  const _HeaderAvatar({this.avatar, required this.name});

  @override
  Widget build(BuildContext context) {
    final fallback = name.isNotEmpty ? name[0].toUpperCase() : '?';
    final url = fixMediaUrl(avatar);

    if (url.isEmpty) {
      return CircleAvatar(
        backgroundColor: AppTheme.primary100,
        child: Text(
          fallback,
          style: const TextStyle(
            color: AppTheme.primary500,
            fontWeight: FontWeight.w700,
          ),
        ),
      );
    }

    return CachedNetworkImage(
      imageUrl: url,
      imageBuilder: (context, imageProvider) => CircleAvatar(
        backgroundImage: imageProvider,
        backgroundColor: AppTheme.primary100,
      ),
      placeholder: (context, url) => CircleAvatar(
        backgroundColor: AppTheme.primary100,
        child: Text(
          fallback,
          style: const TextStyle(
            color: AppTheme.primary500,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      errorWidget: (context, url, error) => CircleAvatar(
        backgroundColor: AppTheme.primary100,
        child: Text(
          fallback,
          style: const TextStyle(
            color: AppTheme.primary500,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}
