# 📓 Ecos — Diario Personal, Notas y Álbum Fotográfico

Una aplicación móvil híbrida desarrollada con **Ionic + Angular + Capacitor** que funciona como un diario visual, bloc de notas y álbum fotográfico privado. Permite a los usuarios registrarse, iniciar sesión de forma segura, capturar y organizar fotografías, gestionar notas categorizadas con colores y fijado, y administrar su perfil.

---

## 🚀 Características Principales

### 🔐 Autenticación y Seguridad
- Sistema de **Login y Registro** con animación de transición y fondo interactivo generado con **Paper.js**.
- Persistencia de sesión mediante `@capacitor/preferences`.
- **Guards de ruta** (`authGuard` / `publicGuard`) que protegen todas las vistas privadas y redirigen automáticamente según el estado de sesión.

### 📊 Dashboard
- Pantalla principal con saludo personalizado al usuario.
- Acceso rápido a la **Cámara** y vista previa de las **3 fotos más recientes** del álbum.
- Navegación directa a **Notas**, **Álbum** y **Perfil**.

### 📸 Cámara
- Captura de imágenes desde la **cámara nativa** o selección desde la **galería** del dispositivo.
- Vista previa en vivo con campos para **título** y **descripción/reflexión**.
- Subida directa al servidor backend.

### 🖼️ Mi Álbum (Galería)
- Cuadrícula responsiva de fotografías almacenadas en el servidor.
- **Pull-to-refresh** para recargar contenido.
- Menú de acciones por foto: **Ver Detalles** (modal con título, fecha y nota) y **Eliminar Foto** con confirmación.

### 📝 Mis Notas
- Bloc de notas con **búsqueda en tiempo real** (debounced).
- Filtro por **categorías**: Personal, Ideas, Trabajo, Importante, Diario.
- **6 colores distintivos** para personalizar cada nota.
- Función de **fijar/desfijar** notas para mantenerlas al inicio.
- Modal de edición con textarea autoexpandible.
- Recarga automática de la lista tras guardar, actualizar o eliminar.

### 👤 Mi Perfil
- Visualización de avatar, nombre, usuario, email y teléfono.
- Chips con estadísticas del usuario.
- Modal para **editar datos personales** o **cambiar contraseña**.
- Zona de peligro para **eliminar cuenta** de manera irreversible.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Framework UI** | [Ionic Framework](https://ionicframework.com/) `^9.0.0` + [Ionicons](https://ionic.io/ionicons) `^8.1.0` |
| **Framework Frontend** | [Angular](https://angular.io/) `22.0.4` (Standalone Components, Signals, Control Flow `@if`/`@for`) |
| **Runtime Nativo** | [Capacitor](https://capacitorjs.com/) `^8.5.0` (Android, iOS, PWA) |
| **Cliente HTTP** | [Axios](https://axios-http.com/) `^1.20.0` + Angular `HttpClient` / RxJS `~7.8.0` |
| **Animaciones** | [Paper.js](http://paperjs.org/) `^0.12.18` (Canvas 2D vectorial interactivo) |
| **Backend** | PHP + MySQL (servidor local) |

---

## 🗺️ Navegación y Rutas

```
/login              → Login / Registro (publicGuard)
/tabs               → Shell principal (authGuard)
  ├── /dashboard    → Pantalla de inicio
  ├── /album        → Galería de fotos
  ├── /camera       → Captura de imágenes
  ├── /notes        → Bloc de notas
  └── /perfil       → Perfil del usuario
```
---