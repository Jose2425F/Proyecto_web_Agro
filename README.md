# Proyecto Web Agro

Plataforma web para la visualización e inversión en proyectos agrícolas. Los usuarios pueden registrarse, explorar diferentes proyectos, ver detalles y decidir si invertir.

[![Estado del Proyecto](https://img.shields.io/badge/estado-en%20desarrollo-yellowgreen)](https://github.com/Jose2425F/Proyecto_web_Agro)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-^5.0-blueviolet?logo=vite)](https://vitejs.dev/)

## ✨ Características Principales

-   **Exploración de Proyectos:** Visualiza una lista de proyectos agrícolas disponibles.
-   **Detalles del Proyecto:** Accede a información detallada de cada proyecto, incluyendo descripción, metas de financiamiento y rentabilidad.
-   **Gestión de Inversiones:** Los usuarios pueden invertir en los proyectos de su interés.
-   **Autenticación y Perfiles:** Sistema de registro e inicio de sesión para usuarios con roles (inversor, agricultor).
-   **Panel de Administración:** Paneles dedicados para gestionar proyectos e inversiones.

## ቴክ Tecnologías Utilizadas

-   **Frontend:**
    -   [React 19](https://react.dev/)
    -   [Vite](https://vitejs.dev/) como empaquetador y servidor de desarrollo.
    -   [React Router](https://reactrouter.com/) para el enrutamiento de la aplicación.
    -   [Material-UI (MUI)](https://mui.com/) para componentes de la interfaz.
    -   CSS plano para estilos personalizados.
-   **Backend (BaaS - Backend as a Service):**
    -   [Supabase](https://supabase.com/)
        -   **Base de Datos:** PostgreSQL.
        -   **Autenticación:** Manejo de usuarios y JWT.
        -   **APIs Auto-generadas:** APIs RESTful para interactuar con la base de datos.

## 📂 Estructura del Repositorio

```
/
├── frontend/         # Código fuente de la aplicación React
│   ├── src/
│   │   ├── components/ # Componentes reutilizables
│   │   ├── pages/      # Vistas principales de la aplicación
│   │   ├── hooks/      # Hooks personalizados (ej. useUser)
│   │   └── supabaseClient.js # Configuración del cliente de Supabase
│   ├── .env.example  # Archivo de ejemplo para variables de entorno
│   └── ...
├── sql/              # Scripts de base de datos
│   └── create.sql
└── README.md         # Este archivo
```

## 🚀 Configuración y Puesta en Marcha

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Requisitos Previos

-   [Node.js](https://nodejs.org/) (versión 18.x o superior)
-   [npm](https://www.npmjs.com/) (o un gestor de paquetes compatible)
-   Una cuenta gratuita en [Supabase](https://supabase.com/)

### Pasos de Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/Jose2425F/Proyecto_web_Agro.git
    cd Proyecto_web_Agro
    ```

2.  **Navega al directorio del frontend e instala las dependencias:**
    ```bash
    cd frontend
    npm install
    ```

3.  **Configura Supabase:**
    -   Ve a [supabase.com](https://supabase.com/) y crea un nuevo proyecto.
    -   En la configuración de tu proyecto de Supabase, ve a la sección de **Settings > API**.
    -   Necesitarás la **URL del Proyecto** y la clave **`anon` pública**.

4.  **Crea el archivo de entorno:**
    -   En el directorio `frontend`, crea un archivo llamado `.env`.
    -   Añade las siguientes variables con los valores de tu proyecto de Supabase y OAuth de Google:
        ```
        VITE_SUPABASE_URL="TU_URL_DE_SUPABASE"
        VITE_SUPABASE_ANON_KEY="TU_CLAVE_ANON_PUBLICA"
        VITE_GOOGLE_CLIENT_ID="TU_CLIENT_ID_DE_GOOGLE.apps.googleusercontent.com"
        ```
    > **Nota:** El archivo `.env` está correctamente ignorado por Git para proteger tus claves.

5.  **Configura la base de datos:**
    -   En el panel de tu proyecto de Supabase, ve al **SQL Editor**.
    -   Copia el contenido del archivo `sql/create.sql` que se encuentra en este repositorio.
    -   Pega el contenido en el editor de SQL y ejecútalo para crear las tablas y la estructura necesaria.

### Ejecución

1.  **Inicia el servidor de desarrollo de Vite:**
    -   Asegúrate de estar en el directorio `frontend`.
    ```bash
    npm run dev
    ```

2.  Abre tu navegador y visita `http://localhost:5173` (o la URL que indique la terminal).

## 🗃️ Esquema de la Base de Datos

La base de datos en PostgreSQL está estructurada con las siguientes tablas principales:

-   **`usuarios`**: Almacena la información de los usuarios registrados.
    -   `id` (UUID): Identificador único del usuario, vinculado a Supabase Auth.
    -   `nombre`, `apellido`, `correo`, `rol`, `foto_perfil`.
-   **`proyectos`**: Contiene los detalles de los proyectos agrícolas.
    -   `id` (BIGINT): Identificador único del proyecto.
    -   `nombre`, `descripcion`, `costos`, `monto_recaudado`, `estado`.
    -   `id_usuario` (UUID): Referencia al usuario (agricultor) que creó el proyecto.
-   **`inversiones`**: Registra las inversiones hechas por los usuarios en los proyectos.
    -   `id` (UUID): Identificador único de la inversión.
    -   `id_proyecto` (BIGINT): Referencia al proyecto invertido.
    -   `id_inversor` (UUID): Referencia al usuario (inversor) que realizó la inversión.
    -   `monto_invertido`.

-   **`likes_proyecto`**: Registra los likes que los usuarios dan a proyectos.
    -   `id` (BIGSERIAL): Identificador del registro de like.
    -   `id_proyecto` (BIGINT): Referencia al proyecto (clave foránea a `proyectos.id`).
    -   `id_usuario` (UUID): Referencia al usuario que dio el like (clave foránea a `usuarios.id`).
    -   `fecha_like` (TIMESTAMPTZ): Fecha y hora en que se registró el like.
    -   `UNIQUE (id_proyecto, id_usuario)` — restricción para evitar likes duplicados por el mismo usuario.

-   Campos adicionales en el esquema:
    -   `usuarios.cuenta_estado` (TEXT, default 'activo') — estado de la cuenta del usuario.
    -   `proyectos.produccion_estimada` (NUMERIC) — estimación de producción del proyecto.
    -   `proyectos.fecha_creacion` (TIMESTAMP) — fecha de creación del proyecto.
    -   `proyectos.imagen_url` (VARCHAR) — URL de la imagen asociada al proyecto.
    -   `inversiones.tipo_inversion` (TEXT) — tipo/etiqueta de la inversión.
    -   `inversiones.fecha_inversion` (TIMESTAMPTZ) — timestamp registrado de la inversión.


## 🔒 Autenticación y Manejo de JWT

La autenticación en este proyecto se maneja a través de Supabase Auth, que utiliza **JSON Web Tokens (JWT)** para asegurar las sesiones de los usuarios. El flujo es el siguiente:

1.  **Inicio de Sesión/Registro:** Cuando un usuario se registra o inicia sesión, la aplicación envía las credenciales al servicio de autenticación de Supabase.
2.  **Emisión del JWT:** Si las credenciales son válidas, Supabase genera un `access_token` (JWT) y un `refresh_token`. Este JWT contiene información del usuario (como su ID y rol) y está firmado digitalmente por Supabase.
3.  **Almacenamiento Seguro:** La librería cliente de Supabase (`@supabase/supabase-js`) se encarga de almacenar de forma segura este token en el `localStorage` del navegador.
4.  **Autorización de API:** Para cada solicitud posterior a la base de datos (por ejemplo, para obtener la lista de proyectos), la librería cliente adjunta automáticamente el JWT en la cabecera `Authorization` de la petición.
5.  **Validación en el Backend:** El backend de Supabase valida la firma del JWT en cada solicitud. Si el token es válido, extrae la información del usuario y la utiliza para aplicar las **Políticas de Seguridad a Nivel de Fila (RLS)**. Esto garantiza que un usuario solo pueda ver o modificar los datos a los que tiene permiso según su rol y pertenencia.
6.  **Refresco de Sesión:** El `refresh_token` se utiliza para obtener un nuevo `access_token` cuando el actual expira, manteniendo la sesión del usuario activa sin necesidad de volver a iniciar sesión.

Este mecanismo asegura que la comunicación entre el frontend y la base de datos de Supabase sea segura y que los usuarios solo puedan acceder a sus propios datos.