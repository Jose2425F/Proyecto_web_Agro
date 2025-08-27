<?php
session_start();
include 'php/conexion_db.php';

// Validar que el usuario sea administrador
if (!isset($_SESSION['usuario']) || !in_array($_SESSION['rol'], ['administrador', 'administradorsupremo'])) {
    header("Location: bienvenida.php");
    exit();
}

$es_admin = true;

// Fetch user list for the admin panel
$usuarios = [];
$resultado_usuarios = mysqli_query($conexion, "SELECT id, nombre, email, usuario, rol FROM usuarios");
if ($resultado_usuarios) {
    while ($fila = mysqli_fetch_assoc($resultado_usuarios)) {
        $usuarios[] = $fila;
    }
}

// --- ADMIN STATS ---
$stats_data_admin = [];
// Total Users by Role
$result_roles = mysqli_query($conexion, "SELECT rol, COUNT(id) as total FROM usuarios GROUP BY rol");
$stats_data_admin['usuarios_por_rol'] = [];
while($row = mysqli_fetch_assoc($result_roles)) {
    $stats_data_admin['usuarios_por_rol'][] = $row;
}

// Total Projects
$result_total_proyectos = mysqli_query($conexion, "SELECT COUNT(id) as total FROM proyectos");
$stats_data_admin['total_proyectos'] = mysqli_fetch_assoc($result_total_proyectos)['total'] ?? 0;

// Total Invested
$result_total_invertido = mysqli_query($conexion, "SELECT SUM(monto_invertido) as total FROM inversiones");
$stats_data_admin['total_invertido'] = mysqli_fetch_assoc($result_total_invertido)['total'] ?? 0;

// Projects by Status
$result_proyectos_estado = mysqli_query($conexion, "SELECT estado, COUNT(id) as total FROM proyectos GROUP BY estado");
$stats_data_admin['proyectos_por_estado'] = [];
while($row = mysqli_fetch_assoc($result_proyectos_estado)) {
    $stats_data_admin['proyectos_por_estado'][] = $row;
}

$estados_posibles = ['Buscando Inversión', 'En Progreso', 'Completado'];

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel de Administración - AgroColombia</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/dashboard.css?v=2.1">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .tabs { display: flex; border-bottom: 2px solid var(--border-color); margin-bottom: 2rem; }
        .tab-link { padding: 1rem 1.5rem; cursor: pointer; border: none; background-color: transparent; color: var(--text-muted); font-size: 1rem; font-weight: 500; transition: all 0.3s ease; border-bottom: 2px solid transparent; }
        .tab-link.active { color: var(--primary-color); border-bottom-color: var(--primary-color); }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .proyectos-table-container { overflow-x: auto; }
        .proyectos-table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; background-color: var(--card-bg); border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .proyectos-table th, .proyectos-table td { padding: 1rem 1.25rem; text-align: left; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
        .proyectos-table thead th { font-weight: 600; color: var(--text-color); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 0.5px; }
        .proyectos-table tbody tr:last-child td { border-bottom: none; }
        .proyectos-table tbody tr:hover { background-color: var(--hover-color); }
        .proyectos-table select { padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid var(--border-color); background-color: var(--input-bg); color: var(--text-color); font-family: 'Poppins', sans-serif; font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease; }
        .proyectos-table select:hover { border-color: var(--primary-color); box-shadow: 0 0 5px rgba(var(--rgb-primary), 0.1); }
        .proyectos-table .btn-delete { background-color: #e74c3c; border-color: #e74c3c; color: #fff; cursor: pointer; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.9rem; transition: all 0.2s ease; }
        .proyectos-table .btn-delete:hover { background-color: #c0392b; }
        
        select[name="nuevo_rol"], select[name="nuevo_estado"] { font-weight: 500; }
        select[name="nuevo_rol"] option[value="campesino"] { background-color: #a9dfbf; color: #145a32; }
        select[name="nuevo_rol"] option[value="inversionista"] { background-color: #aed6f1; color: #1b4f72; }
        select[name="nuevo_rol"] option[value="administrador"] { background-color: #f9e79f; color: #7d6608; }
        select[name="nuevo_rol"] option[value="administradorsupremo"] { background-color: #f5b7b1; color: #78281f; }

        select[name="nuevo_estado"] option[value="Buscando Inversión"] { background-color: #aed6f1; color: #1b4f72; }
        select[name="nuevo_estado"] option[value="En Progreso"] { background-color: #f9e79f; color: #7d6608; }
        select[name="nuevo_estado"] option[value="Completado"] { background-color: #a9dfbf; color: #145a32; }

        .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem; }
        .chart-container { background: var(--card-bg); padding: 1.5rem; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); max-height: 400px; }
        .chart-container canvas { max-width: 100%; }
    </style>
</head>
<body>
    <header class="dashboard-header">
        <div class="logo"><h1>AgroColombia</h1></div>
        <nav class="dashboard-nav">
            <ul>
                <li><a href="bienvenida.php">Inicio</a></li>
                <li><a href="estadisticas.php">Estadísticas</a></li>
                <li><a href="configuracion.php">Configuración</a></li>
                <?php if ($es_admin): ?>
                    <li><a href="admin_panel.php" class="active">Admin</a></li>
                <?php endif; ?>
                <li><a href="php/cerrarsesion.php">Cerrar Sesión</a></li>
            </ul>
        </nav>
    </header>

    <main class="dashboard-main">
        <div class="dashboard-container">
            <h2>Panel de Administración</h2>
            <p style="color: var(--text-muted); margin-bottom: 2rem;">Gestiona los usuarios y proyectos de la plataforma.</p>

            <div class="tabs">
                <button class="tab-link" data-tab="usuarios">Gestión de Usuarios</button>
                <button class="tab-link" data-tab="proyectos">Gestión de Proyectos</button>
                <button class="tab-link" data-tab="estadisticas">Estadísticas Globales</button>
            </div>

            <!-- User Management Tab -->
            <div id="usuarios" class="tab-content">
                <div class="proyectos-table-container">
                    <table class="proyectos-table">
                        <thead>
                            <tr><th>ID</th><th>Nombre</th><th>Email</th><th>Usuario</th><th>Rol</th><th>Acciones</th></tr>
                        </thead>
                        <tbody>
                            <?php foreach ($usuarios as $usuario): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($usuario['id']); ?></td>
                                <td><?php echo htmlspecialchars($usuario['nombre']); ?></td>
                                <td><?php echo htmlspecialchars($usuario['email']); ?></td>
                                <td><?php echo htmlspecialchars($usuario['usuario']); ?></td>
                                <td>
                                    <form action="php/actualizar_rol.php" method="POST">
                                        <input type="hidden" name="id_usuario" value="<?php echo htmlspecialchars($usuario['id']); ?>">
                                        <select name="nuevo_rol" onchange="this.form.submit()">
                                            <option value="campesino" <?php echo ($usuario['rol'] == 'campesino') ? 'selected' : ''; ?>>Campesino</option>
                                            <option value="inversionista" <?php echo ($usuario['rol'] == 'inversionista') ? 'selected' : ''; ?>>Inversionista</option>
                                            <option value="administrador" <?php echo ($usuario['rol'] == 'administrador') ? 'selected' : ''; ?>>Administrador</option>
                                            <option value="administradorsupremo" <?php echo ($usuario['rol'] == 'administradorsupremo') ? 'selected' : ''; ?>>Admin Supremo</option>
                                        </select>
                                    </form>
                                </td>
                                <td>
                                    <form action="php/eliminar_usuario.php" method="POST" onsubmit="return confirm('¿Eliminar a este usuario?');">
                                        <input type="hidden" name="id_usuario" value="<?php echo htmlspecialchars($usuario['id']); ?>">
                                        <button type="submit" class="btn-delete">Eliminar</button>
                                    </form>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Project Management Tab -->
            <div id="proyectos" class="tab-content">
                <div class="proyectos-table-container">
                    <table class="proyectos-table">
                         <thead>
                            <tr><th>ID</th><th>Nombre</th><th>Creador</th><th>Estado</th><th>Recaudado</th><th>Meta</th><th>Acciones</th></tr>
                        </thead>
                        <tbody>
                            <?php
                                $query_all_proyectos = "SELECT p.id, p.nombre, p.estado, p.monto_recaudado, p.costos, u.usuario as nombre_creador FROM proyectos p JOIN usuarios u ON p.id_usuario = u.id ORDER BY p.fecha_creacion DESC";
                                $result_all_proyectos = mysqli_query($conexion, $query_all_proyectos);
                                if ($result_all_proyectos && mysqli_num_rows($result_all_proyectos) > 0):
                                    while($proyecto = mysqli_fetch_assoc($result_all_proyectos)):
                            ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($proyecto['id']); ?></td>
                                    <td><?php echo htmlspecialchars($proyecto['nombre']); ?></td>
                                    <td><?php echo htmlspecialchars($proyecto['nombre_creador']); ?></td>
                                    <td>
                                        <form action="php/actualizar_estado_proyecto.php" method="POST">
                                            <input type="hidden" name="id_proyecto" value="<?php echo $proyecto['id']; ?>">
                                            <select name="nuevo_estado" onchange="this.form.submit()">
                                                <?php foreach ($estados_posibles as $estado): ?>
                                                    <option value="<?php echo $estado; ?>" <?php echo ($proyecto['estado'] == $estado) ? 'selected' : ''; ?>><?php echo $estado; ?></option>
                                                <?php endforeach; ?>
                                            </select>
                                        </form>
                                    </td>
                                    <td>$<?php echo number_format($proyecto['monto_recaudado'], 2); ?></td>
                                    <td>$<?php echo number_format($proyecto['costos'], 2); ?></td>
                                    <td class="acciones-proyectos">
                                        <a href="php/proyecto_detalle.php?id=<?php echo $proyecto['id']; ?>" class="btn-accion btn-ver">Ver</a>
                                        <a href="php/eliminar_proyecto.php?id=<?php echo $proyecto['id']; ?>" class="btn-accion btn-eliminar" onclick="return confirm('¿Estás seguro de que quieres eliminar este proyecto?');">Eliminar</a>
                                    </td>
                                </tr>
                            <?php
                                    endwhile;
                                else:
                            ?>
                                <tr><td colspan="7">No hay proyectos disponibles.</td></tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Statistics Tab -->
            <div id="estadisticas" class="tab-content">
                <div class="stats-grid">
                    <div class="stat-card"><h3>Total de Proyectos</h3><p class="stat-number"><?php echo $stats_data_admin['total_proyectos']; ?></p></div>
                    <div class="stat-card"><h3>Dinero Total Invertido</h3><p class="stat-number">$<?php echo number_format($stats_data_admin['total_invertido'], 2); ?></p></div>
                </div>
                <div class="charts-grid">
                    <div class="chart-container"><canvas id="usuariosPorRolChart"></canvas></div>
                    <div class="chart-container"><canvas id="proyectosPorEstadoChart"></canvas></div>
                </div>
            </div>

        </div>
    </main>

    <script>
    function openTab(evt, tabName) {
        const tabcontent = document.querySelectorAll(".tab-content");
        tabcontent.forEach(tab => tab.classList.remove('active'));

        const tablinks = document.querySelectorAll(".tab-link");
        tablinks.forEach(link => link.classList.remove('active'));

        document.getElementById(tabName).classList.add('active');
        
        if (evt) {
            evt.currentTarget.classList.add('active');
        } else {
            const activeLink = document.querySelector(`.tab-link[data-tab='${tabName}']`);
            if (activeLink) {
                activeLink.classList.add('active');
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        const tabLinks = document.querySelectorAll('.tab-link');
        tabLinks.forEach(link => {
            link.addEventListener('click', (event) => {
                openTab(event, link.dataset.tab);
            });
        });

        const defaultTabName = document.querySelector('.tab-link').dataset.tab;
        const tabNameToOpen = window.location.hash.substring(1) || defaultTabName;
        
        if (document.getElementById(tabNameToOpen)) {
            openTab(null, tabNameToOpen);
        } else {
            openTab(null, defaultTabName);
        }

        // Chart.js setup
        try {
            const usuariosData = <?php echo json_encode($stats_data_admin['usuarios_por_rol']); ?>;
            const proyectosData = <?php echo json_encode($stats_data_admin['proyectos_por_estado']); ?>;

            if (usuariosData && document.getElementById('usuariosPorRolChart')) {
                new Chart(document.getElementById('usuariosPorRolChart'), {
                    type: 'pie',
                    data: { labels: usuariosData.map(r => r.rol), datasets: [{ data: usuariosData.map(r => r.total), backgroundColor: ['#36a2eb', '#ff6384', '#ffce56', '#4bc0c0'] }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Distribución de Usuarios por Rol' } } }
                });
            }

            if (proyectosData && document.getElementById('proyectosPorEstadoChart')) {
                new Chart(document.getElementById('proyectosPorEstadoChart'), {
                    type: 'doughnut',
                    data: { labels: proyectosData.map(r => r.estado), datasets: [{ data: proyectosData.map(r => r.total), backgroundColor: ['#aed6f1', '#f9e79f', '#a9dfbf'] }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Estado Actual de los Proyectos' } } }
                });
            }
        } catch (e) {
            console.error("Error initializing charts:", e);
        }
        
        // SweetAlert notification
        <?php if (isset($_SESSION['swal'])): ?>
        Swal.fire({
            icon: "<?php echo $_SESSION['swal']['icon']; ?>",
            title: "<?php echo $_SESSION['swal']['title']; ?>",
            text: "<?php echo $_SESSION['swal']['text']; ?>",
            background: 'var(--card-bg)',
            color: 'var(--text-color)',
            confirmButtonColor: 'var(--primary-color)'
        });
        <?php unset($_SESSION['swal']); ?>
        <?php endif; ?>
    });
    </script>

</body>
</html>
