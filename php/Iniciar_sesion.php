<?php
session_start();
include 'conexion_db.php';

$CorreoElectronico = $_POST["correo"];
$ContrasenaUser = $_POST["contra"];

// Guardar correo en sesión para repoblar el formulario de login en caso de error
$_SESSION['form_data'] = ['correo' => $CorreoElectronico];
$_SESSION['form_type'] = 'login';

// Usar consultas preparadas para evitar inyección SQL
$stmt = mysqli_prepare($conexion, "SELECT * FROM usuarios WHERE email = ?");
mysqli_stmt_bind_param($stmt, "s", $CorreoElectronico);
mysqli_stmt_execute($stmt);
$resultado = mysqli_stmt_get_result($stmt);

if(mysqli_num_rows($resultado) > 0){
    $usuario_data = mysqli_fetch_assoc($resultado);
    
    // Verificar la contraseña
    if ($ContrasenaUser === $usuario_data['password']) {
        unset($_SESSION['form_data']); // Limpiar datos del formulario en caso de éxito
        unset($_SESSION['form_type']);

        $_SESSION['usuario'] = $usuario_data['nombre'];
        $_SESSION['rol'] = $usuario_data['rol'];
        $_SESSION['id_usuario'] = $usuario_data['id'];
        
        $_SESSION['swal'] = [
            'icon' => 'success',
            'title' => '¡Bienvenido!',
            'text' => 'Inicio de sesión exitoso.',
            'timer' => 1500,
            'showConfirmButton' => false
        ];

        header("location: ../bienvenida.php");
        exit;
    } else {
        $_SESSION['swal'] = [
            'icon' => 'error',
            'title' => 'Error de autenticación',
            'text' => 'Correo o contraseña incorrectos. Intente nuevamente.'
        ];
        header("location: ../index.php");
        exit();
    }
} else {
    $_SESSION['swal'] = [
        'icon' => 'error',
        'title' => 'Error de autenticación',
        'text' => 'Correo o contraseña incorrectos. Intente nuevamente.'
    ];
    header("location: ../index.php");
    exit();
}

mysqli_stmt_close($stmt);
mysqli_close($conexion);
?>