-- Migration 001: Add catalog linking columns to plants table
-- Run once against existing databases. For fresh databases, the columns
-- are included in schema.sql directly.
ALTER TABLE plants ADD COLUMN garden_id TEXT REFERENCES gardens(id);
ALTER TABLE plants ADD COLUMN catalog_id TEXT REFERENCES plant_catalog(id);
ALTER TABLE plants ADD COLUMN identification_confidence TEXT DEFAULT 'unknown';
