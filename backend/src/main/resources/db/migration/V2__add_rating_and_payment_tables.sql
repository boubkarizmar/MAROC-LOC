-- =====================================================
-- V2: Add Property Rating, Platform Rating, and Payment Tables
-- =====================================================

-- Property Reviews & Ratings (extends existing review table if needed)
CREATE TABLE IF NOT EXISTS property_review (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES property(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating_score INT NOT NULL CHECK (rating_score BETWEEN 1 AND 5),
    review_text TEXT,
    review_date TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    is_moderated BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    moderation_notes TEXT,
    UNIQUE(property_id, user_id)
);

CREATE INDEX idx_property_review_property ON property_review(property_id);
CREATE INDEX idx_property_review_user ON property_review(user_id);
CREATE INDEX idx_property_review_rating ON property_review(rating_score);

-- Platform Ratings (site/service feedback)
CREATE TABLE IF NOT EXISTS platform_rating (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    service_quality_rating INT CHECK (service_quality_rating BETWEEN 1 AND 5),
    usability_rating INT CHECK (usability_rating BETWEEN 1 AND 5),
    support_rating INT CHECK (support_rating BETWEEN 1 AND 5),
    global_platform_rating INT CHECK (global_platform_rating BETWEEN 1 AND 5),
    feedback_message TEXT,
    bug_report TEXT,
    suggestion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_reviewed_by_admin BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_platform_rating_user ON platform_rating(user_id);
CREATE INDEX idx_platform_rating_global ON platform_rating(global_platform_rating);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plan (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name JSONB NOT NULL,
    description JSONB,
    price DECIMAL(10,2) NOT NULL,
    billing_period VARCHAR(10) DEFAULT 'MONTH',
    features JSONB NOT NULL DEFAULT '{}',
    max_listings INT DEFAULT 0,
    max_boosts INT DEFAULT 0,
    priority_support BOOLEAN DEFAULT FALSE,
    analytics_access BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transaction (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    property_id BIGINT REFERENCES property(id),
    subscription_plan_id INT REFERENCES subscription_plan(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('SUBSCRIPTION', 'BOOST', 'FEATURED', 'AD_PLAN')),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MAD',
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('CMI', 'STRIPE', 'BANK_TRANSFER', 'CASH')),
    provider_transaction_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED')),
    hmac_hash VARCHAR(255),
    callback_payload JSONB,
    failure_reason TEXT,
    refunded_at TIMESTAMPTZ,
    refund_amount DECIMAL(12,2),
    invoice_number VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_user ON payment_transaction(user_id);
CREATE INDEX idx_payment_status ON payment_transaction(status);
CREATE INDEX idx_payment_provider ON payment_transaction(provider);

-- Property Boosts
CREATE TABLE IF NOT EXISTS property_boost (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES property(id) ON DELETE CASCADE,
    transaction_id BIGINT NOT NULL REFERENCES payment_transaction(id),
    boost_level INT NOT NULL CHECK (boost_level BETWEEN 1 AND 3),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_property_boost_property ON property_boost(property_id);
CREATE INDEX idx_property_boost_active ON property_boost(active, end_date);

-- Invoices
CREATE TABLE IF NOT EXISTS invoice (
    id BIGSERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id),
    transaction_id BIGINT NOT NULL REFERENCES payment_transaction(id),
    total_amount DECIMAL(12,2) NOT NULL,
    vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    vat_rate DECIMAL(5,2) DEFAULT 20.00,
    status VARCHAR(20) DEFAULT 'ISSUED',
    due_date DATE,
    paid_at TIMESTAMPTZ,
    pdf_url VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoice_user ON invoice(user_id);
CREATE INDEX idx_invoice_number ON invoice(invoice_number);

-- Insert default subscription plans
INSERT INTO subscription_plan (code, name, price, billing_period, features, max_listings, max_boosts, priority_support, analytics_access)
VALUES
('BASIC', '{"fr": "Basique", "en": "Basic", "ar": "أساسي"}'::jsonb, 0.00, 'MONTH', '{"featured_listing": false, "boost": false}'::jsonb, 3, 0, false, false),
('PREMIUM', '{"fr": "Premium", "en": "Premium", "ar": "مميز"}'::jsonb, 199.00, 'MONTH', '{"featured_listing": true, "boost": true, "priority_support": true}'::jsonb, 20, 5, true, true),
('FEATURED', '{"fr": "En vedette", "en": "Featured", "ar": "مميز جدا"}'::jsonb, 499.00, 'MONTH', '{"featured_listing": true, "boost": true, "analytics": true, "priority_support": true}'::jsonb, 100, 20, true, true)
ON CONFLICT (code) DO NOTHING;
