<?php
session_start();
include 'conexion_db.php';

// Validar que el usuario haya iniciado sesión y sea un campesino
if (!isset($_SESSION['usuario']) || $_SESSION['rol'] != 'campesino') {
    header("Location: ../index.php");
    exit();
}

$id_usuario = $_SESSION['id_usuario'];

// Validar ID del proyecto
if (!isset($_GET['id']) || !filter_var($_GET['id'], FILTER_VALIDATE_INT)) {
    header("Location: mis_proyectos.php");
    exit();
}
$id_proyecto = $_GET['id'];

// (Opcional pero recomendado) Verificar que el proyecto realmente pertenece al usuario antes de borrar
$query_check = "SELECT imagen_url FROM proyectos WHERE id = ? AND id_usuario = ?";
$stmt_check = $conexion->prepare($query_check);
$stmt_check->bind_param("ii", $id_proyecto, $id_usuario);
$stmt_check->execute();
$result_check = $stmt_check->get_result();

if ($result_check->num_rows > 0) {
    $proyecto = $result_check->fetch_assoc();

    // Eliminar la imagen del servidor si existe
    if (!empty($proyecto['imagen_url']) && file_exists("../" . $proyecto['imagen_url'])) {
        unlink("../" . $proyecto['imagen_url']);
    }

    // Proceder a eliminar el proyecto de la base de datos
    $query_delete = "DELETE FROM proyectos WHERE id = ? AND id_usuario = ?";
    $stmt_delete = $conexion->prepare($query_delete);
    $stmt_delete->bind_param("ii", $id_proyecto, $id_usuario);

    if ($stmt_delete->execute()) {
        $_SESSION['swal'] = [
            'icon' => 'success',
            'title' => 'Eliminado',
            'text' => 'El proyecto ha sido eliminado correctamente.'
        ];
    } else {
        $_SESSION['swal'] = [
            'icon' => 'error',
            'title' => 'Error',
            'text' => 'No se pudo eliminar el proyecto.'
        ];
    }
} else {
    $_SESSION['swal'] = [
        'icon' => 'error',
        'title' => 'Error',
        'text' => 'No tienes permiso para realizar esta acción.'
    ];
}

header("Location: mis_proyectos.php");
exit();
?>
