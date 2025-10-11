-- Tabla: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT NOT NULL,
    foto_perfil TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cuenta_estado TEXT NOT NULL
);

-- Tabla: proyectos
CREATE TABLE proyectos (
    id BIGINT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    costos NUMERIC NOT NULL,
    monto_recaudado NUMERIC DEFAULT 0,
    produccion_estimada NUMERIC,
    estado TEXT NOT NULL, -- Reemplazar con ENUM si aplica
    id_usuario UUID NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    imagen_url VARCHAR,
    likes_count INT DEFAULT 0,
    
    -- Llave foránea hacia usuarios
    CONSTRAINT fk_proyecto_usuario
        FOREIGN KEY (id_usuario) 
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

-- Tabla: inversiones
CREATE TABLE inversiones (
    id UUID PRIMARY KEY,
    id_proyecto BIGINT NOT NULL,
    id_inversor UUID NOT NULL,
    tipo_inversion TEXT NOT NULL, -- Reemplazar con ENUM si aplica
    monto_invertido NUMERIC NOT NULL,
    fecha_inversion TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Llave foránea hacia proyectos
    CONSTRAINT fk_inversion_proyecto
        FOREIGN KEY (id_proyecto)
        REFERENCES proyectos(id)
        ON DELETE CASCADE,

    -- Llave foránea hacia usuarios (inversor)
    CONSTRAINT fk_inversion_inversor
        FOREIGN KEY (id_inversor)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);
