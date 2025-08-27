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
$es_campesino = true;

// Validar ID del proyecto
if (!isset($_GET['id']) || !filter_var($_GET['id'], FILTER_VALIDATE_INT)) {
    header("Location: mis_proyectos.php");
    exit();
}
$id_proyecto = $_GET['id'];

// Obtener datos del proyecto y verificar propiedad
$query_proyecto = "SELECT * FROM proyectos WHERE id = ? AND id_usuario = ?";
$stmt = $conexion->prepare($query_proyecto);
$stmt->bind_param("ii", $id_proyecto, $id_usuario);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows == 0) {
    header("Location: mis_proyectos.php");
    exit();
}
$proyecto = $resultado->fetch_assoc();

// Procesar el formulario de actualización
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nombre = $_POST['nombre'];
    $descripcion = $_POST['descripcion'];
    $costos = $_POST['costos'];
    $produccion_estimada = $_POST['produccion_estimada'];
    $imagen_url = $proyecto['imagen_url'];

    if (isset($_FILES['imagen']) && $_FILES['imagen']['error'] == 0) {
        $target_dir = "../assets/img/proyectos/";
        if (!is_dir($target_dir)) {
            mkdir($target_dir, 0777, true);
        }
        $target_file = $target_dir . basename($_FILES["imagen"]["name"]);
        $imageFileType = strtolower(pathinfo($target_file, PATHINFO_EXTENSION));

        if (!in_array($imageFileType, ['jpg', 'png', 'jpeg'])) {
            $error = "Solo se permiten archivos JPG, JPEG y PNG.";
        } else {
            if (move_uploaded_file($_FILES["imagen"]["tmp_name"], $target_file)) {
                $imagen_url = "assets/img/proyectos/" . basename($_FILES["imagen"]["name"]);
            } else {
                $error = "Hubo un error al subir la nueva imagen.";
            }
        }
    }

    if (!isset($error)) {
        $query_update = "UPDATE proyectos SET nombre = ?, descripcion = ?, costos = ?, produccion_estimada = ?, imagen_url = ? WHERE id = ? AND id_usuario = ?";
        $stmt_update = $conexion->prepare($query_update);
        $stmt_update->bind_param("ssdssii", $nombre, $descripcion, $costos, $produccion_estimada, $imagen_url, $id_proyecto, $id_usuario);

        if ($stmt_update->execute()) {
            $_SESSION['swal'] = ['icon' => 'success', 'title' => '¡Éxito!', 'text' => 'Proyecto actualizado correctamente.'];
            header("Location: mis_proyectos.php");
            exit();
        } else {
            $error = "Error al actualizar el proyecto: " . $stmt_update->error;
        }
    }
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editar Proyecto - AgroColombia</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../assets/css/dashboard.css?v=1.8">
    <style>
        .form-container {
            max-width: 800px;
            margin: 2rem auto;
            padding: 2.5rem;
            background-color: var(--card-bg);
            border: 1px solid var(--border-color);
            border-radius: 12px;
        }
        .form-header h2 {
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        .form-header p {
            color: var(--text-muted);
            margin-bottom: 2rem;
        }
        .form-group {
            margin-bottom: 1.5rem;
        }
        .form-group label {
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        .form-group input[type="text"], 
        .form-group input[type="number"], 
        .form-group textarea {
            width: 100%;
            padding: 0.8rem 1rem;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background-color: var(--input-bg);
            color: var(--text-color);
            font-family: 'Poppins', sans-serif;
            transition: border-color 0.3s ease;
        }
        .form-group input:focus, .form-group textarea:focus {
            outline: none;
            border-color: var(--primary-color);
        }
        .form-group textarea { min-height: 120px; resize: vertical; }

        .image-preview-group {
            display: flex;
            gap: 2rem;
            align-items: flex-start;
        }
        .current-image-preview {
            text-align: center;
        }
        .current-image-preview img {
            max-width: 150px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }
        .current-image-preview p { font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem; }

        .btn-submit {
            width: 100%;
            padding: 1rem;
            font-size: 1.1rem;
            font-weight: 600;
        }
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
            <div class="form-container">
                <div class="form-header">
                    <h2>Editar Proyecto</h2>
                    <p>Modifica los detalles de tu proyecto. Los cambios se guardarán al hacer clic en el botón de abajo.</p>
                </div>

                <?php if (isset($error)): ?>
                    <div class="alerta-error"><?php echo $error; ?></div>
                <?php endif; ?>

                <form action="editar_proyecto.php?id=<?php echo $id_proyecto; ?>" method="POST" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="nombre">Nombre del Proyecto</label>
                        <input type="text" id="nombre" name="nombre" value="<?php echo htmlspecialchars($proyecto['nombre']); ?>" required>
                    </div>
                    <div class="form-group">
                        <label for="descripcion">Descripción Detallada</label>
                        <textarea id="descripcion" name="descripcion" rows="6" required><?php echo htmlspecialchars($proyecto['descripcion']); ?></textarea>
                    </div>
                    <div class="form-group">
                        <label for="costos">Costos Totales (COP)</label>
                        <input type="number" id="costos" name="costos" step="0.01" value="<?php echo htmlspecialchars($proyecto['costos']); ?>" required>
                    </div>
                    <div class="form-group">
                        <label for="produccion_estimada">Producción Estimada (Ej: 1000 kg de café)</label>
                        <input type="text" id="produccion_estimada" name="produccion_estimada" value="<?php echo htmlspecialchars($proyecto['produccion_estimada']); ?>" required>
                    </div>
                    <div class="form-group image-preview-group">
                        <?php if (!empty($proyecto['imagen_url'])): ?>
                        <div class="current-image-preview">
                            <img src="../<?php echo htmlspecialchars($proyecto['imagen_url']); ?>" alt="Imagen actual">
                            <p>Imagen actual</p>
                        </div>
                        <?php endif; ?>
                        <div style="flex-grow: 1;">
                            <label for="imagen">Reemplazar Imagen (Opcional)</label>
                            <input type="file" id="imagen" name="imagen" accept="image/png, image/jpeg" class="input-file">
                        </div>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn-submit">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    </main>
</body>
</html>