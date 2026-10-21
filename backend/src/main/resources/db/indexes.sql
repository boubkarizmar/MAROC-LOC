-- Advanced Database Indexes for MAROC-LOC Platform
-- This file contains optimized indexes for geospatial queries, full-text search, and complex filtering

-- Geospatial indexes for location-based queries (PostGIS)
CREATE INDEX IF NOT EXISTS idx_property_location_gist ON property USING GIST(location);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_property_city_price ON property(city, price) WHERE status = 'AVAILABLE';
CREATE INDEX IF NOT EXISTS idx_property_type_city ON property(type, city) WHERE status = 'AVAILABLE';
CREATE INDEX IF NOT EXISTS idx_property_price_range ON property(price, city, type) WHERE status = 'AVAILABLE';

-- Full-text search indexes for property descriptions and titles
CREATE INDEX IF NOT EXISTS idx_property_title_search ON property USING GIN(to_tsvector('french', COALESCE(title, '')));
CREATE INDEX IF NOT EXISTS idx_property_description_search ON property USING GIN(to_tsvector('french', COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_property_combined_search ON property USING GIN(
    to_tsvector(
        'french',
        COALESCE(title, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(city, '') || ' ' || COALESCE(address, '')
    )
);

-- Partial indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_property_recent_active ON property(created_at DESC)
    WHERE status = 'AVAILABLE' AND created_at > NOW() - INTERVAL '30 days';

CREATE INDEX IF NOT EXISTS idx_property_price_asc_active ON property(price ASC)
    WHERE status = 'AVAILABLE' AND price > 0;

CREATE INDEX IF NOT EXISTS idx_property_price_desc_active ON property(price DESC)
    WHERE status = 'AVAILABLE' AND price > 0;

-- JSONB indexes for flexible property attributes
CREATE INDEX IF NOT EXISTS idx_property_images_length ON property((jsonb_array_length(images)))
    WHERE jsonb_array_length(images) > 0;

-- BRIN indexes for time-series data (more efficient for large datasets)
CREATE INDEX IF NOT EXISTS idx_property_created_at_brin ON property USING BRIN(created_at)
    WITH (pages_per_range = 128);
CREATE INDEX IF NOT EXISTS idx_property_updated_at_brin ON property USING BRIN(updated_at)
    WITH (pages_per_range = 128);

-- Hash indexes for exact equality lookups (faster than B-tree for some cases)
CREATE INDEX IF NOT EXISTS idx_property_status_hash ON property USING HASH(status);
CREATE INDEX IF NOT EXISTS idx_property_type_hash ON property USING HASH(type);

-- Expression indexes for calculated fields
CREATE INDEX IF NOT EXISTS idx_property_discounted_price ON property(
    CASE
        WHEN discount_percentage > 0 THEN price * (1 - discount_percentage / 100.0)
        ELSE price
    END
) WHERE discount_percentage > 0;

-- Covering indexes for common SELECT queries
CREATE INDEX IF NOT EXISTS idx_property_listing_covering ON property(id, title, price, city, status, type, latitude, longitude, created_at)
    WHERE status = 'AVAILABLE';

-- Foreign key indexes (should already exist but ensuring they're present)
CREATE INDEX IF NOT EXISTS idx_property_owner_id ON property(owner_id);

-- Indexes for reviews, favorites, messages (performance optimization)
CREATE INDEX IF NOT EXISTS idx_reviews_property_status ON reviews(property_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_owner ON reviews(property_id, status) INCLUDE (rating);
CREATE INDEX IF NOT EXISTS idx_favorites_user_property ON favorites(user_id, property_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property ON favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_advertisements_status_dates ON advertisements(status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_property_owner_status ON property(owner_id, status);
CREATE INDEX IF NOT EXISTS idx_property_status_city_transaction ON property(status, city, transaction_type) WHERE status IN ('APPROVED', 'AVAILABLE');
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_review_parent ON comments(review_id, parent_id, status);

-- Statistics for query planner optimization
ANALYZE property;
ANALYZE reviews;
ANALYZE favorites;
ANALYZE messages;
ANALYZE users;
ANALYZE advertisements;