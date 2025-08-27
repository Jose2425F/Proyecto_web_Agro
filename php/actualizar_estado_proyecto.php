<?php
session_start();
include 'conexion_db.php';

// Validar que el usuario sea administrador
if (!isset($_SESSION['usuario']) || !in_array($_SESSION['rol'], ['administrador', 'administradorsupremo'])) {
    $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Acceso Denegado', 'text' => 'No tienes permisos para realizar esta acción.'];
    header('Location: ../admin_panel.php');
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id_proyecto = filter_input(INPUT_POST, 'id_proyecto', FILTER_VALIDATE_INT);
    $nuevo_estado = filter_input(INPUT_POST, 'nuevo_estado', FILTER_SANITIZE_STRING);

    $estados_posibles = ['Buscando Inversión', 'En Progreso', 'Completado'];

    if (!$id_proyecto || !$nuevo_estado || !in_array($nuevo_estado, $estados_posibles)) {
        $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Error', 'text' => 'Datos inválidos proporcionados.'];
        header('Location: ../admin_panel.php');
        exit();
    }

    // Actualizar el estado del proyecto en la base de datos
    $stmt = $conexion->prepare("UPDATE proyectos SET estado = ? WHERE id = ?");
    $stmt->bind_param("si", $nuevo_estado, $id_proyecto);

    if ($stmt->execute()) {
        $_SESSION['swal'] = ['icon' => 'success', 'title' => '¡Éxito!', 'text' => 'El estado del proyecto ha sido actualizado correctamente.'];
    } else {
        $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Error', 'text' => 'No se pudo actualizar el estado del proyecto.'];
    }
    $stmt->close();

} else {
    $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Método no permitido', 'text' => 'Esta acción solo se puede realizar a través del formulario.'];
}

mysqli_close($conexion);
header('Location: ../admin_panel.php#proyectos'); // Redirige de vuelta a la pestaña de proyectos
exit();
?>