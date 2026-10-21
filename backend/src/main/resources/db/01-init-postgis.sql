-- Enable PostGIS extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;

-- NOTE: Do NOT attempt to create tables by referencing the "property" table here.
-- The database must have the PostGIS extension available first; table creation
-- should be handled by Hibernate or explicit SQL migrations (Flyway).