<?php
// Formulario y lógica para que un usuario pueda crear una cuenta (campesino, inversionista).
include 'conexion_db.php';

header('Content-Type: application/json');

// Habilitar CORS para permitir solicitudes desde tu frontend de React
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Manejar la solicitud OPTIONS (pre-vuelo)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$response = ['success' => false, 'message' => ''];

// Leer los datos del cuerpo de la solicitud
$data = json_decode(file_get_contents("php://input"), true);

$nombre_completo = $data["nombreCompleto"] ?? null;
$CorreoElectronico = $data["CorreoElectronico"] ?? null;
$UsuarioRegistro = $data["UsuarioRegistro"] ?? null;
$ContrasenaUser = $data["ContrasenaUser"] ?? null;
$rol = $data["rol"] ?? null;

// Validar que todos los campos estén presentes y no vacíos
if (empty($nombre_completo) || empty($CorreoElectronico) || empty($UsuarioRegistro) || empty($ContrasenaUser) || empty($rol)) {
    $response['message'] = 'Por favor, completa todos los campos.';
    echo json_encode($response);
    exit();
}

// Validar el formato del correo electrónico
if (!filter_var($CorreoElectronico, FILTER_VALIDATE_EMAIL)) {
    $response['message'] = 'Por favor, introduce un correo electrónico válido.';
    echo json_encode($response);
    exit();
}

// Verificar si el correo ya está registrado
$stmt_check_email = mysqli_prepare($conexion, "SELECT id FROM usuarios WHERE email = ?");
mysqli_stmt_bind_param($stmt_check_email, "s", $CorreoElectronico);
mysqli_stmt_execute($stmt_check_email);
if (mysqli_stmt_get_result($stmt_check_email)->num_rows > 0) {
    $response['message'] = 'Este correo ya está registrado, intenta con otro diferente.';
    echo json_encode($response);
    exit();
}
mysqli_stmt_close($stmt_check_email);

// Insertar el nuevo usuario
$stmt_insert = mysqli_prepare($conexion, "INSERT INTO usuarios (nombre, email, usuario, password, rol) VALUES (?, ?, ?, ?, ?)");
mysqli_stmt_bind_param($stmt_insert, "sssss", $nombre_completo, $CorreoElectronico, $UsuarioRegistro, $ContrasenaUser, $rol);

if(mysqli_stmt_execute($stmt_insert)){
    $response['success'] = true;
    $response['message'] = 'Ahora puedes iniciar sesión con tu nueva cuenta.';
    echo json_encode($response);
    exit();
} else {
    $response['message'] = 'Error al registrar el usuario. Inténtalo de nuevo.';
    echo json_encode($response);
    exit();
}

mysqli_stmt_close($stmt_insert);
mysqli_close($conexion);
?>