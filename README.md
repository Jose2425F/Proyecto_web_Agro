# Proyecto Web Agro

Plataforma web para la visualización e inversión en proyectos agrícolas. Los usuarios pueden registrarse, explorar diferentes proyectos, ver detalles y decidir si invertir.

## ✨ Características Principales

- **Exploración de Proyectos:** Visualiza una lista de proyectos agrícolas disponibles.
- **Detalles del Proyecto:** Accede a información detallada de cada proyecto, incluyendo descripción, metas de financiamiento y rentabilidad.
- **Gestión de Inversiones:** Los usuarios pueden invertir en los proyectos de su interés.
- **Autenticación y Perfiles:** Sistema de registro e inicio de sesión para usuarios.

## ቴክ Tecnologías Utilizadas

- **Frontend:** React, Vite
- **Backend:** Supabase (Base de Datos PostgreSQL, Autenticación, APIs)
- **Estilos:** CSS plano

## 📂 Estructura del Repositorio

```
/
├── frontend/         # Código fuente de la aplicación React
│   ├── src/
│   └── ...
├── sql/              # Scripts de base de datos
│   └── create.sql
└── README.md         # Este archivo
```

## 🚀 Configuración y Puesta en Marcha

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Requisitos Previos

- [Node.js](https://nodejs.org/) (versión 18.x o superior)
- [npm](https://www.npmjs.com/)
- Una cuenta gratuita en [Supabase](https://supabase.com/)

### Pasos de Instalación

1.  **Clona el repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd Proyecto_web_Agro
    ```

2.  **Navega al directorio del frontend e instala las dependencias:**
    ```bash
    cd frontend
    npm install
    ```

3.  **Configura Supabase:**
    - Ve a [supabase.com](https://supabase.com/) y crea un nuevo proyecto.
    - En la configuración de tu proyecto de Supabase, ve a la sección de **Settings > API**.
    - Necesitarás la **URL del Proyecto** y la **clave `anon` pública**.

4.  **Crea el archivo de entorno:**
    - En el directorio `frontend`, crea un archivo llamado `.env`.
    - Añade las siguientes variables con los valores de tu proyecto de Supabase:
      ```
      VITE_SUPABASE_URL="TU_URL_DE_SUPABASE"
      VITE_SUPABASE_ANON_KEY="TU_CLAVE_ANON_PUBLICA"
      ```
    > **Nota:** El archivo `.env` está correctamente ignorado por Git para proteger tus claves.

5.  **Configura la base de datos:**
    - En el panel de tu proyecto de Supabase, ve al **SQL Editor**.
    - Copia el contenido del archivo `sql/create.sql` que se encuentra en este repositorio.
    - Pega el contenido en el editor de SQL y ejecútalo para crear las tablas y la estructura necesaria.

## 🔒 Autenticación y Manejo de JWT

La autenticación en este proyecto se maneja a través de Supabase Auth, que utiliza **JSON Web Tokens (JWT)** para asegurar las sesiones de los usuarios. El flujo es el siguiente:

1.  **Inicio de Sesión:** Cuando un usuario inicia sesión, la aplicación envía las credenciales al servicio de autenticación de Supabase (`GoTrue`).
2.  **Emisión del JWT:** Si las credenciales son válidas, Supabase genera un `access_token` (JWT) y un `refresh_token`. Este JWT contiene información del usuario (como su ID) y está firmado digitalmente por Supabase.
3.  **Almacenamiento:** La librería cliente de Supabase (`@supabase/supabase-js`) se encarga de almacenar de forma segura este token en el `localStorage` del navegador.
4.  **Autorización de API:** Para cada solicitud posterior a la base de datos (por ejemplo, para obtener la lista de proyectos), la librería cliente adjunta automáticamente el JWT en la cabecera `Authorization` de la petición.
5.  **Validación en el Backend:** El backend de Supabase (específicamente `PostgREST`) valida la firma del JWT en cada solicitud. Si el token es válido, extrae el ID del usuario y lo utiliza para aplicar las **Políticas de Seguridad a Nivel de Fila (RLS)** que definimos en `sql/create.sql`. Esto garantiza que un usuario solo pueda ver o modificar los datos a los que tiene permiso.
6.  **Refresco de Sesión:** El `refresh_token` se utiliza para obtener un nuevo `access_token` cuando el actual expira, manteniendo la sesión del usuario activa sin necesidad de volver a iniciar sesión.

Este mecanismo asegura que la comunicación entre el frontend y la base de datos de Supabase sea segura y que los usuarios solo puedan acceder a sus propios datos.

### Ejecución

1.  **Inicia el servidor de desarrollo de Vite:**
    - Asegúrate de estar en el directorio `frontend`.
    ```bash
    npm run dev
    ```

2.  Abre tu navegador y visita `http://localhost:5173` (o la URL que indique la terminal).
