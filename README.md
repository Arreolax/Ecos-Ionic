# Mi Diario Privado (Journal App)

Una aplicación móvil desarrollada con Ionic, Angular y Capacitor que funciona como un diario visual y álbum privado. Permite a los usuarios crear una cuenta segura, iniciar sesión y capturar fotografías para documentar su día a día.

## 🚀 Características Principales (Features)

* **🔐 Autenticación Segura**: Sistema de Login y Registro de usuarios conectado a un backend en PHP.
* **🛡️ Protección de Privacidad (Rutas Guardadas)**: Implementación de `AuthGuard` en Angular para asegurar que nadie pueda acceder a la galería o ver el contenido sin una sesión activa.
* **📸 Captura de Fotografías**: Integración directa con la cámara nativa del dispositivo.
* **🖼️ Galería Privada**: Visualización en cuadrícula de las memorias fotográficas capturadas.
* **💾 Almacenamiento Persistente**: Guardado de imágenes localmente.

## 🛠️ Tecnologías y Stack

* **Framework de UI**: [Ionic Framework](https://ionicframework.com/) (Componentes UI nativos)
* **Framework Lógico**: [Angular](https://angular.io/) (v22)
* **Runtime Nativo**: [Capacitor](https://capacitorjs.com/) (iOS, Android, PWA)
* **Peticiones HTTP**: [Axios](https://axios-http.com/)
* **Animaciones UI**: [Paper.js](http://paperjs.org/)
