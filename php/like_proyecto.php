<?php
session_start();
include 'conexion_db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['usuario']) || !isset($_POST['id_proyecto'])) {
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']);
    exit();
}

$id_usuario = $_SESSION['id_usuario'];
$id_proyecto = filter_var($_POST['id_proyecto'], FILTER_VALIDATE_INT);

if (!$id_proyecto) {
    echo json_encode(['success' => false, 'message' => 'ID de proyecto inválido.']);
    exit();
}

// Iniciar transacción para garantizar la consistencia de los datos
$conexion->begin_transaction();

try {
    // Verificar si el usuario ya le ha dado like al proyecto
    $query_check = "SELECT id FROM proyecto_likes WHERE id_usuario = ? AND id_proyecto = ?";
    $stmt_check = $conexion->prepare($query_check);
    $stmt_check->bind_param("ii", $id_usuario, $id_proyecto);
    $stmt_check->execute();
    $result_check = $stmt_check->get_result();

    if ($result_check->num_rows > 0) {
        // --- El usuario ya le dio like, así que lo quitamos (unlike) ---
        $like_id = $result_check->fetch_assoc()['id'];

        // Eliminar el like
        $query_unlike = "DELETE FROM proyecto_likes WHERE id = ?";
        $stmt_unlike = $conexion->prepare($query_unlike);
        $stmt_unlike->bind_param("i", $like_id);
        $stmt_unlike->execute();

        // Decrementar el contador de likes
        $query_update = "UPDATE proyectos SET likes_count = likes_count - 1 WHERE id = ? AND likes_count > 0";
        $stmt_update = $conexion->prepare($query_update);
        $stmt_update->bind_param("i", $id_proyecto);
        $stmt_update->execute();

        $action = 'unliked';
        $message = "Tu 'Me gusta' ha sido retirado.";

    } else {
        // --- El usuario no le ha dado like, así que lo añadimos (like) ---
        
        // Insertar el like
        $query_like = "INSERT INTO proyecto_likes (id_usuario, id_proyecto) VALUES (?, ?)";
        $stmt_like = $conexion->prepare($query_like);
        $stmt_like->bind_param("ii", $id_usuario, $id_proyecto);
        $stmt_like->execute();

        // Incrementar el contador de likes
        $query_update = "UPDATE proyectos SET likes_count = likes_count + 1 WHERE id = ?";
        $stmt_update = $conexion->prepare($query_update);
        $stmt_update->bind_param("i", $id_proyecto);
        $stmt_update->execute();
        
        $action = 'liked';
        $message = "¡Gracias por tu apoyo!";
    }

    // Confirmar la transacción
    $conexion->commit();

    // Obtener el nuevo conteo de likes para devolverlo al frontend
    $query_count = "SELECT likes_count FROM proyectos WHERE id = ?";
    $stmt_count = $conexion->prepare($query_count);
    $stmt_count->bind_param("i", $id_proyecto);
    $stmt_count->execute();
    $new_likes_count = $stmt_count->get_result()->fetch_assoc()['likes_count'];

    echo json_encode(['success' => true, 'message' => $message, 'action' => $action, 'new_likes_count' => $new_likes_count]);

} catch (Exception $e) {
    // Si algo falla, revertir todos los cambios
    $conexion->rollback();
    echo json_encode(['success' => false, 'message' => 'Error al procesar la solicitud.']);
}

$conexion->close();
?>
