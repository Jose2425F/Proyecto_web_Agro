# AgroColombia Connect

AgroColombia Connect es una plataforma web diseñada para conectar a agricultores colombianos con inversionistas interesados en financiar proyectos agrícolas. La plataforma busca fomentar el desarrollo del sector agrícola en Colombia, facilitando la inversión en proyectos prometedores.

## Características

- **Roles de Usuario:**
    - **Campesino:** Puede crear y gestionar sus proyectos agrícolas.
    - **Inversionista:** Puede explorar proyectos y realizar inversiones.
    - **Administrador:** Puede supervisar la plataforma, gestionar usuarios y proyectos.
    - **Administrador Supremo:** Tiene control total sobre la plataforma.

- **Gestión de Proyectos:**
    - Creación de proyectos con detalles como nombre, descripción, costos, producción estimada e imagen.
    - Listado y búsqueda de proyectos.
    - Posibilidad de dar "like" a los proyectos.
    - Seguimiento del estado de los proyectos (Buscando Inversión, En Progreso, Completado).

- **Sistema de Inversión:**
    - Los inversionistas pueden invertir en los proyectos.
    - Se registra el monto recaudado para cada proyecto.

- **Autenticación y Seguridad:**
    - Sistema de registro e inicio de sesión para usuarios.
    - Uso de sentencias preparadas para prevenir inyección SQL.

## Tecnologías Utilizadas

- **Backend:** PHP
- **Base de Datos:** MySQL (MariaDB)
- **Frontend:**
    - HTML5
    - CSS3
    - JavaScript
    - [SweetAlert2](https://sweetalert2.github.io/) para notificaciones y alertas.

## Esquema de la Base de Datos

La base de datos se llama `agrocolombia_connect` y consta de las siguientes tablas:

- **`usuarios`**: Almacena la información de los usuarios.
    - `id`: INT (Clave Primaria, Autoincremental)
    - `nombre`: VARCHAR
    - `email`: VARCHAR (Único)
    - `usuario`: VARCHAR
    - `password`: VARCHAR
    - `rol`: ENUM('campesino', 'inversionista', 'administrador', 'administradorsupremo')
    - `fecha_registro`: TIMESTAMP

- **`proyectos`**: Contiene los detalles de los proyectos agrícolas.
    - `id`: INT (Clave Primaria, Autoincremental)
    - `nombre`: VARCHAR
    - `descripcion`: TEXT
    - `costos`: DECIMAL
    - `monto_recaudado`: DECIMAL
    - `produccion_estimada`: DECIMAL
    - `estado`: ENUM('Buscando Inversión', 'En Progreso', 'Completado')
    - `id_usuario`: INT (Clave Foránea a `usuarios.id`)
    - `fecha_creacion`: TIMESTAMP
    - `imagen_url`: VARCHAR
    - `likes_count`: INT

- **`inversiones`**: Registra las inversiones realizadas en los proyectos.
    - `id`: INT (Clave Primaria, Autoincremental)
    - `id_proyecto`: INT (Clave Foránea a `proyectos.id`)
    - `id_inversionista`: INT (Clave Foránea a `usuarios.id`)
    - `monto_invertido`: DECIMAL
    - `fecha_inversion`: TIMESTAMP

- **`proyecto_likes`**: Almacena los "likes" que los usuarios dan a los proyectos.
    - `id`: INT (Clave Primaria, Autoincremental)
    - `id_usuario`: INT (Clave Foránea a `usuarios.id`)
    - `id_proyecto`: INT (Clave Foránea a `proyectos.id`)
    - `fecha_like`: TIMESTAMP

## Instalación y Configuración

**Requisitos:**
- Un servidor web local como [XAMPP](https://www.apachefriends.org/es/index.html) o similar, que incluya Apache y MySQL.

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/Jose2425F/Proyecto_web_Agro.git
    ```

2.  **Importar la base de datos:**
    - Inicie los servicios de Apache y MySQL desde el panel de control de XAMPP.
    - Abra phpMyAdmin (`http://localhost/phpmyadmin`) y cree una nueva base de datos llamada `agrocolombia_connect`.
    - Seleccione la base de datos `agrocolombia_connect` y vaya a la pestaña "Importar".
    - Seleccione el archivo `sql/create.sql` del proyecto y haga clic en "Continuar".

3.  **Configurar la conexión a la base de datos:**
    - El archivo `php/conexion_db.php` está configurado para conectarse a la base de datos con el usuario `root` y sin contraseña. Si su configuración de MySQL es diferente, actualice este archivo:
      ```php
      <?php
      $conexion = mysqli_connect("localhost", "su_usuario", "su_contraseña", "agrocolombia_connect");
      ?>
      ```

4.  **Ejecutar el proyecto:**
    - Mueva la carpeta del proyecto clonado al directorio `htdocs` de su instalación de XAMPP (generalmente `C:/xampp/htdocs`).
    - Abra su navegador y vaya a `http://localhost/Proyecto_web_Agro/`.

## Consideraciones de Seguridad

- **Almacenamiento de Contraseñas:** **¡IMPORTANTE!** Las contraseñas se almacenan actualmente en texto plano. Se recomienda encarecidamente implementar el hashing de contraseñas utilizando `password_hash()` y `password_verify()` de PHP para mejorar la seguridad.