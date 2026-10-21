-- =====================================================
-- V6: Property reservation / purchase transaction flow
-- =====================================================

-- Extend property status domain in application only (enum values added in Java).

-- Property reservations / purchases
CREATE TABLE IF NOT EXISTS property_reservation (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES property(id) ON DELETE CASCADE,
    buyer_user_id BIGINT NOT NULL REFERENCES users(id),
    seller_user_id BIGINT NOT NULL REFERENCES users(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('RESERVATION', 'PURCHASE')),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MAD',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'EXPIRED', 'COMPLETED')),
    payment_transaction_id BIGINT,
    saga_correlation_id VARCHAR(255),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prop_res_buyer ON property_reservation(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_prop_res_property ON property_reservation(property_id);
CREATE INDEX IF NOT EXISTS idx_prop_res_status ON property_reservation(status);
CREATE INDEX IF NOT EXISTS idx_prop_res_saga ON property_reservation(saga_correlation_id);

-- Extend payment_transactions to link property reservations.
ALTER TABLE payment_transactions
    ADD COLUMN IF NOT EXISTS property_id BIGINT,
    ADD COLUMN IF NOT EXISTS property_reservation_id BIGINT,
    ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(30),
    ADD COLUMN IF NOT EXISTS provider VARCHAR(20),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_payment_property ON payment_transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_payment_property_reservation ON payment_transactions(property_reservation_id);
