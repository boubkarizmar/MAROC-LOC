-- Database Optimization Indexes for MAROC-LOC
-- STEP 2: Database & Backend Optimization

-- Property indexes for performance
-- Already created via @Index annotations in Entity, but documented here for clarity

-- Index for location-based queries (PostGIS)
-- Used by findNearbyPropertiesPostGIS with geospatial filtering
CREATE INDEX IF NOT EXISTS idx_property_location_gist
ON property USING GIST(location);

-- Index for full-text search on title and description
-- Used by searchByFullText method
CREATE INDEX IF NOT EXISTS idx_property_title_gin
ON property USING GIN(to_tsvector('french', COALESCE(title, '') || ' ' || COALESCE(description, '')));

-- Index for city-price range queries
-- Used by market insights and filtering operations
CREATE INDEX IF NOT EXISTS idx_property_city_price_brin
ON property USING BRIN(city, price)
WITH (pages_per_range = 128);

-- Index for property status and type combination
-- Used for filtering active/available properties by type
CREATE INDEX IF NOT EXISTS idx_property_status_type
ON property(status, type);

-- Index for owner-based queries with active properties
-- Used when showing user's properties
CREATE INDEX IF NOT EXISTS idx_property_owner_status_created
ON property(owner_id, status, created_at DESC);

-- Index for recent properties (created_at)
-- Used for "New listings" feature
CREATE INDEX IF NOT EXISTS idx_property_created_at_desc
ON property(created_at DESC);

-- Index for price range with location
-- Used for dashboard and market analysis
CREATE INDEX IF NOT EXISTS idx_property_price_city_type
ON property(price, city, type);

-- User indexes for authentication and lookups
-- Index for login by email
CREATE INDEX IF NOT EXISTS idx_users_email_unique
ON users(email);

-- Index for user role-based queries
-- Used for RBAC filtering
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

-- Index for verified users
-- Used for user management
CREATE INDEX IF NOT EXISTS idx_users_verified_created
ON users(is_verified, created_at DESC);

-- Review indexes for ratings and statistics
-- Used for property ratings calculation
CREATE INDEX IF NOT EXISTS idx_reviews_property_rating
ON reviews(property_id, rating DESC);

-- Message indexes for chat functionality
-- Index for conversation queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_recipient_timestamp
ON messages(sender_id, receiver_id, timestamp DESC);

-- Index for recent messages
-- Used for message list pagination
CREATE INDEX IF NOT EXISTS idx_messages_timestamp
ON messages(timestamp DESC);

-- Favorite indexes for user preferences
-- Used for favorite properties per user
CREATE INDEX IF NOT EXISTS idx_favorites_user_property
ON favorites(user_id, property_id);

-- ViewedProperty indexes for user browsing history
-- Used for recommendation engine
CREATE INDEX IF NOT EXISTS idx_viewed_properties_user_viewed_at
ON viewed_properties(user_id, viewed_at DESC);

-- Query performance analysis queries
-- Run after indexes are created to verify they're being used

-- Check index sizes and usage
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan DESC;

-- Check missing indexes for slow queries
-- SELECT * FROM pg_stat_user_tables
-- WHERE seq_scan > idx_scan * 5
-- ORDER BY seq_scan - idx_scan DESC;

-- Analyze table statistics
ANALYZE property;
ANALYZE users;
ANALYZE reviews;
ANALYZE messages;
ANALYZE favorites;
ANALYZE viewed_properties;
