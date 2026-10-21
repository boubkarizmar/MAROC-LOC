-- Enable PostGIS extensions for geospatial support
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;

-- Create custom types for better data organization
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status') THEN
        CREATE TYPE property_status AS ENUM (
            'PENDING',
            'APPROVED',
            'AVAILABLE',
            'REJECTED',
            'RESERVED',
            'RENTED'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
        CREATE TYPE property_type AS ENUM (
            'RENT',
            'BUY',
            'MORTGAGE'
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'ADMIN',
            'LOCATAIRE',
            'PROPRIETAIRE'
        );
    END IF;
END$$;

-- Create baseline indexes for better performance
CREATE INDEX IF NOT EXISTS idx_property_city ON property(city);
CREATE INDEX IF NOT EXISTS idx_property_price ON property(price);
CREATE INDEX IF NOT EXISTS idx_property_status ON property(status);
CREATE INDEX IF NOT EXISTS idx_property_type ON property(type);
CREATE INDEX IF NOT EXISTS idx_property_owner_id ON property(owner_id);
CREATE INDEX IF NOT EXISTS idx_property_created_at ON property(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_updated_at ON property(updated_at DESC);

-- Create partial indexes for active properties
CREATE INDEX IF NOT EXISTS idx_property_active_city ON property(city) WHERE status = 'AVAILABLE';
CREATE INDEX IF NOT EXISTS idx_property_active_price ON property(price) WHERE status = 'AVAILABLE';

-- Create GIN index for JSONB images array
CREATE INDEX IF NOT EXISTS idx_property_images ON property USING GIN(images);

-- Create PostGIS location index
CREATE INDEX IF NOT EXISTS idx_property_location ON property USING GIST(location);

-- Create user indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Analyze table statistics
ANALYZE property;
ANALYZE users;
