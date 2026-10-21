-- SQL PROOF: Raw Database Queries
-- Timestamp: $(date -Iseconds)

SELECT COUNT(*) FROM property;
SELECT COUNT(*) FROM property WHERE status IN ('APPROVED','AVAILABLE');
SELECT COUNT(*) FROM "user";
SELECT COUNT(*) FROM property_visit;
SELECT COUNT(*) FROM message;
SELECT COUNT(*) FROM favorite;
SELECT id, title, city, price, type, category, bedrooms, surface, status FROM property WHERE LOWER(city) = LOWER('Tanger') ORDER BY price;
SELECT id, title, city, price, type, category, bedrooms, surface, status FROM property WHERE LOWER(city) = LOWER('Casablanca') AND price <= 500000 ORDER BY price;
SELECT id, title, city, price, type, category, bedrooms, surface, status FROM property WHERE LOWER(city) = LOWER('Rabat') AND LOWER(category) = LOWER('APARTMENT') ORDER BY price;
SELECT id, title, city, price, type, category, bedrooms, surface, status FROM property WHERE LOWER(city) = LOWER('Marrakech') AND LOWER(category) = LOWER('HOUSE') ORDER BY price;
SELECT * FROM property_visit ORDER BY id DESC LIMIT 5;
SELECT * FROM message ORDER BY id DESC LIMIT 5;
SELECT * FROM favorite ORDER BY id DESC LIMIT 5;
SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;
