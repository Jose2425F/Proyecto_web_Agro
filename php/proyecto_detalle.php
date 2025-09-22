<?php
include 'conexion_db.php';


$id_proyecto = $_GET['id'];

// Obtener datos del proyecto
$query = "SELECT p.*, u.nombre AS nombre_creador, u.email AS email_creador FROM proyectos p JOIN usuarios u ON p.id_usuario = u.id WHERE p.id = ?";
$stmt = $conexion->prepare($query);
$stmt->bind_param("i", $id_proyecto);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows == 0) {
    echo json_encode(['error' => 'Proyecto no encontrado']);
    http_response_code(404);
    exit();
}

$proyecto = $resultado->fetch_assoc();

// Devolver los datos del proyecto en formato JSON
header('Content-Type: application/json');
echo json_encode($proyecto);
exit();
$stmt->close();
$conexion->close();
?>