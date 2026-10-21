-- ClickHouse Analytics Schema for MAROC-LOC
-- Optimized for OLAP queries on event data

-- Raw events table (Kafka engine in production)
CREATE TABLE IF NOT EXISTS events (
    event_id UUID,
    event_type LowCardinality(String),
    event_version UInt8 DEFAULT 1,
    user_id UInt64,
    session_id String,
    device_fingerprint String,
    ip_address IPv4,
    user_agent String,
    device_type LowCardinality(String),
    os LowCardinality(String),
    browser LowCardinality(String),
    country LowCardinality(String) DEFAULT 'MA',
    city LowCardinality(String),
    payload String,
    client_timestamp DateTime64(3),
    server_timestamp DateTime64(3),
    source LowCardinality(String) DEFAULT 'web',
    processed UInt8 DEFAULT 0
) ENGINE = MergeTree()
ORDER BY (event_type, server_timestamp, user_id)
PARTITION BY toYYYYMM(server_timestamp)
TTL server_timestamp + INTERVAL 1 YEAR;

-- Events materialized view: daily aggregations
CREATE TABLE IF NOT EXISTS events_daily (
    event_date Date,
    event_type LowCardinality(String),
    user_segment LowCardinality(String) DEFAULT 'all',
    total_events UInt64,
    unique_users UInt64,
    unique_sessions UInt64,
    avg_duration_ms Float64
) ENGINE = SummingMergeTree()
ORDER BY (event_date, event_type, user_segment);

CREATE MATERIALIZED VIEW IF NOT EXISTS events_daily_mv
TO events_daily
AS SELECT
    toDate(server_timestamp) as event_date,
    event_type,
    'all' as user_segment,
    count() as total_events,
    uniqExact(user_id) as unique_users,
    uniqExact(session_id) as unique_sessions,
    avg(JSONExtractFloat(payload, 'durationMs')) as avg_duration_ms
FROM events
GROUP BY event_date, event_type;

-- Property analytics
CREATE TABLE IF NOT EXISTS property_analytics (
    property_id UInt64,
    event_date Date,
    views UInt64,
    favorites UInt64,
    contacts UInt64,
    avg_view_duration_ms Float64,
    unique_viewers UInt64
) ENGINE = SummingMergeTree()
ORDER BY (property_id, event_date);

CREATE MATERIALIZED VIEW IF NOT EXISTS property_analytics_mv
TO property_analytics
AS SELECT
    JSONExtractUInt(payload, 'propertyId') as property_id,
    toDate(server_timestamp) as event_date,
    countIf(event_type = 'property.view') as views,
    countIf(event_type = 'property.favorite') as favorites,
    countIf(event_type = 'property.contact') as contacts,
    avgIf(JSONExtractFloat(payload, 'durationMs'), event_type = 'property.view') as avg_view_duration_ms,
    uniqExactIf(user_id, event_type = 'property.view') as unique_viewers
FROM events
WHERE JSONHas(payload, 'propertyId')
GROUP BY property_id, event_date;

-- Revenue analytics
CREATE TABLE IF NOT EXISTS revenue_daily (
    event_date Date,
    tier LowCardinality(String),
    new_subscriptions UInt64,
    churned_subscriptions UInt64,
    total_revenue Float64,
    mrr_contribution Float64
) ENGINE = SummingMergeTree()
ORDER BY (event_date, tier);

-- User engagement cohorts
CREATE TABLE IF NOT EXISTS user_cohorts (
    signup_month Date,
    activity_month Date,
    users_remaining UInt64,
    tier LowCardinality(String)
) ENGINE = MergeTree()
ORDER BY (signup_month, activity_month, tier);

-- Search analytics
CREATE TABLE IF NOT EXISTS search_analytics (
    event_date Date,
    query String,
    city LowCardinality(String),
    property_type LowCardinality(String),
    result_count UInt64,
    click_count UInt64,
    avg_result_position Float64
) ENGINE = MergeTree()
ORDER BY (event_date, city, property_type)
PARTITION BY toYYYYMM(event_date);

-- A/B test results
CREATE TABLE IF NOT EXISTS ab_test_results (
    experiment_key LowCardinality(String),
    variant LowCardinality(String),
    event_date Date,
    impressions UInt64,
    conversions UInt64,
    revenue Float64
) ENGINE = SummingMergeTree()
ORDER BY (experiment_key, variant, event_date);
