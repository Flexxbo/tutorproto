-- Update all users with the correct password hash for "password123"
UPDATE users 
SET password_hash = '$2b$10$ELfWB3Ssz5uUPGP/IKwkiuclL5Naa5/KtqoAhRGYJPGHlQi8AmdBS'
WHERE username IN ('testuser1', 'testuser2', 'demo'); 