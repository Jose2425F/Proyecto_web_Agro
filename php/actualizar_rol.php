<?php
session_start();
include 'conexion_db.php';

// Verificar si el usuario tiene permisos de administrador
if (!isset($_SESSION['rol']) || !in_array($_SESSION['rol'], ['administrador', 'administradorsupremo'])) {
    $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Acceso Denegado', 'text' => 'No tienes permisos para realizar esta acción.'];
    header('Location: ../admin_panel.php');
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id_usuario_a_modificar = filter_input(INPUT_POST, 'id_usuario', FILTER_VALIDATE_INT);
    $nuevo_rol = filter_input(INPUT_POST, 'nuevo_rol', FILTER_SANITIZE_STRING);
    $id_admin_actual = $_SESSION['id_usuario'];
    $rol_admin_actual = $_SESSION['rol'];

    if (!$id_usuario_a_modificar || !$nuevo_rol) {
        $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Error', 'text' => 'Datos inválidos proporcionados.'];
        header('Location: ../admin_panel.php');
        exit();
    }

    // Un usuario no puede cambiar su propio rol
    if ($id_usuario_a_modificar == $id_admin_actual) {
        $_SESSION['swal'] = ['icon' => 'warning', 'title' => 'Acción no permitida', 'text' => 'No puedes cambiar tu propio rol.'];
        header('Location: ../admin_panel.php');
        exit();
    }

    // Obtener el rol actual del usuario a modificar
    $stmt_get_rol = mysqli_prepare($conexion, "SELECT rol FROM usuarios WHERE id = ?");
    mysqli_stmt_bind_param($stmt_get_rol, "i", $id_usuario_a_modificar);
    mysqli_stmt_execute($stmt_get_rol);
    $result = mysqli_stmt_get_result($stmt_get_rol);
    $rol_a_modificar = ($row = mysqli_fetch_assoc($result)) ? $row['rol'] : null;
    mysqli_stmt_close($stmt_get_rol);

    // Reglas de jerarquía para administradores
    if ($rol_admin_actual == 'administrador') {
        if (in_array($rol_a_modificar, ['administrador', 'administradorsupremo'])) {
            $_SESSION['swal'] = ['icon' => 'warning', 'title' => 'Permiso Denegado', 'text' => 'Un administrador no puede modificar a otros administradores o superiores.'];
            header('Location: ../admin_panel.php');
            exit();
        }
        if (in_array($nuevo_rol, ['administrador', 'administradorsupremo'])) {
            $_SESSION['swal'] = ['icon' => 'warning', 'title' => 'Permiso Denegado', 'text' => 'No puedes asignar roles de administrador o superior.'];
            header('Location: ../admin_panel.php');
            exit();
        }
    }

    // Validar que el nuevo rol sea uno de los permitidos
    $roles_permitidos = ['campesino', 'inversionista', 'administrador', 'administradorsupremo'];
    if (!in_array($nuevo_rol, $roles_permitidos)) {
        $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Error', 'text' => 'El rol seleccionado no es válido.'];
        header('Location: ../admin_panel.php');
        exit();
    }

    // Actualizar el rol en la base de datos
    $stmt = mysqli_prepare($conexion, "UPDATE usuarios SET rol = ? WHERE id = ?");
    mysqli_stmt_bind_param($stmt, "si", $nuevo_rol, $id_usuario_a_modificar);
    
    if (mysqli_stmt_execute($stmt)) {
        $_SESSION['swal'] = ['icon' => 'success', 'title' => '¡Éxito!', 'text' => 'El rol del usuario ha sido actualizado correctamente.'];
    } else {
        $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Error', 'text' => 'No se pudo actualizar el rol en la base de datos.'];
    }
    mysqli_stmt_close($stmt);

} else {
    $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Método no permitido', 'text' => 'Esta acción solo se puede realizar a través del formulario.'];
}

mysqli_close($conexion);
header('Location: ../admin_panel.php');
exit();
?>