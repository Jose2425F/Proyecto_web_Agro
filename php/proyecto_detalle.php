<?php
session_start();
include 'conexion_db.php';

if (!isset($_SESSION['usuario'])) {
    echo '<script>window.location = "../index.php";</script>';
    session_destroy();
    die();
}

$id_usuario_actual = $_SESSION['id_usuario'];

if (!isset($_GET['id']) || !filter_var($_GET['id'], FILTER_VALIDATE_INT)) {
    header("Location: ../bienvenida.php");
    exit();
}

$id_proyecto = $_GET['id'];

// Obtener datos del proyecto
$query = "SELECT p.*, u.nombre AS nombre_creador, u.email AS email_creador FROM proyectos p JOIN usuarios u ON p.id_usuario = u.id WHERE p.id = ?";
$stmt = $conexion->prepare($query);
$stmt->bind_param("i", $id_proyecto);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows == 0) {
    echo "Proyecto no encontrado.";
    exit();
}
$proyecto = $resultado->fetch_assoc();

// Verificar si el usuario actual ya le dio like a este proyecto
$query_like_check = "SELECT id FROM proyecto_likes WHERE id_usuario = ? AND id_proyecto = ?";
$stmt_like_check = $conexion->prepare($query_like_check);
$stmt_like_check->bind_param("ii", $id_usuario_actual, $id_proyecto);
$stmt_like_check->execute();
$usuario_ya_dio_like = $stmt_like_check->get_result()->num_rows > 0;

$es_admin = isset($_SESSION['rol']) && in_array($_SESSION['rol'], ['administrador', 'administradorsupremo']);

?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($proyecto['nombre']); ?> - AgroColombia</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/dashboard.css?v=1.5">
    <style>
        .proyecto-detalle-grid { display: grid; grid-template-columns: 1fr; gap: 2.5rem; margin-top: 1.5rem; }
        @media (min-width: 992px) { .proyecto-detalle-grid { grid-template-columns: 1fr 1fr; } }
        .proyecto-img-container { border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .proyecto-img-container img { width: 100%; height: auto; display: block; }
        .proyecto-info-container h2 { font-size: 2.25rem; font-weight: 700; color: var(--text-color); margin-bottom: 0.5rem; }
        .creador-info { font-size: 1rem; color: var(--text-muted); margin-bottom: 1rem; }
        
        .estado-proyecto-badge { display: inline-block; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1rem; }
        .estado-buscando-inversion { background-color: #3498db; animation: pulse 2s infinite; }
        .estado-en-progreso { background-color: #f1c40f; }
        .estado-completado { background-color: #2ecc71; }

        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(52, 152, 219, 0); } 100% { box-shadow: 0 0 0 0 rgba(52, 152, 219, 0); } }

        .info-section { margin-top: 2rem; }
        .info-section h3 { font-size: 1.25rem; font-weight: 600; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; margin-bottom: 1rem; }
        .datos-clave { list-style: none; padding: 0; }
        .datos-clave li { display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); }
        .datos-clave li:last-child { border-bottom: none; }
        .datos-clave strong { color: var(--text-color); }

        .progreso-detalle { background-color: var(--border-color); border-radius: 20px; height: 10px; overflow: hidden; margin: 1rem 0 0.5rem; }
        .progreso-barra { height: 100%; background-color: var(--primary-color); border-radius: 20px; }
        .meta-detalle { display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-muted); }
        .acciones-proyecto { margin-top: 2rem; display: flex; gap: 1rem; }
        .btn-accion { padding: 0.8rem 1.5rem; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
        .btn-invertir { background-color: var(--primary-color); color: #fff; }
        
        .btn-like {
            background-color: transparent;
            border: 2px solid var(--primary-color);
            color: var(--primary-color);
        }
        .btn-like.liked {
            background-color: var(--primary-color);
            color: #fff;
        }

    </style>
</head>
<body>
    <header class="dashboard-header">
        <div class="logo"><h1>AgroColombia</h1></div>
        <nav class="dashboard-nav">
            <ul>
                <li><a href="../bienvenida.php">Inicio</a></li>
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
            <div class="proyecto-detalle-grid">
                <div class="proyecto-img-container">
                    <img src="../<?php echo !empty($proyecto['imagen_url']) ? htmlspecialchars($proyecto['imagen_url']) : '../assets/img/fondo_1.jpg'; ?>" alt="Imagen del Proyecto">
                </div>
                <div class="proyecto-info-container">
                    <?php 
                        $estado_clase = 'estado-' . strtolower(str_replace(' ', '-', $proyecto['estado']));
                    ?>
                    <span class="estado-proyecto-badge <?php echo $estado_clase; ?>"><?php echo htmlspecialchars($proyecto['estado']); ?></span>
                    <h2><?php echo htmlspecialchars($proyecto['nombre']); ?></h2>
                    <p class="creador-info">Por <strong><?php echo htmlspecialchars($proyecto['nombre_creador']); ?></strong></p>

                    <div class="info-section">
                        <h3>Descripción</h3>
                        <p><?php echo nl2br(htmlspecialchars($proyecto['descripcion'])); ?></p>
                    </div>

                    <div class="info-section">
                        <h3>Financiamiento</h3>
                        <div class="progreso-detalle">
                            <div class="progreso-barra" style="width: <?php echo ($proyecto['costos'] > 0) ? min(100, ($proyecto['monto_recaudado'] / $proyecto['costos']) * 100) : 0; ?>%;"></div>
                        </div>
                        <div class="meta-detalle">
                            <span>Recaudado: <strong>$<?php echo number_format($proyecto['monto_recaudado'], 0); ?></strong></span>
                            <span>Meta: <strong>$<?php echo number_format($proyecto['costos'], 0); ?></strong></span>
                        </div>
                    </div>

                    <div class="info-section">
                        <h3>Datos Clave</h3>
                        <ul class="datos-clave">
                            <li><span>Producción Estimada</span><strong><?php echo htmlspecialchars($proyecto['produccion_estimada']); ?></strong></li>
                            <li><span>Fecha de Creación</span><strong><?php echo date("d/m/Y", strtotime($proyecto['fecha_creacion'])); ?></strong></li>
                            <li><span>Likes</span><strong class="likes-count"><?php echo $proyecto['likes_count']; ?></strong></li>
                        </ul>
                    </div>

                    <div class="acciones-proyecto">
                        <?php if (isset($_SESSION['rol']) && $_SESSION['rol'] == 'inversionista' && $proyecto['estado'] == 'Buscando Inversión'): ?>
                            <button class="btn-accion btn-invertir">Invertir</button>
                        <?php endif; ?>
                        <button class="btn-accion btn-like <?php echo $usuario_ya_dio_like ? 'liked' : ''; ?>" data-id="<?php echo $proyecto['id']; ?>">
                            <?php echo $usuario_ya_dio_like ? 'No me gusta' : 'Me gusta'; ?>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
<script>
document.addEventListener('DOMContentLoaded', function() {
    const likeButton = document.querySelector('.btn-like');
    if (likeButton) {
        likeButton.addEventListener('click', function() {
            const proyectoId = this.dataset.id;
            fetch('like_proyecto.php', { method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: 'id_proyecto=' + proyectoId })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    document.querySelector('.likes-count').textContent = data.new_likes_count;
                    likeButton.textContent = data.action === 'liked' ? 'No me gusta' : 'Me gusta';
                    likeButton.classList.toggle('liked');
                    // No mostraremos un pop-up para no ser intrusivos, el cambio en el botón es suficiente feedback.
                } else {
                    Swal.fire({ icon: 'error', title: 'Error', text: data.message, background: 'var(--card-bg)', color: 'var(--text-color)' });
                }
            }).catch(() => Swal.fire({ icon: 'error', title: 'Error de Conexión', text: 'No se pudo conectar con el servidor.' }));
        });
    }

    const invertirButton = document.querySelector('.btn-invertir');
    if (invertirButton) {
        invertirButton.addEventListener('click', function() {
            Swal.fire({
                title: 'Invertir en Proyecto',
                html: `<input type="number" id="swal-input-monto" class="swal2-input" placeholder="Monto a invertir (COP)">`,
                confirmButtonText: 'Invertir',
                focusConfirm: false,
                background: 'var(--card-bg)',
                color: 'var(--text-color)',
                preConfirm: () => {
                    const monto = document.getElementById('swal-input-monto').value;
                    if (!monto || monto <= 0) {
                        Swal.showValidationMessage(`Por favor, ingrese un monto válido`);
                    }
                    return { monto: monto };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const { monto } = result.value;
                    const proyectoId = <?php echo $id_proyecto; ?>;
                    fetch('invertir_proyecto.php', { method: 'POST', headers: {'Content-Type': 'application/x-www-form-urlencoded'}, body: `id_proyecto=${proyectoId}&monto=${monto}` })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            Swal.fire({icon: 'success', title: '¡Inversión Exitosa!', text: data.message}).then(() => window.location.reload());
                        } else {
                            Swal.fire({icon: 'error', title: 'Error en la Inversión', text: data.message});
                        }
                    }).catch(() => Swal.fire({ icon: 'error', title: 'Error de Conexión', text: 'No se pudo conectar con el servidor.' }));
                }
            });
        });
    }
});
</script>
</body>
</html>