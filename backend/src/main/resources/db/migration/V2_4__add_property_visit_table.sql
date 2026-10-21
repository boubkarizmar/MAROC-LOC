-- Property Visit Scheduling Table
CREATE TABLE IF NOT EXISTS property_visit (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES property(id) ON DELETE CASCADE,
    visitor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    visitor_phone VARCHAR(20),
    visitor_email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    CONSTRAINT chk_status CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'))
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_visit_visitor ON property_visit(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visit_owner ON property_visit(owner_id);
CREATE INDEX IF NOT EXISTS idx_visit_property ON property_visit(property_id);
CREATE INDEX IF NOT EXISTS idx_visit_date ON property_visit(visit_date);
CREATE INDEX IF NOT EXISTS idx_visit_status ON property_visit(status);
CREATE INDEX IF NOT EXISTS idx_visit_visitor_date ON property_visit(visitor_id, visit_date);
