<?php
session_start();
include 'conexion_db.php';

header('Content-Type: application/json');

// Habilitar CORS para permitir solicitudes desde tu frontend de React
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

// Manejar la solicitud OPTIONS (pre-vuelo)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$response = ['success' => false, 'message' => ''];

// Leer los datos del cuerpo de la solicitud
$data = json_decode(file_get_contents("php://input"), true);

$CorreoElectronico = $data["CorreoElectronico"] ?? null;
$ContrasenaUser = $data["ContrasenaUser"] ?? null;

if (empty($CorreoElectronico) || empty($ContrasenaUser)) {
    $response['message'] = 'Por favor, completa todos los campos.';
    echo json_encode($response);
    exit();
}

// Usar consultas preparadas para evitar inyección SQL
$stmt = mysqli_prepare($conexion, "SELECT * FROM usuarios WHERE email = ?");
mysqli_stmt_bind_param($stmt, "s", $CorreoElectronico);
mysqli_stmt_execute($stmt);
$resultado = mysqli_stmt_get_result($stmt);

if(mysqli_num_rows($resultado) > 0){
    $usuario_data = mysqli_fetch_assoc($resultado);
    
    // Verificar la contraseña
    if ($ContrasenaUser === $usuario_data['password']) {
        $_SESSION['usuario'] = $usuario_data['nombre'];
        $_SESSION['rol'] = $usuario_data['rol'];
        $_SESSION['id_usuario'] = $usuario_data['id'];

        $response['success'] = true;
        $response['message'] = "¡Bienvenido {$_SESSION["usuario"]}!";
        $response['user'] = [
            'id' => $usuario_data['id'],
            'nombre' => $usuario_data['nombre'],
            'email' => $usuario_data['email'],
            'rol' => $usuario_data['rol']
        ];

    } else {
        $response['message'] = 'Correo o contraseña incorrectos. Intente nuevamente.';
    }
} else {
    $response['message'] = 'Correo o contraseña incorrectos. Intente nuevamente.';
}

echo json_encode($response);

mysqli_stmt_close($stmt);
mysqli_close($conexion);
?>