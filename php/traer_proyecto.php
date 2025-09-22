<?php
include 'conexion_db.php';

header('Content-Type: application/json');

// Habilitar CORS para permitir solicitudes desde tu frontend de React
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Consulta SQL
$query_proyectos = "SELECT p.id, p.nombre, p.descripcion, p.monto_recaudado, p.costos, p.estado, u.nombre as nombre_creador, p.imagen_url FROM proyectos p JOIN usuarios u ON p.id_usuario = u.id ORDER BY p.fecha_creacion DESC LIMIT 4";
$resultado_proyectos = mysqli_query($conexion, $query_proyectos);

$proyectos_array = array();

if ($resultado_proyectos) {
    // Itera sobre cada fila de resultados y la añade al array.
    while ($fila = mysqli_fetch_assoc($resultado_proyectos)) {
        $proyectos_array[] = $fila;
    }
    // Establecer  código de estado HTTP 200 o 500
     http_response_code(200);
    echo json_encode($proyectos_array);
} else {
     http_response_code(500);
    echo json_encode(["error" => "Error en la consulta: " . mysqli_error($conexion)]);
}
mysqli_close($conexion);

?>

