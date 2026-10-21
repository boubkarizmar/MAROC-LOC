-- ============================================================
-- V3: AI SaaS Transformation Schema
-- Includes: Event Tracking, Vector Embeddings, Fraud Detection,
--           Subscription Tiers, Feature Usage, Price History
-- ============================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create user_subscription base table if it doesn't exist (required before ALTER below)
CREATE TABLE IF NOT EXISTS user_subscription (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    amount DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_subscription_user ON user_subscription(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscription_status ON user_subscription(status);

-- ============================================================
-- 1. EVENT TRACKING SYSTEM
-- ============================================================
CREATE TABLE event_log (
    id BIGSERIAL PRIMARY KEY,
    event_id UUID DEFAULT gen_random_uuid(),
    event_type VARCHAR(64) NOT NULL,
    event_version INT DEFAULT 1,
    user_id BIGINT,
    session_id VARCHAR(128),
    device_fingerprint VARCHAR(64),
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(20),
    os VARCHAR(30),
    browser VARCHAR(30),
    country VARCHAR(2) DEFAULT 'MA',
    city VARCHAR(100),
    payload JSONB NOT NULL DEFAULT '{}',
    client_timestamp TIMESTAMP WITH TIME ZONE,
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    source VARCHAR(20) DEFAULT 'web',
    processed BOOLEAN DEFAULT false,
    CONSTRAINT chk_event_type CHECK (event_type ~ '^[a-z]+\.[a-z_]+$')
);

CREATE INDEX idx_event_type_time ON event_log(event_type, server_timestamp DESC);
CREATE INDEX idx_event_user_time ON event_log(user_id, server_timestamp DESC);
CREATE INDEX idx_event_session ON event_log(session_id, server_timestamp DESC);
CREATE INDEX idx_event_payload ON event_log USING GIN(payload jsonb_path_ops);
CREATE INDEX idx_event_unprocessed ON event_log(processed) WHERE processed = false;
CREATE INDEX idx_event_server_ts ON event_log(server_timestamp DESC);

-- Aggregated metrics table (pre-computed for dashboards)
CREATE TABLE event_metrics_daily (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    user_segment VARCHAR(30) DEFAULT 'all',
    count BIGINT DEFAULT 0,
    unique_users BIGINT DEFAULT 0,
    avg_payload_size_bytes INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(metric_date, event_type, user_segment)
);

CREATE INDEX idx_metrics_daily_date ON event_metrics_daily(metric_date DESC);

-- ============================================================
-- 2. VECTOR EMBEDDINGS (Property Semantic Search)
-- ============================================================
CREATE TABLE property_embedding (
    property_id BIGINT PRIMARY KEY REFERENCES property(id) ON DELETE CASCADE,
    embedding VECTOR(384) NOT NULL,
    text_hash VARCHAR(64),
    model_version VARCHAR(20) DEFAULT 'multilingual-minilm-l12-v2',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- IVF flat index for approximate search (good for 100k+ vectors)
CREATE INDEX idx_property_embedding_ivf
ON property_embedding
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ============================================================
-- 3. FRAUD DETECTION
-- ============================================================
CREATE TABLE fraud_score (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES property(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score DECIMAL(4,3) NOT NULL,          -- 0.000 to 1.000
    decision VARCHAR(20) NOT NULL,        -- AUTO_APPROVE, MANUAL_REVIEW, AUTO_FLAG
    confidence DECIMAL(4,3),
    features JSONB DEFAULT '{}',
    rules_triggered JSONB DEFAULT '[]',
    explanation TEXT,
    model_version VARCHAR(20),
    reviewed_by BIGINT REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    final_decision VARCHAR(20),           -- after manual review
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id)
);

CREATE INDEX idx_fraud_score_decision ON fraud_score(decision, created_at DESC);
CREATE INDEX idx_fraud_score_property ON fraud_score(property_id);
CREATE INDEX idx_fraud_score_user ON fraud_score(user_id);
CREATE INDEX idx_fraud_unreviewed ON fraud_score(decision, reviewed_at) WHERE reviewed_at IS NULL;

-- Known scam signatures (auto-updated from model + manual rules)
CREATE TABLE fraud_signature (
    id SERIAL PRIMARY KEY,
    signature_type VARCHAR(30) NOT NULL,  -- image_hash, phone, email, device_fp, ip_range
    signature_value VARCHAR(255) NOT NULL,
    risk_weight DECIMAL(3,2) DEFAULT 1.00,
    source VARCHAR(20) DEFAULT 'model',   -- model, manual, kaggle
    evidence_count INT DEFAULT 1,
    first_seen TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT true,
    UNIQUE(signature_type, signature_value)
);

CREATE INDEX idx_fraud_signature_lookup ON fraud_signature(signature_type, signature_value, active);

-- ============================================================
-- 4. SUBSCRIPTION & REVENUE (Extensions to V2)
-- ============================================================
ALTER TABLE user_subscription ADD COLUMN IF NOT EXISTS
    tier VARCHAR(20) NOT NULL DEFAULT 'FREE',
    billing_cycle VARCHAR(10) DEFAULT 'MONTHLY',
    auto_renew BOOLEAN DEFAULT true,
    payment_method_id VARCHAR(255),
    trial_ends_at TIMESTAMP,
    grace_period_ends_at TIMESTAMP,
    cancellation_reason TEXT,
    mrr_contribution DECIMAL(10,2) DEFAULT 0.00,
    upgraded_from VARCHAR(20);

CREATE INDEX idx_subscription_tier ON user_subscription(tier, status);
CREATE INDEX idx_subscription_grace ON user_subscription(grace_period_ends_at) WHERE grace_period_ends_at IS NOT NULL;

-- Feature usage tracking (metered billing)
CREATE TABLE feature_usage (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    feature_key VARCHAR(50) NOT NULL,
    usage_count INT DEFAULT 0,
    usage_limit INT,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, feature_key, period_start)
);

CREATE INDEX idx_feature_usage_user ON feature_usage(user_id, period_start DESC);
CREATE INDEX idx_feature_usage_key ON feature_usage(feature_key, period_start DESC);

-- Price history (for analytics + fraud: unusual price changes)
CREATE TABLE property_price_history (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES property(id) ON DELETE CASCADE,
    old_price DECIMAL(12,2) NOT NULL,
    new_price DECIMAL(12,2) NOT NULL,
    change_reason VARCHAR(50),            -- user_edit, auto_adjust, boost_expired
    changed_by BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_price_history_property ON property_price_history(property_id, created_at DESC);

-- ============================================================
-- 5. KAGGLE / EXTERNAL DATA RAW STORAGE
-- ============================================================
CREATE TABLE kaggle_property_raw (
    id BIGSERIAL PRIMARY KEY,
    external_id VARCHAR(255),
    source VARCHAR(50) DEFAULT 'kaggle',
    city VARCHAR(100),
    neighborhood VARCHAR(100),
    property_type VARCHAR(50),
    surface_m2 DECIMAL(10,2),
    rooms INT,
    bedrooms INT,
    bathrooms INT,
    price_mad DECIMAL(12,2),
    price_per_m2 DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE WHEN surface_m2 > 0 THEN price_mad / surface_m2 ELSE NULL END
    ) STORED,
    features JSONB,
    coordinates POINT,
    listing_date DATE,
    scraped_at TIMESTAMP DEFAULT NOW(),
    is_training_sample BOOLEAN DEFAULT false,
    embedding VECTOR(384),
    raw_data JSONB
);

CREATE INDEX idx_kaggle_city_type ON kaggle_property_raw(city, property_type);
CREATE INDEX idx_kaggle_price ON kaggle_property_raw(price_mad);
CREATE INDEX idx_kaggle_coords ON kaggle_property_raw USING GIST(coordinates);
CREATE INDEX idx_kaggle_features ON kaggle_property_raw USING GIN(features);

-- ============================================================
-- 6. RECOMMENDATION CACHE (pre-computed user recommendations)
-- ============================================================
CREATE TABLE recommendation_cache (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id BIGINT NOT NULL REFERENCES property(id) ON DELETE CASCADE,
    score DECIMAL(5,4) NOT NULL,
    model_version VARCHAR(20),
    reason VARCHAR(255),
    context JSONB,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    clicked BOOLEAN DEFAULT false,
    dismissed BOOLEAN DEFAULT false,
    UNIQUE(user_id, property_id)
);

CREATE INDEX idx_rec_cache_user ON recommendation_cache(user_id, score DESC) WHERE expires_at > NOW();
CREATE INDEX idx_rec_cache_expires ON recommendation_cache(expires_at);

-- ============================================================
-- 7. AI CHAT SESSION LOG (for analytics + model improvement)
-- ============================================================
CREATE TABLE ai_chat_session (
    id BIGSERIAL PRIMARY KEY,
    session_id VARCHAR(128) NOT NULL,
    user_id BIGINT REFERENCES users(id),
    message TEXT NOT NULL,
    response TEXT,
    intent VARCHAR(50),
    entities JSONB,
    confidence DECIMAL(4,3),
    language_detected VARCHAR(10),
    properties_suggested JSONB,
    response_time_ms INT,
    user_feedback INT,                    -- -1 (bad), 0 (neutral), 1 (good)
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_session_id ON ai_chat_session(session_id, created_at DESC);
CREATE INDEX idx_chat_user ON ai_chat_session(user_id, created_at DESC);
CREATE INDEX idx_chat_intent ON ai_chat_session(intent, created_at DESC);

-- ============================================================
-- 8. WEBSOCKET PRESENCE TRACKING
-- ============================================================
CREATE TABLE websocket_presence (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(128) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'online',  -- online, away, offline
    last_heartbeat TIMESTAMP DEFAULT NOW(),
    connected_at TIMESTAMP DEFAULT NOW(),
    disconnected_at TIMESTAMP,
    device_type VARCHAR(20),
    UNIQUE(user_id, session_id)
);

CREATE INDEX idx_presence_user ON websocket_presence(user_id, status);
CREATE INDEX idx_presence_online ON websocket_presence(status, last_heartbeat DESC);

-- ============================================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_property_embedding_updated
    BEFORE UPDATE ON property_embedding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_feature_usage_updated
    BEFORE UPDATE ON feature_usage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fraud score trigger: auto-update property status on AUTO_FLAG
CREATE OR REPLACE FUNCTION trigger_flag_property_on_fraud()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.decision = 'AUTO_FLAG' THEN
        UPDATE property SET status = 'SUSPENDED', updated_at = NOW()
        WHERE id = NEW.property_id AND status != 'SUSPENDED';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_fraud_auto_flag
    AFTER INSERT OR UPDATE ON fraud_score
    FOR EACH ROW EXECUTE FUNCTION trigger_flag_property_on_fraud();

-- Price history trigger: log price changes
CREATE OR REPLACE FUNCTION trigger_log_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO property_price_history (property_id, old_price, new_price, change_reason, changed_by)
        VALUES (NEW.id, OLD.price, NEW.price, 'user_edit', NEW.updated_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_property_price_history
    BEFORE UPDATE ON property
    FOR EACH ROW EXECUTE FUNCTION trigger_log_price_change();
