-- =====================================================
-- V7: Professional notification system
-- =====================================================

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_pref_user ON notification_preferences(user_id);

-- Persistent notifications
CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    icon VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    sender_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    role VARCHAR(30),
    entity_id BIGINT,
    entity_type VARCHAR(50),
    action_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'UNREAD' CHECK (status IN ('UNREAD', 'READ', 'ARCHIVED', 'DELETED')),
    metadata JSONB,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_notifications_role_created ON notifications(role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_status_created ON notifications(status, created_at DESC);

-- FCM push tokens (optional, guarded by backend configuration)
CREATE TABLE IF NOT EXISTS fcm_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    device_type VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, token)
);

CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user ON fcm_tokens(user_id);
