import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../generated/l10n/app_localizations.dart';
import '../../core/design_system/tokens/app_tokens.dart';
import '../../core/theme/theme_extensions.dart';
import '../../core/theme/app_theme.dart';
import '../../core/design_system/widgets/app_empty_state.dart';
import '../../core/design_system/components/app_shimmer.dart';
import '../../core/utils/media_url_utils.dart';
import '../../data/models/message_model.dart';
import '../providers/message_provider.dart';

class MessagesPage extends ConsumerStatefulWidget {
  const MessagesPage({super.key});

  @override
  ConsumerState<MessagesPage> createState() => _MessagesPageState();
}

class _MessagesPageState extends ConsumerState<MessagesPage> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(messageProvider.notifier).loadConversations();
      ref.read(messageProvider.notifier).loadUnreadCount();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    await ref.read(messageProvider.notifier).loadConversations();
    await ref.read(messageProvider.notifier).loadUnreadCount();
  }

  @override
  Widget build(BuildContext context) {
    // Use select to rebuild only when the watched slice changes.
    final isLoading = ref.watch(messageProvider.select((s) => s.isLoading));
    final error = ref.watch(messageProvider.select((s) => s.error));
    final unreadCount = ref.watch(messageProvider.select((s) => s.unreadCount));
    final conversations = ref.watch(messageProvider.select((s) => s.conversations));

    final l10n = AppLocalizations.of(context);
    final searchTerm = _searchController.text.toLowerCase();
    final filtered = conversations.where((c) {
      return c.partnerName.toLowerCase().contains(searchTerm) ||
          c.lastMessage.toLowerCase().contains(searchTerm) ||
          (c.propertyTitle?.toLowerCase().contains(searchTerm) ?? false);
    }).toList();

    return Scaffold(
      backgroundColor: context.backgroundColor,
      appBar: AppBar(
        title: Text(l10n.messages_title),
        backgroundColor: context.backgroundColor,
        elevation: 0,
        foregroundColor: context.textPrimary,
        actions: [
          if (unreadCount > 0)
            Container(
              margin: const EdgeInsetsDirectional.only(end: 16),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.error500,
                borderRadius: BorderRadius.circular(AppTokens.radiusFull),
              ),
              child: Text(
                unreadCount > 99 ? '99+' : '$unreadCount',
                style: const TextStyle(
                  color: AppTokens.gray50,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        color: AppTheme.primary500,
        backgroundColor: Theme.of(context).colorScheme.surface,
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: l10n.messages_search_hint,
                  prefixIcon: const Icon(Icons.search, size: 20),
                  filled: true,
                  fillColor: context.surfaceColor,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppTokens.radiusLg),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onChanged: (_) => setState(() {}),
              ),
            ),
            Expanded(
                child: _buildBody(
              isLoading: isLoading,
              error: error,
              filtered: filtered,
              l10n: l10n,
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildBody({
    required bool isLoading,
    required String? error,
    required List<ConversationModel> filtered,
    required AppLocalizations l10n,
  }) {
    if (isLoading && filtered.isEmpty) {
      return ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 5,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => const _ConversationShimmer(),
      );
    }

    if (error != null && filtered.isEmpty) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Center(
                child: AppEmptyState(
                  variant: EmptyStateVariant.messages,
                  title: l10n.error_loading,
                  description: error,
                  actionLabel: l10n.retry,
                  onAction: () =>
                      ref.read(messageProvider.notifier).loadConversations(),
                ),
              ),
            ),
          );
        },
      );
    }

    if (filtered.isEmpty) {
      return LayoutBuilder(
        builder: (context, constraints) {
          return SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Center(
                child: AppEmptyState(
                  variant: EmptyStateVariant.messages,
                  title: l10n.messages_empty_title,
                  description: l10n.messages_empty_desc,
                ),
              ),
            ),
          );
        },
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (context, index) {
        final conversation = filtered[index];
        return _ConversationTile(
          conversation: conversation,
          onTap: () {
            final query = {
              'name': Uri.encodeComponent(conversation.partnerName),
              if (conversation.propertyId != null)
                'propertyId': '${conversation.propertyId}',
              if (conversation.propertyTitle != null)
                'propertyTitle': Uri.encodeComponent(conversation.propertyTitle!),
            };
            context.push(
              '/chat/${conversation.partnerId}?${query.entries.map((e) => '${e.key}=${e.value}').join('&')}',
            );
          },
        );
      },
    );
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

class _ConversationTile extends StatelessWidget {
  final ConversationModel conversation;
  final VoidCallback onTap;

  const _ConversationTile({required this.conversation, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final roleLabel = _localizedRole(l10n, conversation.partnerRole);
    final dateLabel = _formatLastMessageDate(context, conversation.lastMessageDate);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: conversation.unreadCount > 0
            ? AppTheme.primary50
            : AppTokens.gray50,
        borderRadius: BorderRadius.circular(AppTokens.radiusLg),
        border: Border.all(
          color: conversation.unreadCount > 0
              ? AppTheme.primary200
              : AppTheme.gray200.withValues(alpha: 0.5),
        ),
      ),
      child: ListTile(
        onTap: onTap,
        leading: _Avatar(avatar: conversation.partnerAvatar, name: conversation.partnerName),
        title: Row(
          children: [
            Expanded(
              child: Text(
                conversation.partnerName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontWeight: conversation.unreadCount > 0
                      ? FontWeight.w700
                      : FontWeight.w600,
                  color: context.textPrimary,
                ),
              ),
            ),
            if (roleLabel.isNotEmpty) ...[
              const SizedBox(width: 6),
              _RoleBadge(label: roleLabel),
            ],
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              conversation.lastMessage,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: conversation.unreadCount > 0
                    ? context.textPrimary
                    : context.textSecondary,
                fontWeight: conversation.unreadCount > 0
                    ? FontWeight.w500
                    : FontWeight.normal,
              ),
            ),
            if (conversation.propertyTitle != null &&
                conversation.propertyTitle!.isNotEmpty)
              Text(
                conversation.propertyTitle!,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11,
                  color: AppTheme.primary500,
                  fontWeight: FontWeight.w600,
                ),
              ),
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (dateLabel.isNotEmpty)
              Text(
                dateLabel,
                style: TextStyle(
                  fontSize: 11,
                  color: conversation.unreadCount > 0
                      ? AppTheme.primary500
                      : context.textSecondary,
                  fontWeight: conversation.unreadCount > 0
                      ? FontWeight.w600
                      : FontWeight.normal,
                ),
              ),
            if (conversation.unreadCount > 0) ...[
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.primary500,
                  borderRadius: BorderRadius.circular(AppTokens.radiusFull),
                ),
                child: Text(
                  conversation.unreadCount > 99
                      ? '99+'
                      : '${conversation.unreadCount}',
                  style: const TextStyle(
                    color: AppTokens.gray50,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatLastMessageDate(BuildContext context, String? dateString) {
    if (dateString == null || dateString.isEmpty) return '';
    final dt = DateTime.tryParse(dateString);
    if (dt == null) return '';
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final messageDay = DateTime(dt.year, dt.month, dt.day);

    if (messageDay.isAtSameMomentAs(today)) {
      return DateFormat.Hm(Localizations.localeOf(context).toString()).format(dt);
    } else if (messageDay.isAtSameMomentAs(yesterday)) {
      return AppLocalizations.of(context).yesterday;
    }
    return DateFormat.Md(Localizations.localeOf(context).toString()).format(dt);
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

class _Avatar extends StatelessWidget {
  final String? avatar;
  final String name;

  const _Avatar({this.avatar, required this.name});

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

class _ConversationShimmer extends StatelessWidget {
  const _ConversationShimmer();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTokens.gray50,
        borderRadius: BorderRadius.circular(AppTokens.radiusLg),
        border: Border.all(color: AppTheme.gray200.withValues(alpha: 0.5)),
      ),
      child: Row(
        children: [
          const AppShimmer(width: 48, height: 48, circle: true),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AppShimmer(width: 140, height: 16, borderRadius: 2),
                const SizedBox(height: 8),
                AppShimmer(
                    width: MediaQuery.of(context).size.width * 0.5,
                    height: 12,
                    borderRadius: 2),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
