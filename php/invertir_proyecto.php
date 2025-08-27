<?php
session_start();
include 'conexion_db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['usuario']) || $_SESSION['rol'] != 'inversionista') {
    echo json_encode(['success' => false, 'message' => 'Acceso no autorizado.']);
    exit();
}

if (!isset($_POST['id_proyecto']) || !isset($_POST['monto'])) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos.']);
    exit();
}

$id_usuario = $_SESSION['id_usuario'];
$id_proyecto = filter_var($_POST['id_proyecto'], FILTER_VALIDATE_INT);
$monto_invertido = filter_var($_POST['monto'], FILTER_VALIDATE_FLOAT);

if (!$id_proyecto || !$monto_invertido || $monto_invertido <= 0) {
    echo json_encode(['success' => false, 'message' => 'Monto de inversión inválido.']);
    exit();
}

$conexion->begin_transaction();

try {
    // 1. Obtener el estado actual y los costos del proyecto
    $query_proyecto = "SELECT monto_recaudado, costos, estado FROM proyectos WHERE id = ? FOR UPDATE";
    $stmt_proyecto = $conexion->prepare($query_proyecto);
    $stmt_proyecto->bind_param("i", $id_proyecto);
    $stmt_proyecto->execute();
    $result_proyecto = $stmt_proyecto->get_result();
    $proyecto = $result_proyecto->fetch_assoc();

    if (!$proyecto) {
        throw new Exception("Proyecto no encontrado.");
    }

    // Validar que el proyecto siga buscando inversión
    if ($proyecto['estado'] != 'Buscando Inversión') {
        throw new Exception("Este proyecto ya no está aceptando inversiones.");
    }

    $monto_recaudado_actual = $proyecto['monto_recaudado'];
    $costos_proyecto = $proyecto['costos'];

    

    // 2. Insertar el registro de la inversión
    $query_insert = "INSERT INTO inversiones (id_proyecto, id_inversionista, monto_invertido) VALUES (?, ?, ?)";
    $stmt_insert = $conexion->prepare($query_insert);
    $stmt_insert->bind_param("iid", $id_proyecto, $id_usuario, $monto_invertido);
    $stmt_insert->execute();

    // 3. Actualizar el monto recaudado en la tabla de proyectos
    $nuevo_monto_recaudado = $monto_recaudado_actual + $monto_invertido;
    $query_update = "UPDATE proyectos SET monto_recaudado = ? WHERE id = ?";
    $stmt_update = $conexion->prepare($query_update);
    $stmt_update->bind_param("di", $nuevo_monto_recaudado, $id_proyecto);
    $stmt_update->execute();

    // 4. (Opcional) Actualizar el estado del proyecto si se alcanzó la meta
    if ($nuevo_monto_recaudado >= $costos_proyecto) {
        $nuevo_estado = 'En Progreso';
        $query_estado = "UPDATE proyectos SET estado = ? WHERE id = ?";
        $stmt_estado = $conexion->prepare($query_estado);
        $stmt_estado->bind_param("si", $nuevo_estado, $id_proyecto);
        $stmt_estado->execute();
    }

    $conexion->commit();

    echo json_encode([
        'success' => true, 
        'message' => '¡Inversión realizada con éxito!', 
        'nuevo_monto_recaudado' => $nuevo_monto_recaudado,
        'costos_proyecto' => $costos_proyecto
    ]);

} catch (Exception $e) {
    $conexion->rollback();
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conexion->close();
?>