<?php
session_start();
include 'conexion_db.php';

header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$response = ['success' => false, 'message' => ''];
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id_token'])) {
    $response['message'] = 'No se proporcionó el token de ID.';
    echo json_encode($response);
    exit;
}

$id_token = $data['id_token'];
$source = $data['source'] ?? 'register'; // Default to 'register'
$rol_from_request = $data['rol'] ?? null;

// Decode the JWT payload
$token_parts = explode('.', $id_token);
if (count($token_parts) !== 3) {
    $response['message'] = 'Token de ID inválido.';
    echo json_encode($response);
    exit;
}
$payload_base64 = $token_parts[1];
$payload_json = base64_decode(str_replace(['-', '_'], ['+', '/'], $payload_base64));
$payload = json_decode($payload_json, true);

if (!$payload) {
    $response['message'] = 'No se pudo decodificar el token de ID.';
    echo json_encode($response);
    exit;
}

// Extract user info
$google_id = $payload['sub'] ?? null;
$email = $payload['email'] ?? null;
$nombre = $payload['name'] ?? null;
$foto_perfil = $payload['picture'] ?? null;

if (!$google_id || !$email || !$nombre) {
    $response['message'] = 'La información del token es incompleta.';
    echo json_encode($response);
    exit;
}

// --- Database Logic ---

// 1. Find by google_id
$stmt = mysqli_prepare($conexion, "SELECT * FROM usuarios WHERE google_id = ?");
mysqli_stmt_bind_param($stmt, "s", $google_id);
mysqli_stmt_execute($stmt);
$resultado = mysqli_stmt_get_result($stmt);

if (mysqli_num_rows($resultado) > 0) {
    // User found by google_id, log them in
    $usuario_data = mysqli_fetch_assoc($resultado);
} else {
    // 2. Not found by google_id, find by email
    mysqli_stmt_close($stmt);
    $stmt = mysqli_prepare($conexion, "SELECT * FROM usuarios WHERE email = ?");
    mysqli_stmt_bind_param($stmt, "s", $email);
    mysqli_stmt_execute($stmt);
    $resultado = mysqli_stmt_get_result($stmt);

    if (mysqli_num_rows($resultado) > 0) {
        // User found by email, link google_id and update profile picture
        $usuario_data = mysqli_fetch_assoc($resultado);
        $user_id = $usuario_data['id'];

        mysqli_stmt_close($stmt);
        $stmt_update = mysqli_prepare($conexion, "UPDATE usuarios SET google_id = ?, foto_perfil = ? WHERE id = ?");
        mysqli_stmt_bind_param($stmt_update, "ssi", $google_id, $foto_perfil, $user_id);
        mysqli_stmt_execute($stmt_update);
        mysqli_stmt_close($stmt_update);
        $usuario_data['foto_perfil'] = $foto_perfil; // Update data for current session
    } else {
        // 3. User does not exist
        if ($source === 'login') {
            // If from login page, don't create user
            $response['message'] = 'Usuario no encontrado. Por favor, regístrate primero.';
            echo json_encode($response);
            exit;
        } else { // source is 'register'
            // If from register page, check for role
            if (!$rol_from_request) {
                // Role not provided, ask frontend to choose
                $response['action'] = 'CHOOSE_ROLE';
                $response['message'] = 'Por favor, selecciona un rol para completar tu registro.';
                echo json_encode($response);
                exit;
            }

            // Role is provided, create the user
            mysqli_stmt_close($stmt);
            
            // Validate the role
            $rol_defecto = 'inversionista'; // Default role
            if (in_array($rol_from_request, ['campesino', 'inversionista'])) {
                $rol_defecto = $rol_from_request;
            }

            $usuario_generado = explode('@', $email)[0] . rand(100, 999);

            $stmt_insert = mysqli_prepare($conexion, "INSERT INTO usuarios (nombre, email, usuario, rol, google_id, foto_perfil) VALUES (?, ?, ?, ?, ?, ?)");
            mysqli_stmt_bind_param($stmt_insert, "ssssss", $nombre, $email, $usuario_generado, $rol_defecto, $google_id, $foto_perfil);
            
            if (mysqli_stmt_execute($stmt_insert)) {
                $new_user_id = mysqli_insert_id($conexion);
                mysqli_stmt_close($stmt_insert);

                // Fetch the newly created user's data
                $stmt = mysqli_prepare($conexion, "SELECT * FROM usuarios WHERE id = ?");
                mysqli_stmt_bind_param($stmt, "i", $new_user_id);
                mysqli_stmt_execute($stmt);
                $resultado = mysqli_stmt_get_result($stmt);
                $usuario_data = mysqli_fetch_assoc($resultado);
            } else {
                $response['message'] = 'Error al crear el nuevo usuario.';
                echo json_encode($response);
                exit;
            }
        }
    }
}

// Log in and return user data
if (isset($usuario_data)) {
    $_SESSION['usuario'] = $usuario_data['nombre'];
    $_SESSION['rol'] = $usuario_data['rol'];
    $_SESSION['id_usuario'] = $usuario_data['id'];

    $response['success'] = true;
    $response['message'] = "¡Bienvenido {$usuario_data['nombre']}!";
    $response['user'] = [
        'id' => $usuario_data['id'],
        'nombre' => $usuario_data['nombre'],
        'email' => $usuario_data['email'],
        'rol' => $usuario_data['rol'],
        'foto_perfil' => $usuario_data['foto_perfil']
    ];
}

echo json_encode($response);

mysqli_stmt_close($stmt);
mysqli_close($conexion);
?>