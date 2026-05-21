-- ================================================================
-- BLQ Web — Campo onboarding_completed en organizations
-- Migración: 005_onboarding
-- ================================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
