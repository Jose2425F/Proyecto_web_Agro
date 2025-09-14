<?php
#cerrar sesión 
session_start();
session_destroy();
header("location: ../index.php");
?>