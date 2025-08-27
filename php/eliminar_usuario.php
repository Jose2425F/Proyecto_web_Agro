<?php
session_start();
include 'conexion_db.php';

// Default redirection location
$redirect_location = '../configuracion.php#admin-panel-container';

// Check for admin privileges
if (!isset($_SESSION['rol']) || !in_array($_SESSION['rol'], ['administrador', 'administradorsupremo'])) {
    $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Acceso Denegado', 'text' => 'No tienes permisos.'];
    header('Location: ../configuracion.php'); // Redirect to main config if not admin
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id_usuario_a_eliminar = filter_input(INPUT_POST, 'id_usuario', FILTER_VALIDATE_INT);

    if (!$id_usuario_a_eliminar) {
        $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Error', 'text' => 'ID de usuario no válido.'];
    } elseif ($id_usuario_a_eliminar == $_SESSION['id_usuario']) {
        $_SESSION['swal'] = ['icon' => 'warning', 'title' => 'Acción no permitida', 'text' => 'No puedes eliminar tu propia cuenta.'];
    } else {
        // Get role of the user to be deleted for hierarchy check
        $stmt_get_rol = mysqli_prepare($conexion, "SELECT rol FROM usuarios WHERE id = ?");
        mysqli_stmt_bind_param($stmt_get_rol, "i", $id_usuario_a_eliminar);
        mysqli_stmt_execute($stmt_get_rol);
        $rol_a_eliminar = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt_get_rol))['rol'];
        mysqli_stmt_close($stmt_get_rol);

        if ($_SESSION['rol'] == 'administrador' && $rol_a_eliminar == 'administradorsupremo') {
            $_SESSION['swal'] = ['icon' => 'warning', 'title' => 'Permiso Denegado', 'text' => 'Un administrador no puede eliminar a un Administrador Supremo.'];
        } else {
            // Proceed with deletion
            $stmt = mysqli_prepare($conexion, "DELETE FROM usuarios WHERE id = ?");
            mysqli_stmt_bind_param($stmt, "i", $id_usuario_a_eliminar);
            if (mysqli_stmt_execute($stmt)) {
                $_SESSION['swal'] = ['icon' => 'success', 'title' => '¡Éxito!', 'text' => 'Usuario eliminado correctamente.'];
            } else {
                $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Error', 'text' => 'No se pudo eliminar el usuario.'];
            }
            mysqli_stmt_close($stmt);
        }
    }
} else {
    $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Error', 'text' => 'Método de solicitud no permitido.'];
}

mysqli_close($conexion);
header("Location: $redirect_location");
exit();
?>
