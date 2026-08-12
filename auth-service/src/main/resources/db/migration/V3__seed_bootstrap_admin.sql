-- Dev/demo seed only - solves the chicken-and-egg problem where nobody could
-- ever reach a ROLE_ADMIN-only endpoint otherwise (register() always assigns
-- ROLE_USER only). Password is 'AdminBootstrap123!' - rotate or remove this
-- account before any real deployment. See auth-service/README.md.
INSERT INTO users (username, email, password, full_name)
VALUES ('admin', 'admin@mindora.local', '$2a$10$b..7FjraK.jb/8p1vR1b2.ehhlfMeuczk3VJ6OEM3iFJTCqcHx3b2', 'Bootstrap Admin')
ON DUPLICATE KEY UPDATE username = username;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ROLE_USER'
ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'admin' AND r.name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE user_id = user_id;
