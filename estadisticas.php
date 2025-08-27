<?php
session_start();
include 'php/conexion_db.php';

if (!isset($_SESSION['usuario'])) {
    echo '<script>window.location = "index.php";</script>';
    session_destroy();
    die();
}

$id_usuario = $_SESSION['id_usuario'];
$rol = $_SESSION['rol'];
$es_admin = in_array($rol, ['administrador', 'administradorsupremo']);
$es_campesino = $rol == 'campesino';

$stats_data = [];
$inversiones_detalle = [];
$likes_recibidos = [];
$inversiones_recibidas = [];

if ($rol == 'campesino') {
    // --- STATS GENERALES DE CAMPESINO ---
    $stmt = mysqli_prepare($conexion, "SELECT COUNT(id) as total FROM proyectos WHERE id_usuario = ?");
    mysqli_stmt_bind_param($stmt, "i", $id_usuario);
    mysqli_stmt_execute($stmt);
    $stats_data['total_proyectos'] = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt))['total'] ?? 0;

    $stmt = mysqli_prepare($conexion, "SELECT SUM(monto_recaudado) as total FROM proyectos WHERE id_usuario = ?");
    mysqli_stmt_bind_param($stmt, "i", $id_usuario);
    mysqli_stmt_execute($stmt);
    $stats_data['monto_recaudado'] = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt))['total'] ?? 0;

    $stmt = mysqli_prepare($conexion, "SELECT SUM(likes_count) as total FROM proyectos WHERE id_usuario = ?");
    mysqli_stmt_bind_param($stmt, "i", $id_usuario);
    mysqli_stmt_execute($stmt);
    $stats_data['total_likes'] = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt))['total'] ?? 0;

    // --- DETALLE DE LIKES RECIBIDOS ---
    $query_likes = "SELECT p.nombre AS nombre_proyecto, u.nombre AS nombre_usuario_like FROM proyecto_likes pl JOIN proyectos p ON pl.id_proyecto = p.id JOIN usuarios u ON pl.id_usuario = u.id WHERE p.id_usuario = ? ORDER BY p.nombre, u.nombre";
    $stmt_likes = mysqli_prepare($conexion, $query_likes);
    mysqli_stmt_bind_param($stmt_likes, "i", $id_usuario);
    mysqli_stmt_execute($stmt_likes);
    $resultado_likes = mysqli_stmt_get_result($stmt_likes);
    while ($fila = mysqli_fetch_assoc($resultado_likes)) {
        $likes_recibidos[] = $fila;
    }

    // --- DETALLE DE INVERSIONES RECIBIDAS ---
    $query_inversiones = "SELECT p.nombre AS nombre_proyecto, u.nombre AS nombre_inversionista, i.monto_invertido, i.fecha_inversion FROM inversiones i JOIN proyectos p ON i.id_proyecto = p.id JOIN usuarios u ON i.id_inversionista = u.id WHERE p.id_usuario = ? ORDER BY p.nombre, i.fecha_inversion DESC";
    $stmt_inversiones = mysqli_prepare($conexion, $query_inversiones);
    mysqli_stmt_bind_param($stmt_inversiones, "i", $id_usuario);
    mysqli_stmt_execute($stmt_inversiones);
    $resultado_inversiones = mysqli_stmt_get_result($stmt_inversiones);
    while ($fila = mysqli_fetch_assoc($resultado_inversiones)) {
        $inversiones_recibidas[] = $fila;
    }

} elseif ($rol == 'inversionista') {
    // --- STATS GENERALES DE INVERSIONISTA ---
    $stmt = mysqli_prepare($conexion, "SELECT COUNT(DISTINCT id_proyecto) as total FROM inversiones WHERE id_inversionista = ?");
    mysqli_stmt_bind_param($stmt, "i", $id_usuario);
    mysqli_stmt_execute($stmt);
    $stats_data['proyectos_invertidos'] = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt))['total'] ?? 0;

    $stmt = mysqli_prepare($conexion, "SELECT SUM(monto_invertido) as total FROM inversiones WHERE id_inversionista = ?");
    mysqli_stmt_bind_param($stmt, "i", $id_usuario);
    mysqli_stmt_execute($stmt);
    $stats_data['monto_invertido'] = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt))['total'] ?? 0;

    // --- DETALLE DE INVERSIONES REALIZADAS ---
    $query_detalle = "SELECT p.nombre, i.monto_invertido, i.fecha_inversion FROM inversiones i JOIN proyectos p ON i.id_proyecto = p.id WHERE i.id_inversionista = ? ORDER BY i.fecha_inversion DESC";
    $stmt_detalle = mysqli_prepare($conexion, $query_detalle);
    mysqli_stmt_bind_param($stmt_detalle, "i", $id_usuario);
    mysqli_stmt_execute($stmt_detalle);
    $resultado_detalle = mysqli_stmt_get_result($stmt_detalle);
    while ($fila = mysqli_fetch_assoc($resultado_detalle)) {
        $inversiones_detalle[] = $fila;
    }
}

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Estadísticas - AgroColombia</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/dashboard.css?v=1.5">
    <style>
        .section-title { font-size: 1.8rem; font-weight: 600; color: var(--text-color); margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--border-color); }
        .details-container { margin-top: 2.5rem; }
        .details-table { width: 100%; border-collapse: collapse; background-color: var(--card-bg); border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .details-table th, .details-table td { padding: 1rem 1.25rem; text-align: left; border-bottom: 1px solid var(--border-color); }
        .details-table thead th { font-weight: 600; text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; }
        .details-table tbody tr:last-child td { border-bottom: none; }
        .details-table tbody tr:hover { background-color: var(--hover-color); }
        .subsection-title { font-size: 1.5rem; font-weight: 600; margin-top: 2.5rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <header class="dashboard-header">
        <div class="logo"><h1>AgroColombia</h1></div>
        <nav class="dashboard-nav">
            <ul>
                <li><a href="bienvenida.php">Inicio</a></li>
                 <?php if ($es_campesino): ?>
                    <li><a href="php/crear_proyecto.php">Crear Proyecto</a></li>
                    <li><a href="php/mis_proyectos.php">Mis Proyectos</a></li>
                <?php endif; ?>
                <li><a href="estadisticas.php" class="active">Estadísticas</a></li>
                <li><a href="configuracion.php">Configuración</a></li>
                <?php if ($es_admin): ?>
                    <li><a href="admin_panel.php">Admin</a></li>
                <?php endif; ?>
                <li><a href="php/cerrarsesion.php">Cerrar Sesión</a></li>
            </ul>
        </nav>
    </header>

    <main class="dashboard-main">
        <div class="dashboard-container">
            
            <?php if ($rol == 'campesino'): ?>
                <h2 class="section-title">Mis Estadísticas de Campesino</h2>
                <div class="stats-grid">
                    <div class="stat-card"><h3>Proyectos Creados</h3><p class="stat-number"><?php echo $stats_data['total_proyectos']; ?></p></div>
                    <div class="stat-card"><h3>Monto Total Recaudado</h3><p class="stat-number">$<?php echo number_format($stats_data['monto_recaudado'], 2); ?></p></div>
                    <div class="stat-card"><h3>Total de 'Me Gusta'</h3><p class="stat-number"><?php echo $stats_data['total_likes']; ?></p></div>
                </div>

                <div class="details-container">
                    <h3 class="subsection-title">Registro de Inversiones Recibidas</h3>
                    <table class="details-table">
                        <thead><tr><th>Proyecto</th><th>Inversionista</th><th>Monto Invertido</th><th>Fecha</th></tr></thead>
                        <tbody>
                            <?php if (!empty($inversiones_recibidas)): ?>
                                <?php foreach ($inversiones_recibidas as $inversion): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($inversion['nombre_proyecto']); ?></td>
                                        <td><?php echo htmlspecialchars($inversion['nombre_inversionista']); ?></td>
                                        <td>$<?php echo number_format($inversion['monto_invertido'], 2); ?></td>
                                        <td><?php echo date("d/m/Y", strtotime($inversion['fecha_inversion'])); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr><td colspan="4" style="text-align: center;">Aún no has recibido ninguna inversión en tus proyectos.</td></tr>
                            <?php endif; ?>
                        </tbody>
                    </table>

                    <h3 class="subsection-title">Actividad de 'Me Gusta' en tus Proyectos</h3>
                    <table class="details-table">
                        <thead><tr><th>Proyecto</th><th>Le gusta a</th></tr></thead>
                        <tbody>
                            <?php if (!empty($likes_recibidos)): ?>
                                <?php foreach ($likes_recibidos as $like): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($like['nombre_proyecto']); ?></td>
                                        <td><?php echo htmlspecialchars($like['nombre_usuario_like']); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr><td colspan="2" style="text-align: center;">Ninguno de tus proyectos ha recibido un 'Me gusta' todavía.</td></tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

            <?php elseif ($rol == 'inversionista'): ?>
                <h2 class="section-title">Mis Estadísticas de Inversionista</h2>
                <div class="stats-grid">
                    <div class="stat-card"><h3>Proyectos Invertidos</h3><p class="stat-number"><?php echo $stats_data['proyectos_invertidos']; ?></p></div>
                    <div class="stat-card"><h3>Monto Total Invertido</h3><p class="stat-number">$<?php echo number_format($stats_data['monto_invertido'], 2); ?></p></div>
                </div>

                <div class="details-container">
                    <h3 class="subsection-title">Detalle de Mis Inversiones</h3>
                    <table class="details-table">
                        <thead><tr><th>Nombre del Proyecto</th><th>Monto Invertido</th><th>Fecha de Inversión</th></tr></thead>
                        <tbody>
                            <?php if (!empty($inversiones_detalle)): ?>
                                <?php foreach ($inversiones_detalle as $inversion): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($inversion['nombre']); ?></td>
                                        <td>$<?php echo number_format($inversion['monto_invertido'], 2); ?></td>
                                        <td><?php echo date("d/m/Y", strtotime($inversion['fecha_inversion'])); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr><td colspan="3" style="text-align: center;">Aún no has realizado ninguna inversión.</td></tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>

            <?php else: ?>
                <h2 class="section-title">Estadísticas</h2>
                <p>No hay estadísticas disponibles para tu rol.</p>
            <?php endif; ?>

        </div>
    </main>

</body>
</html>
