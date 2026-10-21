-- =====================================================
-- MIGRATION V003: Add advertisement payment tracking and Stripe fields
-- Description: add payment tracking table and Stripe checkout/invoice fields for advertisement flows
-- =====================================================

-- Create advertisement payments table
CREATE TABLE IF NOT EXISTS advertisement_payments (
    id BIGSERIAL PRIMARY KEY,
    advertisement_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    amount BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) NOT NULL,
    stripe_checkout_session_id VARCHAR(128),
    stripe_payment_intent_id VARCHAR(128),
    stripe_invoice_id VARCHAR(128),
    receipt_url VARCHAR(512),
    failure_message VARCHAR(512),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Add Stripe and payment tracking columns to existing advertisement table
ALTER TABLE advertisements
    ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(128),
    ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(128),
    ADD COLUMN IF NOT EXISTS stripe_invoice_id VARCHAR(128),
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING';

-- Ensure existing rows have a valid payment status
UPDATE advertisements
SET payment_status = 'PENDING'
WHERE payment_status IS NULL;

-- Create indexes for Stripe lookup and payment history queries
CREATE INDEX IF NOT EXISTS idx_advertisement_payments_user_id ON advertisement_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_advertisement_payments_advertisement_id ON advertisement_payments(advertisement_id);
CREATE INDEX IF NOT EXISTS idx_advertisement_payments_checkout_session ON advertisement_payments(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_advertisement_payments_payment_intent ON advertisement_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_stripe_checkout_session ON advertisements(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_advertisements_stripe_payment_intent ON advertisements(stripe_payment_intent_id);
