# Mi Diario Privado (Journal App)

Una aplicación móvil desarrollada con Ionic, Angular y Capacitor que funciona como un diario visual y álbum privado. Permite a los usuarios crear una cuenta segura, iniciar sesión y capturar fotografías para documentar su día a día.

## 🚀 Características Principales (Features)

* **🔐 Autenticación Segura**: Sistema de Login y Registro de usuarios conectado a un backend en PHP.
* **🛡️ Protección de Privacidad (Rutas Guardadas)**: Implementación de `AuthGuard` en Angular para asegurar que nadie pueda acceder a la galería o ver el contenido sin una sesión activa.
* **📸 Captura de Fotografías**: Integración directa con la cámara nativa del dispositivo utilizando `@capacitor/camera`.
* **🖼️ Galería Privada**: Visualización en cuadrícula de las memorias fotográficas capturadas.
* **💾 Almacenamiento Persistente**: Guardado de imágenes localmente utilizando `@capacitor/filesystem` y manejo de la sesión y metadatos con `@capacitor/preferences`.
* **✨ Interfaz Animada**: Pantalla de inicio de sesión con fondos geométricos interactivos y dinámicos utilizando `Paper.js`.

## 🛠️ Tecnologías y Stack

* **Framework de UI**: [Ionic Framework](https://ionicframework.com/) (Componentes UI nativos)
* **Framework Lógico**: [Angular](https://angular.io/) (v22)
* **Runtime Nativo**: [Capacitor](https://capacitorjs.com/) (iOS, Android, PWA)
* **Peticiones HTTP**: [Axios](https://axios-http.com/)
* **Animaciones UI**: [Paper.js](http://paperjs.org/)

## 💻 Instrucciones de Instalación y Ejecución

> **Nota:** Requiere Node `^22.22.3 || ^24.15.0 || >=26.0.0` (por Angular 22).

1. Instalar la CLI de Ionic a nivel global (si no la tienes): 
   ```bash
   npm install -g @ionic/cli
   ```
2. Clonar/Descargar el repositorio y acceder a la carpeta del proyecto.
3. Instalar dependencias locales: 
   ```bash
   npm install
   ```
4. Levantar la aplicación en el navegador: 
   ```bash
   ionic serve
   ```
5. Para compilar a iOS o Android, puedes usar Capacitor:
   ```bash
   npx cap add android
   npx cap sync
   npx cap open android
   ```

*Nota: Recuerda tener corriendo el servidor PHP en `http://localhost/p1-u1/` para que la autenticación de usuarios funcione correctamente.*
