-- ==========================
-- init.sql
-- Initial database schema
-- ==========================

-- Esta tabla almacena registros básicos del sistema
-- Se ejecuta automáticamente SOLO al crear la BBDD por primera vez

CREATE TABLE IF NOT EXISTS entries (
    id SERIAL PRIMARY KEY,           -- ID único autoincremental
    title TEXT NOT NULL,              -- Título del registro
    description TEXT,                 -- Descripción opcional
    created_at TIMESTAMP DEFAULT NOW()-- Fecha de creación
);

-- Datos iniciales de ejemplo
-- Útiles para pruebas y validación

INSERT INTO entries (title, description)
VALUES
  ('First entry', 'Initial test entry'),
  ('Docker ready', 'Database initialized via init.sql'),
  ('Ejemplo en Español', 'Este es un ejemplo en Castellano');


-- ==========================
-- Users table
-- ==========================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW()
);