-- =====================================================
-- V6.1: Update check constraints for property reservation flow
-- =====================================================

-- Allow the saga to set property status to PENDING_PAYMENT and SOLD.
ALTER TABLE property
    DROP CONSTRAINT IF EXISTS property_status_check;

ALTER TABLE property
    ADD CONSTRAINT property_status_check
    CHECK (status IN ('PENDING', 'APPROVED', 'AVAILABLE', 'REJECTED', 'RESERVED', 'RENTED', 'PENDING_PAYMENT', 'SOLD'));

-- Allow the new PROPERTY_RESERVATION saga type.
ALTER TABLE saga_instances
    DROP CONSTRAINT IF EXISTS saga_instances_saga_type_check;

ALTER TABLE saga_instances
    ADD CONSTRAINT saga_instances_saga_type_check
    CHECK (saga_type IN ('PAYMENT_ADVERTISEMENT', 'PROPERTY_RESERVATION'));
