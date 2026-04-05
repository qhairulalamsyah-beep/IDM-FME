-- ============================================
-- RESET ADMIN PIN to "123456"
-- ============================================
-- Run this in Supabase SQL Editor
-- After running this, login PIN for admin 'tazos' will be: 123456
-- ============================================

UPDATE "User"
SET "adminPass" = '$2b$12$igJUz9zY0R4xZxHJFD1zg.hBq6Xhq6h0HEZ3RA7tRIAzS3HOk16Iq'
WHERE email = 'tazos_m@idm.local'
  AND role IN ('admin', 'super_admin');

-- Verify the update
SELECT id, name, email, role, "isAdmin",
       CASE WHEN "adminPass" IS NOT NULL THEN '***HASHED***' ELSE 'NULL' END as admin_pass_status,
       "createdAt"
FROM "User"
WHERE role IN ('admin', 'super_admin');
