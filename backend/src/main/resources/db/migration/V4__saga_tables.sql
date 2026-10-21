-- =====================================================
-- Flyway V4 : Tables de persistance du Pattern Saga
-- =====================================================

CREATE TABLE IF NOT EXISTS saga_instances (
    id BIGSERIAL PRIMARY KEY,
    saga_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    correlation_id VARCHAR(255),
    provider VARCHAR(32),
    payload JSONB,
    result VARCHAR(32),
    result_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saga_instances_status ON saga_instances(status);
CREATE INDEX IF NOT EXISTS idx_saga_instances_correlation ON saga_instances(correlation_id);
CREATE INDEX IF NOT EXISTS idx_saga_instances_type ON saga_instances(saga_type);

CREATE TABLE IF NOT EXISTS saga_steps (
    id BIGSERIAL PRIMARY KEY,
    saga_instance_id BIGINT NOT NULL REFERENCES saga_instances(id) ON DELETE CASCADE,
    step_name VARCHAR(64) NOT NULL,
    step_order INT NOT NULL,
    status VARCHAR(32) NOT NULL,
    input_json JSONB,
    output_json JSONB,
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_saga_steps_instance ON saga_steps(saga_instance_id);
CREATE INDEX IF NOT EXISTS idx_saga_steps_status ON saga_steps(status);
