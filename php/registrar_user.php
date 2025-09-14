<?php
// Formulario y lógica para que un usuario pueda crear una cuenta (campesino, inversionista).
include 'conexion_db.php';

// Iniciar sesión para usar SweetAlert2 en el lado del cliente
session_start();

$nombre_completo = $_POST["nombreCompleto"];
$CorreoElectronico = $_POST["CorreoElectronico"];
$UsuarioRegistro = $_POST["UsuarioRegistro"];
$ContrasenaUser = $_POST["ContrasenaUser"];
$rol = $_POST["rol"];

// Guardar los datos del formulario en la sesión para repoblar en caso de error
$_SESSION['form_data'] = $_POST;
$_SESSION['form_type'] = 'register';

// Validar que todos los campos estén presentes y no vacíos
if (empty($nombre_completo) || empty($CorreoElectronico) || empty($UsuarioRegistro) || empty($ContrasenaUser) || empty($rol)) {
    $_SESSION['swal'] = [
        'icon' => 'error',
        'title' => 'Campos Vacíos',
        'text' => 'Por favor, completa todos los campos.'
    ];
    header("location: ../index.php");
    exit();
}

// Validar el formato del correo electrónico
if (!filter_var($CorreoElectronico, FILTER_VALIDATE_EMAIL)) {
    $_SESSION['swal'] = [
        'icon' => 'error',
        'title' => 'Correo Inválido',
        'text' => 'Por favor, introduce un correo electrónico válido.'
    ];
    header("location: ../index.php");
    exit();
}

// Verificar si el correo ya está registrado
$stmt_check_email = mysqli_prepare($conexion, "SELECT id FROM usuarios WHERE email = ?");
mysqli_stmt_bind_param($stmt_check_email, "s", $CorreoElectronico);
mysqli_stmt_execute($stmt_check_email);
if (mysqli_stmt_get_result($stmt_check_email)->num_rows > 0) {
    $_SESSION['swal'] = [
        'icon' => 'error',
        'title' => 'Error de registro',
        'text' => 'Este correo ya está registrado, intenta con otro diferente.'
    ];
    header("location: ../index.php");
    exit();
}
mysqli_stmt_close($stmt_check_email);

// Insertar el nuevo usuario
$stmt_insert = mysqli_prepare($conexion, "INSERT INTO usuarios (nombre, email, usuario, password, rol) VALUES (?, ?, ?, ?, ?)");
mysqli_stmt_bind_param($stmt_insert, "sssss", $nombre_completo, $CorreoElectronico, $UsuarioRegistro, $ContrasenaUser, $rol);

if(mysqli_stmt_execute($stmt_insert)){
    unset($_SESSION['form_data']); // Limpiar datos del formulario en caso de éxito
    unset($_SESSION['form_type']);
    $_SESSION['swal'] = [
        'icon' => 'success',
        'title' => '¡Registro Exitoso!',
        'text' => 'Usuario registrado exitosamente. Ahora puedes iniciar sesión.',
    ];
    header("location: ../index.php");
    exit();
} else {
    $_SESSION['swal'] = [
        'icon' => 'error',
        'title' => 'Error de registro',
        'text' => 'Error al registrar el usuario. Inténtalo de nuevo.'
    ];
    header("location: ../index.php");
    exit();
}

mysqli_stmt_close($stmt_insert);
mysqli_close($conexion);
?>