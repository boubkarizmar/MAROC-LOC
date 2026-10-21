-- Add user ban fields
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS ban_reason VARCHAR(500);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id BIGSERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(500),
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description, updated_at)
VALUES
    ('maintenance_mode', 'false', 'Platform maintenance mode', CURRENT_TIMESTAMP),
    ('feature_ai_chat', 'true', 'AI Chatbot feature toggle', CURRENT_TIMESTAMP),
    ('feature_voice_search', 'true', 'Voice search feature toggle', CURRENT_TIMESTAMP),
    ('feature_ads', 'true', 'Advertisement system feature toggle', CURRENT_TIMESTAMP),
    ('feature_reviews', 'true', 'Review system feature toggle', CURRENT_TIMESTAMP),
    ('feature_payments', 'true', 'Online payments feature toggle', CURRENT_TIMESTAMP),
    ('registration_open', 'true', 'Allow new user registrations', CURRENT_TIMESTAMP)
ON CONFLICT (setting_key) DO NOTHING;
