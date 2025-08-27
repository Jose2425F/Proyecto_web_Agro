<?php
session_start();
include 'conexion_db.php';

// Validar que el usuario haya iniciado sesión y sea un campesino
if (!isset($_SESSION['usuario']) || $_SESSION['rol'] != 'campesino') {
    header("Location: ../index.php");
    exit();
}

$id_usuario = $_SESSION['id_usuario'];
$es_admin = isset($_SESSION['rol']) && in_array($_SESSION['rol'], ['administrador', 'administradorsupremo']);
$es_campesino = true; // User is always a campesino on this page

// Consulta para obtener los proyectos del usuario
$query_proyectos = "SELECT id, nombre, estado, costos, monto_recaudado, fecha_creacion FROM proyectos WHERE id_usuario = ? ORDER BY fecha_creacion DESC";
$stmt = $conexion->prepare($query_proyectos);
$stmt->bind_param("i", $id_usuario);
$stmt->execute();
$resultado_proyectos = $stmt->get_result();

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mis Proyectos - AgroColombia</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/dashboard.css?v=1.8">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .page-header h2 { font-size: 2rem; font-weight: 700; color: var(--text-color); }
        .btn-new-project { background-color: var(--primary-color); color: #fff; padding: 0.8rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background-color 0.3s ease; }
        .btn-new-project:hover { background-color: var(--secondary-color); }

        .my-projects-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; }

        .my-project-card { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; transition: box-shadow 0.3s ease; }
        .my-project-card:hover { box-shadow: 0 8px 25px rgba(0,0,0,0.08); }

        .my-project-card h4 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
        .project-meta-info { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem; }

        .estado-proyecto {
            display: inline-block;
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 1rem;
            color: #fff;
        }
        .estado-buscando-inversion { background-color: #3498db; }
        .estado-en-progreso { background-color: #f1c40f; }
        .estado-completado { background-color: #2ecc71; }

        .progreso-info { margin-top: 1rem; }
        .card-actions { margin-top: 1.5rem; display: flex; gap: 0.75rem; }
        .btn-accion { flex-grow: 1; text-align: center; padding: 0.6rem 1rem; border-radius: 6px; text-decoration: none; font-weight: 500; transition: all 0.3s ease; }
        .btn-editar { background-color: var(--primary-color-light); color: var(--primary-color); }
        .btn-editar:hover { background-color: var(--primary-color); color: #fff; }
        .btn-eliminar { background-color: #fde8e6; color: #e74c3c; }
        .btn-eliminar:hover { background-color: #e74c3c; color: #fff; }

        .no-projects-card { grid-column: 1 / -1; text-align: center; padding: 3rem; background-color: var(--card-bg); border: 2px dashed var(--border-color); border-radius: 12px; }
        .no-projects-card h4 { font-size: 1.5rem; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <header class="dashboard-header">
        <div class="logo"><h1>AgroColombia</h1></div>
        <nav class="dashboard-nav">
            <ul>
                <li><a href="../bienvenida.php">Inicio</a></li>
                <?php if ($es_campesino): ?>
                    <li><a href="crear_proyecto.php">Crear Proyecto</a></li>
                    <li><a href="mis_proyectos.php" class="active">Mis Proyectos</a></li>
                <?php endif; ?>
                <li><a href="../estadisticas.php">Estadísticas</a></li>
                <li><a href="../configuracion.php">Configuración</a></li>
                <?php if ($es_admin): ?>
                    <li><a href="../admin_panel.php">Admin</a></li>
                <?php endif; ?>
                <li><a href="cerrarsesion.php">Cerrar Sesión</a></li>
            </ul>
        </nav>
    </header>

    <main class="dashboard-main">
        <div class="dashboard-container">
            <div class="page-header">
                <h2>Mis Proyectos</h2>
                <a href="crear_proyecto.php" class="btn-new-project">Crear Nuevo Proyecto</a>
            </div>
            
            <div class="my-projects-grid">
                <?php if ($resultado_proyectos && $resultado_proyectos->num_rows > 0): ?>
                    <?php while($proyecto = $resultado_proyectos->fetch_assoc()): 
                        $porcentaje = ($proyecto['costos'] > 0) ? min(100, ($proyecto['monto_recaudado'] / $proyecto['costos']) * 100) : 0;
                        $estado_clase = 'estado-' . strtolower(str_replace(' ', '-', $proyecto['estado']));
                    ?>
                        <div class="my-project-card">
                            <span class="estado-proyecto <?php echo $estado_clase; ?>"><?php echo htmlspecialchars($proyecto['estado']); ?></span>
                            <h4><?php echo htmlspecialchars($proyecto['nombre']); ?></h4>
                            <p class="project-meta-info">Creado el: <?php echo date("d/m/Y", strtotime($proyecto['fecha_creacion'])); ?></p>
                            
                            <div class="progreso-info">
                                <div class="progreso">
                                    <div class="progreso-barra" style="width: <?php echo $porcentaje; ?>%;"></div>
                                </div>
                                <div class="meta">
                                    <span><strong>$<?php echo number_format($proyecto['monto_recaudado'], 0); ?></strong> de $<?php echo number_format($proyecto['costos'], 0); ?></span>
                                </div>
                            </div>

                            <div class="card-actions">
                                <a href="editar_proyecto.php?id=<?php echo $proyecto['id']; ?>" class="btn-accion btn-editar">Editar</a>
                                <a href="eliminar_proyecto.php?id=<?php echo $proyecto['id']; ?>" class="btn-accion btn-eliminar" onclick="return confirm('¿Estás seguro de que quieres eliminar este proyecto?');">Eliminar</a>
                            </div>
                        </div>
                    <?php endwhile; ?>
                <?php else: ?>
                    <div class="no-projects-card">
                        <h4>Aún no tienes proyectos</h4>
                        <p>¡Es un buen momento para empezar! Haz clic en el botón para crear tu primer proyecto.</p>
                        <a href="crear_proyecto.php" class="btn-new-project" style="margin-top: 1rem;">Crear Nuevo Proyecto</a>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </main>

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
        <?php unset($_SESSION['swal']); ?>
    </script>
    <?php endif; ?>

</body>
</html>
