-- =====================================================
-- MIGRATION V2: Ajout des nouveaux champs pour MAROC-LOC
-- Date: 2026-04-25
-- Description: Ajout des champs manquants pour répondre au cahier des charges marocain
-- =====================================================

-- =====================================================
-- 1. AJOUT DES NOUVELLES COLONNES
-- =====================================================

-- Période de facturation
ALTER TABLE property ADD COLUMN IF NOT EXISTS billing_period VARCHAR(10) DEFAULT 'MONTH';

-- Caractéristiques physiques supplémentaires
ALTER TABLE property ADD COLUMN IF NOT EXISTS floor_number INTEGER;
ALTER TABLE property ADD COLUMN IF NOT EXISTS total_floors INTEGER;
ALTER TABLE property ADD COLUMN IF NOT EXISTS building_age INTEGER;

-- Équipements supplémentaires
ALTER TABLE property ADD COLUMN IF NOT EXISTS has_balcony BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS pet_allowed BOOLEAN DEFAULT FALSE;

-- Environnement
ALTER TABLE property ADD COLUMN IF NOT EXISTS city_center BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS near_school BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS near_university BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS near_mosque BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS near_hospital BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS near_market BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS near_tram BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS near_bus BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS near_train_station BOOLEAN DEFAULT FALSE;

-- Quartier
ALTER TABLE property ADD COLUMN IF NOT EXISTS popular_area BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS modern_area BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS quiet_area BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS family_area BOOLEAN DEFAULT FALSE;

-- Orientation et vues
ALTER TABLE property ADD COLUMN IF NOT EXISTS sun_direction VARCHAR(10);
ALTER TABLE property ADD COLUMN IF NOT EXISTS garden_view BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS street_view BOOLEAN DEFAULT FALSE;
ALTER TABLE property ADD COLUMN IF NOT EXISTS sea_view BOOLEAN DEFAULT FALSE;

-- Média
ALTER TABLE property ADD COLUMN IF NOT EXISTS video_tour VARCHAR(500);

-- Paiement
ALTER TABLE property ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);

-- =====================================================
-- 2. MISE À JOUR DES VALEURS PAR DÉFAUT
-- =====================================================

UPDATE property
SET
    billing_period = COALESCE(billing_period, 'MONTH'),
    has_balcony = COALESCE(has_balcony, false),
    pet_allowed = COALESCE(pet_allowed, false),
    city_center = COALESCE(city_center, false),
    near_school = COALESCE(near_school, false),
    near_university = COALESCE(near_university, false),
    near_mosque = COALESCE(near_mosque, false),
    near_hospital = COALESCE(near_hospital, false),
    near_market = COALESCE(near_market, false),
    near_tram = COALESCE(near_tram, false),
    near_bus = COALESCE(near_bus, false),
    near_train_station = COALESCE(near_train_station, false),
    popular_area = COALESCE(popular_area, false),
    modern_area = COALESCE(modern_area, false),
    quiet_area = COALESCE(quiet_area, false),
    family_area = COALESCE(family_area, false),
    garden_view = COALESCE(garden_view, false),
    street_view = COALESCE(street_view, false),
    sea_view = COALESCE(sea_view, false)
WHERE
    billing_period IS NULL;

-- =====================================================
-- 3. CRÉATION DES INDEX
-- =====================================================

-- Index sur la période de facturation
CREATE INDEX IF NOT EXISTS idx_property_billing_period ON property(billing_period);

-- Index sur l'étage
CREATE INDEX IF NOT EXISTS idx_property_floor_number ON property(floor_number);

-- Index sur l'âge du bâtiment
CREATE INDEX IF NOT EXISTS idx_property_building_age ON property(building_age);

-- Index sur la vue mer
CREATE INDEX IF NOT EXISTS idx_property_sea_view ON property(sea_view) WHERE sea_view = true;

-- Index sur le centre-ville
CREATE INDEX IF NOT EXISTS idx_property_city_center ON property(city_center) WHERE city_center = true;

-- Index sur les équipements
CREATE INDEX IF NOT EXISTS idx_property_has_balcony ON property(has_balcony) WHERE has_balcony = true;
CREATE INDEX IF NOT EXISTS idx_property_pet_allowed ON property(pet_allowed) WHERE pet_allowed = true;

-- Index composites pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_property_city_price_center ON property(city, price, city_center);
CREATE INDEX IF NOT EXISTS idx_property_area_views ON property(surface, sea_view, garden_view);
CREATE INDEX IF NOT EXISTS idx_property_environment ON property(city, near_school, near_mosque, near_hospital);

-- Index sur le quartier
CREATE INDEX IF NOT EXISTS idx_property_neighborhood ON property(popular_area, modern_area, quiet_area, family_area);

-- Index sur l'orientation
CREATE INDEX IF NOT EXISTS idx_property_sun_direction ON property(sun_direction);

-- Index sur le mode de paiement
CREATE INDEX IF NOT EXISTS idx_property_payment_method ON property(payment_method);

-- Index composite pour les filtres avancés
CREATE INDEX IF NOT EXISTS idx_property_advanced_filters ON property(
    city,
    status,
    type,
    surface,
    rooms,
    price
) WHERE status IN ('APPROVED', 'AVAILABLE');

-- =====================================================
-- 4. ANALYSE DES STATISTIQUES
-- =====================================================

ANALYZE property;

-- =====================================================
-- 5. VÉRIFICATION FINALE
-- =====================================================

-- Afficher la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'property'
ORDER BY ordinal_position;