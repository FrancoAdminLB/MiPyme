-- Agregar número de WhatsApp para notificaciones a la tabla organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS notification_phone TEXT;
