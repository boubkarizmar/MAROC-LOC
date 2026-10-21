ALTER TABLE advertisement_payments
    ADD COLUMN IF NOT EXISTS saga_correlation_id VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_advertisement_payments_saga_correlation
    ON advertisement_payments(saga_correlation_id);
