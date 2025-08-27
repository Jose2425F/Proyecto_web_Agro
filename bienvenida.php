<?php
session_start();
include 'php/conexion_db.php';

if (!isset($_SESSION['usuario'])) {
    echo '<script>window.location = "index.php";</script>';
    session_destroy();
    die();
}

$es_admin = isset($_SESSION['rol']) && in_array($_SESSION['rol'], ['administrador', 'administradorsupremo']);
$es_campesino = isset($_SESSION['rol']) && $_SESSION['rol'] == 'campesino';

// Modificamos la consulta para incluir el estado del proyecto
$query_proyectos = "SELECT p.id, p.nombre, p.descripcion, p.monto_recaudado, p.costos, p.estado, u.nombre as nombre_creador, p.imagen_url FROM proyectos p JOIN usuarios u ON p.id_usuario = u.id ORDER BY p.fecha_creacion DESC LIMIT 6";
$resultado_proyectos = mysqli_query($conexion, $query_proyectos);

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido - AgroColombia</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/dashboard.css?v=1.8">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <style>
        .welcome-hero {
            background: var(--card-bg);
            color: var(--text-color);
            padding: 2.5rem;
            border-radius: 12px;
            margin-bottom: 2.5rem;
            border: 1px solid var(--border-color);
            text-align: center; /* Added this line to center the text */
        }
        .welcome-hero h2 { font-size: 2.2rem; font-weight: 700; }
        .welcome-hero p { font-size: 1.1rem; color: var(--text-muted); margin-top: 0.5rem; }
        .section-title { font-size: 1.8rem; font-weight: 600; color: var(--text-color); margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--border-color); }

        .proyectos-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; }

        .proyecto-card { background-color: var(--card-bg); border-radius: 12px; overflow: hidden; border: 1px solid var(--border-color); display: flex; flex-direction: column; transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .proyecto-card:hover { transform: translateY(-5px); box-shadow: 0 12px 28px rgba(0,0,0,0.08); }
        
        .proyecto-card-img { width: 100%; height: 200px; overflow: hidden; position: relative; }
        .proyecto-card-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease; }
        .proyecto-card:hover .proyecto-card-img img { transform: scale(1.05); }

        .estado-proyecto-badge {
            position: absolute;
            top: 1rem;
            right: 1rem;
            padding: 0.4rem 0.8rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 600;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            z-index: 10;
        }
        .estado-buscando-inversion {
            background-color: #3498db;
            animation: pulse 2s infinite;
        }
        .estado-en-progreso { background-color: #f1c40f; }
        .estado-completado { background-color: #2ecc71; }

        @keyframes pulse {
            0% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.7);
            }
            70% {
                transform: scale(1);
                box-shadow: 0 0 0 10px rgba(52, 152, 219, 0);
            }
            100% {
                transform: scale(1);
                box-shadow: 0 0 0 0 rgba(52, 152, 219, 0);
            }
        }

        .estado-buscando-inversion {
            background-color: #3498db; /* Solid background color */
            animation: pulse 2s infinite;
            transform-origin: center;
        }

        .proyecto-card-content { padding: 1.25rem; display: flex; flex-direction: column; flex-grow: 1; }
        .proyecto-card-content h4 { font-size: 1.2rem; font-weight: 600; margin-bottom: 0.5rem; }
        .proyecto-card-content .creador { font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem; }
        .proyecto-card-content p { font-size: 0.95rem; flex-grow: 1; margin-bottom: 1rem; }
        .progreso { margin-bottom: 0.5rem; }
        .meta { font-size: 0.9rem; display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
        .btn-card { width: 100%; text-align: center; margin-top: auto; }
    </style>
</head>
<body>
    <header class="dashboard-header">
        <div class="logo"><h1>AgroColombia</h1></div>
        <nav class="dashboard-nav">
            <ul>
                <li><a href="bienvenida.php" class="active">Inicio</a></li>
                <?php if ($es_campesino): ?>
                    <li><a href="php/crear_proyecto.php">Crear Proyecto</a></li>
                    <li><a href="php/mis_proyectos.php">Mis Proyectos</a></li>
                <?php endif; ?>
                <li><a href="estadisticas.php">Estadísticas</a></li>
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

            <div class="welcome-hero">
                <h2>Bienvenido de nuevo, <?php echo htmlspecialchars($_SESSION['usuario']); ?>!</h2>
                <p>Tu rol es: <strong><?php echo htmlspecialchars(ucfirst($_SESSION['rol'])); ?></strong>. Explora las oportunidades y gestiona tus actividades.</p>
            </div>
            
            

            <div class="proyectos-recientes">
                <h3 class="section-title">Proyectos Recientes</h3>
                <div class="proyectos-grid">
                    <?php if ($resultado_proyectos && mysqli_num_rows($resultado_proyectos) > 0): ?>
                        <?php while($proyecto = mysqli_fetch_assoc($resultado_proyectos)):
                            $porcentaje = ($proyecto['costos'] > 0) ? min(100, ($proyecto['monto_recaudado'] / $proyecto['costos']) * 100) : 0;
                            $estado_clase = 'estado-' . strtolower(str_replace(' ', '-', $proyecto['estado']));
                        ?>
                            <div class="proyecto-card">
                                <div class="proyecto-card-img">
                                    <span class="estado-proyecto-badge <?php echo $estado_clase; ?>"><?php echo htmlspecialchars($proyecto['estado']); ?></span>
                                    <a href="php/proyecto_detalle.php?id=<?php echo $proyecto['id']; ?>">
                                        <img src="<?php echo !empty($proyecto['imagen_url']) ? htmlspecialchars($proyecto['imagen_url']) : 'assets/img/fondo_1.jpg'; ?>" alt="Imagen del Proyecto">
                                    </a>
                                </div>
                                <div class="proyecto-card-content">
                                    <h4><?php echo htmlspecialchars($proyecto['nombre']); ?></h4>
                                    <p class="creador">Por: <?php echo htmlspecialchars($proyecto['nombre_creador']); ?></p>
                                    <p><?php echo substr(htmlspecialchars($proyecto['descripcion']), 0, 90); ?>...</p>
                                    <div class="progreso">
                                        <div class="progreso-barra" style="width: <?php echo $porcentaje; ?>%;"></div>
                                    </div>
                                    <div class="meta">
                                        <span><strong>$<?php echo number_format($proyecto['monto_recaudado'], 0); ?></strong></span>
                                        <span>de $<?php echo number_format($proyecto['costos'], 0); ?></span>
                                    </div>
                                    <a href="php/proyecto_detalle.php?id=<?php echo $proyecto['id']; ?>" class="btn-card">Ver Proyecto</a>
                                </div>
                            </div>
                        <?php endwhile; ?>
                    <?php else:
                    ?>
                        <div class="card" style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
                            <h4>No hay proyectos disponibles</h4>
                            <p>Aún no se han creado proyectos en la plataforma. ¡Vuelve pronto para ver nuevas oportunidades!</p>
                        </div>
                    <?php endif; ?>
                </div>
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
