-- Tabla de usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    correo TEXT UNIQUE NOT NULL,
    rol TEXT,
    foto_perfil TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    cuenta_estado TEXT DEFAULT 'activo'
);

-- Tabla de proyectos
CREATE TABLE proyectos (
    id BIGSERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    costos NUMERIC,
    monto_recaudado NUMERIC DEFAULT 0,
    produccion_estimada NUMERIC,
    estado TEXT DEFAULT 'pendiente',
    id_usuario UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_creacion TIMESTAMP DEFAULT NOW(),
    imagen_url VARCHAR
);

-- Tabla de inversiones
CREATE TABLE inversiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_proyecto BIGINT REFERENCES proyectos(id) ON DELETE CASCADE,
    id_inversor UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_inversion TEXT,
    monto_invertido NUMERIC NOT NULL,
    fecha_inversion TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de likes_proyecto
CREATE TABLE likes_proyecto (
    id BIGSERIAL PRIMARY KEY,
    id_proyecto BIGINT REFERENCES proyectos(id) ON DELETE CASCADE,
    id_usuario UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    fecha_like TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (id_proyecto, id_usuario) -- Evita likes duplicados
);
