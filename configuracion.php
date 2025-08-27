<?php
    session_start();
    include 'php/conexion_db.php';

    if(!isset($_SESSION['usuario'])){
        echo '<script>window.location = "index.php";</script>';
        session_destroy();
        die();
    }

    $es_admin = isset($_SESSION['rol']) && in_array($_SESSION['rol'], ['administrador', 'administradorsupremo']);
    $es_campesino = isset($_SESSION['rol']) && $_SESSION['rol'] == 'campesino';

    // Fetch current user data for the profile form
    $current_user_data = [];
    if (isset($_SESSION['id_usuario'])) {
        $id_current_user = $_SESSION['id_usuario'];
        $query_current_user = "SELECT nombre, email, usuario FROM usuarios WHERE id = ?";
        $stmt_current_user = mysqli_prepare($conexion, $query_current_user);
        if ($stmt_current_user) {
            mysqli_stmt_bind_param($stmt_current_user, "i", $id_current_user);
            mysqli_stmt_execute($stmt_current_user);
            $result_current_user = mysqli_stmt_get_result($stmt_current_user);
            $current_user_data = mysqli_fetch_assoc($result_current_user);
            mysqli_stmt_close($stmt_current_user);
        }
    }

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuración - AgroColombia</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/dashboard.css?v=1.0">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>
    <header class="dashboard-header">
        <div class="logo">
            <h1>AgroColombia</h1>
        </div>
        <nav class="dashboard-nav">
            <ul>
                <li><a href="bienvenida.php">Inicio</a></li>
                <?php if ($es_campesino): ?>
                    <li><a href="php/crear_proyecto.php">Crear Proyecto</a></li>
                    <li><a href="php/mis_proyectos.php">Mis Proyectos</a></li>
                <?php endif; ?>
                <li><a href="estadisticas.php">Estadísticas</a></li>
                <li><a href="configuracion.php" class="active">Configuración</a></li>
                <?php if ($es_admin): ?>
                    <li><a href="admin_panel.php">Admin</a></li>
                <?php endif; ?>
                <li><a href="php/cerrarsesion.php">Cerrar Sesión</a></li>
            </ul>
        </nav>
    </header>

    <main class="dashboard-main">
        <div class="dashboard-container">

            <!-- Main configuration cards -->
            <div id="config-cards">
                <h2>Configuración de Perfil</h2>
                <p style="color: var(--text-muted); margin-bottom: 2rem;">Actualiza tu información personal y contraseña.</p>
                
                <form action="php/actualizar_perfil.php" method="POST" class="config-form">
                    <div class="form-group"><label for="nombre">Nombre Completo:</label><input type="text" id="nombre" name="nombre" value="<?php echo htmlspecialchars($current_user_data['nombre'] ?? ''); ?>" required></div>
                    <div class="form-group"><label for="email">Correo Electrónico:</label><input type="email" id="email" name="email" value="<?php echo htmlspecialchars($current_user_data['email'] ?? ''); ?>" required></div>
                    <div class="form-group"><label for="usuario">Usuario:</label><input type="text" id="usuario" name="usuario" value="<?php echo htmlspecialchars($current_user_data['usuario'] ?? ''); ?>" required></div>
                    <div class="form-group"><label for="password">Nueva Contraseña:</label><input type="password" id="password" name="password"></div>
                    <button type="submit" class="btn-update">Actualizar Perfil</button>
                </form>
            </div>

        </div>
    </main>

    <script>
        // No need for showSection/showConfigCards functions anymore as there's only one section
    </script>
    <?php if (isset($_SESSION['swal'])): ?>
    <script>
        Swal.fire({
            icon: "<?php echo $_SESSION['swal']['icon']; ?>",
            title: "<?php echo $_SESSION['swal']['title']; ?>",
            text: "<?php echo $_SESSION['swal']['text']; ?>",
            background: 'var(--card-bg)',
            color: 'var(--text-color)',
            confirmButtonColor: 'var(--primary-color)'
        });
        // Clear the swal session variable
        <?php unset($_SESSION['swal']); ?>
    </script>
    <?php endif; ?>
</body>
</html>