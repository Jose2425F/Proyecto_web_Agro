<?php
    session_start();
    if(isset($_SESSION['usuario'])){
        header("location: bienvenida.php");
        exit();
    }

    $form_data = $_SESSION['form_data'] ?? [];
    $form_type = $_SESSION['form_type'] ?? '';
    unset($_SESSION['form_data']);
    unset($_SESSION['form_type']);
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login y Registro - AgroColombia</title>
    <link rel="stylesheet" href="assets/css/estilos.css?v=1.13">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>
<body>
    <?php if (isset($_SESSION['swal'])): ?>
    <script>
        Swal.fire({
            icon: "<?php echo $_SESSION['swal']['icon']; ?>",
            title: "<?php echo $_SESSION['swal']['title']; ?>",
            text: "<?php echo $_SESSION['swal']['text']; ?>",
            showConfirmButton: <?php echo isset($_SESSION['swal']['showConfirmButton']) ? ($_SESSION['swal']['showConfirmButton'] ? 'true' : 'false') : 'true'; ?>,
            <?php if (isset($_SESSION['swal']['timer'])): ?>
            timer: <?php echo $_SESSION['swal']['timer']; ?>,
            <?php endif; ?>
            background: '#2a2a2a',
            color: '#f0f0f0',
            confirmButtonColor: '#14c900'
        });
    </script>
    <?php unset($_SESSION['swal']); ?>
    <?php endif; ?>

    <main>
        <div class="contenedor__todo">

            <div class="caja_trasera">
                <div class="caja_trasera_login">
                    <h3>¿Ya tienes una cuenta?</h3>
                    <p>Inicia sesion para entrar en la pagina</p>
                    <button id="btn__iniciar-sesion">Iniciar Sesion</button>
                </div>
                <div class="caja_trasera_register">
                    <h3>¿Aun no tienes una cuenta?</h3>
                    <p>Registrar para que puedas iniciar sesion</p>
                    <button id="btn__registrar">Registrarse</button>
                </div>
            </div>
            <!-- formilario de login y registro -->
            <div class="contenedor__login-register">
                <!-- login -->
                <form action="php/Iniciar_sesion.php" method="POST" class="formulario__login" style="<?php echo ($form_type == 'register') ? 'display: none;' : ''; ?>">
                    <h2>Iniciar sesion</h2>
                    <input type="text" placeholder="Correo Electronico" name="correo" value="<?php echo htmlspecialchars($form_data['correo'] ?? ''); ?>">
                    <input type="password" placeholder="Contraseña" name="contra">
                    <button>Entrar</button>
                </form>
                <!-- registro -->
                <form action="php/registrar_user.php" method = "POST" class="formulario__register" style="<?php echo ($form_type == 'register') ? 'display: block;' : ''; ?>">
                    <h2>Registrarse</h2>
                    <input type="text" placeholder="Nombre Completo" name="nombreCompleto" value="<?php echo htmlspecialchars($form_data['nombreCompleto'] ?? ''); ?>">
                    <input type="text" placeholder="Correo Electronico" name="CorreoElectronico" value="<?php echo htmlspecialchars($form_data['CorreoElectronico'] ?? ''); ?>">
                    <input type="text" placeholder="Usuario" name="UsuarioRegistro" value="<?php echo htmlspecialchars($form_data['UsuarioRegistro'] ?? ''); ?>">
                    <input type="password" placeholder="Contraseña" name="ContrasenaUser">

                    <label for="rol">Selecciona su rol:</label>
                    <select id="rol" name="rol">
                        <option value="campesino" <?php echo (isset($form_data['rol']) && $form_data['rol'] == 'campesino') ? 'selected' : ''; ?>>Campesino</option>
                        
                        <option value="inversionista" <?php echo (isset($form_data['rol']) && $form_data['rol'] == 'inversionista') ? 'selected' : ''; ?>>Inversionista</option>
                    </select>
                    
                    <button>Registrarse</button>
                </form>
            </div>

        </div>
    </main>
    <script src="assets/js/script.js"></script>
</body>
</html>