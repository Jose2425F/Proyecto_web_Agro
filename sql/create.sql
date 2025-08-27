-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Versión del servidor:         10.4.32-MariaDB - mariadb.org binary distribution
-- SO del servidor:              Win64
-- HeidiSQL Versión:             12.10.0.7000
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Volcando estructura de base de datos para agrocolombia_connect
CREATE DATABASE IF NOT EXISTS `agrocolombia_connect` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;
USE `agrocolombia_connect`;
-- --------------------------------------------------------
-- 1. Tabla: usuarios
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `usuario` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('campesino','inversionista','administrador','administradorsupremo') NOT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 2. Tabla: proyectos
CREATE TABLE IF NOT EXISTS `proyectos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text NOT NULL,
  `costos` decimal(10,2) NOT NULL,
  `monto_recaudado` decimal(10,2) NOT NULL DEFAULT 0.00,
  `produccion_estimada` decimal(10,2) NOT NULL,
  `estado` enum('Buscando Inversión','En Progreso','Completado') NOT NULL DEFAULT 'Buscando Inversión',
  `id_usuario` int(11) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  `imagen_url` varchar(255) DEFAULT NULL,
  `likes_count` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `proyectos_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3. Tabla: inversiones
CREATE TABLE IF NOT EXISTS `inversiones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_proyecto` int(11) NOT NULL,
  `id_inversionista` int(11) NOT NULL,
  `monto_invertido` decimal(10,2) NOT NULL,
  `fecha_inversion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `id_proyecto` (`id_proyecto`),
  KEY `id_inversionista` (`id_inversionista`),
  CONSTRAINT `inversiones_ibfk_1` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `inversiones_ibfk_2` FOREIGN KEY (`id_inversionista`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4. Tabla: proyecto_likes
CREATE TABLE IF NOT EXISTS `proyecto_likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_usuario` int(11) NOT NULL,
  `id_proyecto` int(11) NOT NULL,
  `fecha_like` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_proyecto_unique` (`id_usuario`,`id_proyecto`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_proyecto` (`id_proyecto`),
  CONSTRAINT `proyecto_likes_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `proyecto_likes_ibfk_2` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- Datos usuarios
INSERT INTO `usuarios` (`id`, `nombre`, `email`, `usuario`, `password`, `rol`, `fecha_registro`) VALUES
(1, 'Jose Galvan', 'josegalvanpayares@gmail.com', 'Jose', '123456789', 'administradorsupremo', '2025-07-25 04:45:00'),
(2, 'Andres Felipe', 'andres@gmail.com', 'Andres', '1', 'administrador', '2025-07-25 02:48:19'),
(3, 'Samuel', 'samuel@gmail.com', 'samuelito', '1', 'campesino', '2025-07-25 23:41:36'),
(4, 'feliz', 'feliz@gmail.com', 'felizz', '1', 'inversionista', '2025-07-26 00:28:48'),
(5, 'Andres', 'a@gmail.com', 'a', '1', 'campesino', '2025-08-01 16:52:37');

-- Datos proyectos
INSERT INTO `proyectos` (`id`, `nombre`, `descripcion`, `costos`, `monto_recaudado`, `produccion_estimada`, `estado`, `id_usuario`, `fecha_creacion`, `imagen_url`, `likes_count`) VALUES
(1, 'Microtostadora de Café Especial con Marca Propia', 'Este proyecto busca instalar una microtostadora artesanal...', 95000000.00, 85000000.00, 500.00, 'Buscando Inversión', 3, '2025-07-26 01:08:43', 'assets/img/proyectos/images.jpeg', 1),
(2, 'Cultivo y Comercialización de Café Especial en Colombia', 'Este proyecto busca desarrollar una plantación de café especial...', 50000000.00, 0.00, 2500.00, 'Buscando Inversión', 3, '2025-07-25 23:52:53', 'assets/img/proyectos/cultivo-de-cafe-colombiano.jpg', 0),
(3, 'Producción Sostenible de Café en el Alto Cauca', 'Este proyecto tiene como objetivo establecer una finca cafetera...', 85000000.00, 0.00, 12000.00, 'Buscando Inversión', 3, '2025-08-01 17:04:59', 'assets/img/proyectos/istockphoto-1328004520-612x612.jpg', 0),
(4, 'Cultivo de Plátano Orgánico en Montes de María', 'El proyecto busca establecer una unidad productiva de plátano orgánico...', 60000000.00, 66200001.00, 25.00, 'En Progreso', 3, '2025-08-01 17:07:22', 'assets/img/proyectos/banana-growing-plantation.png', 1);

-- Datos inversiones
INSERT INTO `inversiones` (`id`, `id_proyecto`, `id_inversionista`, `monto_invertido`, `fecha_inversion`) VALUES
(1, 4, 4, 6200000.00, '2025-08-01 17:21:40'),
(2, 4, 4, 1.00, '2025-08-01 17:22:52'),
(3, 4, 4, 60000000.00, '2025-08-01 17:25:06'),
(4, 1, 4, 85000000.00, '2025-08-01 17:39:50');

-- Datos proyecto_likes
INSERT INTO `proyecto_likes` (`id`, `id_usuario`, `id_proyecto`, `fecha_like`) VALUES
(14, 4, 4, '2025-08-01 17:43:48'),
(23, 4, 1, '2025-08-01 17:45:46');
