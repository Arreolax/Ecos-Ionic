-- 05_10_2026
INSERT INTO `folders` (`id`, `name`, `description`) VALUES
(1, 'Todas', 'Todas las fotos tomadas'),
(2, 'Ocultas', 'Seccion Privada'),
(3, 'Sin Carpeta', ''),
(4, 'Documentos', 'Comprobantes de pago y gastos mensuales.'),
(5, 'Recetas', 'Recetas de cocina interesantes para intentar luego.'),
(6, 'Viajes', 'Fotos de vacaciones, escapadas y lugares visitados.'),
(7, 'Familia', 'Momentos y recuerdos invaluables con la familia.'),
(8, 'Amigos', 'Salidas, fiestas y reuniones con amistades.'),
(9, 'Mascotas', 'Fotos de los consentidos de la casa.'),
(10, 'Capturas de Pantalla', 'Screenshots útiles, referencias, recordatorios o chats.'),
(11, 'Memes', 'Imágenes graciosas listas para compartir.'),
(12, 'Selfies', 'Autorretratos y fotos para perfiles sociales.'),
(13, 'Comida', 'Platillos deliciosos, visitas a restaurantes y creaciones culinarias.'),
(14, 'Paisajes', 'Atardeceres, naturaleza y lugares bonitos.'),
(15, 'Eventos', 'Conciertos, bodas, graduaciones y celebraciones especiales.'),
(16, 'Inspiración', 'Ideas de decoración, outfits, tatuajes, cortes de cabello, etc.'),
(17, 'Trabajo y Estudio', 'Fotos de pizarrones, apuntes, horarios y proyectos en curso.');

INSERT INTO `categories` (`id`, `name`) VALUES
(1, 'Personal'),
(2, 'Ideas'),
(3, 'Trabajo'),
(4, 'Importante'),
(5, 'Diario'),
(6, 'Estudio'),
(7, 'Finanzas'),
(8, 'Salud'),
(9, 'Viajes'),
(10, 'Proyectos'),
(11, 'Recordatorios'),
(12, 'Compras'),
(13, 'Hogar'),
(14, 'Familia'),
(15, 'Recetas'),
(16, 'Entretenimiento'),
(17, 'Metas'),
(18, 'Reuniones'),
(19, 'Borradores'),
(20, 'Archivo');

INSERT INTO `users` (`id`, `name`, `username`, `email`, `telefono`, `password`, `terms_service`, `created_at`) VALUES
(1, 'test_name', 'test', 'test@test.com', '999 999 99', '$2y$10$ByAeiXTT48IzjN/xeqMNa.MTCGagRtILf7MUbIlBtRXg2/apQY6rq', 1, '2026-10-05 15:04:52');