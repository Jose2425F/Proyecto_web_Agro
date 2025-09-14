<?php
session_start();
include 'conexion_db.php';

if (!isset($_SESSION['usuario'])) {
    header('Location: ../index.php');
    exit();
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $id_usuario = $_SESSION['id_usuario'];
    $nombre = $_POST['nombre'];
    $email = $_POST['email'];
    $usuario = $_POST['usuario'];
    $password = $_POST['password'];

    // Fetch current user data to check for changes
    $stmt_user = mysqli_prepare($conexion, "SELECT nombre, email, usuario FROM usuarios WHERE id = ?");
    mysqli_stmt_bind_param($stmt_user, "i", $id_usuario);
    mysqli_stmt_execute($stmt_user);
    $user_data = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt_user));
    mysqli_stmt_close($stmt_user);

    $update_fields = [];
    $bind_params = "";
    $bind_values = [];

    if ($user_data['nombre'] !== $nombre) { $update_fields[] = "nombre = ?"; $bind_params .= "s"; $bind_values[] = $nombre; }
    if ($user_data['email'] !== $email) { $update_fields[] = "email = ?"; $bind_params .= "s"; $bind_values[] = $email; }
    if ($user_data['usuario'] !== $usuario) { $update_fields[] = "usuario = ?"; $bind_params .= "s"; $bind_values[] = $usuario; }
    if (!empty($password)) { $update_fields[] = "password = ?"; $bind_params .= "s"; $bind_values[] = $password; }

    if (!empty($update_fields)) {
        $query_update = "UPDATE usuarios SET " . implode(", ", $update_fields) . " WHERE id = ?";
        $bind_params .= "i";
        $bind_values[] = $id_usuario;

        $stmt_update = mysqli_prepare($conexion, $query_update);
        mysqli_stmt_bind_param($stmt_update, $bind_params, ...$bind_values);

        if (mysqli_stmt_execute($stmt_update)) {
            $_SESSION['swal'] = ['icon' => 'success', 'title' => '¡Éxito!', 'text' => 'Perfil actualizado correctamente.'];
            if ($user_data['nombre'] !== $nombre) { $_SESSION['usuario'] = $nombre; }
        } else {
            $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Error', 'text' => 'No se pudo actualizar el perfil.'];
        }
        mysqli_stmt_close($stmt_update);
    } else {
        $_SESSION['swal'] = ['icon' => 'info', 'title' => 'Sin cambios', 'text' => 'No se realizó ninguna modificación.'];
    }
} else {
    $_SESSION['swal'] = ['icon' => 'error', 'title' => 'Error', 'text' => 'Método no permitido.'];
}

mysqli_close($conexion);
header('Location: ../configuracion.php#profile-form-container');
exit();
?>
