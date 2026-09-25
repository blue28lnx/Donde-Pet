# 🐾 Dónde Pet

**Dónde Pet** es una aplicación web creada para ayudar a encontrar mascotas perdidas y facilitar el contacto entre personas de una misma comunidad.

La plataforma permite publicar reportes de mascotas perdidas, visualizar los reportes existentes y consultar la información necesaria para ayudar a encontrar a cada animal.

🌐 **Aplicación:** https://donde-pet-7ab50.web.app/
💻 **Repositorio:** https://github.com/blue28lnx/Donde-Pet

---

## 📌 Características

* 🐶 Publicación de mascotas perdidas.
* 🐱 Registro de información de la mascota.
* 📷 Carga de fotografías.
* 🗜️ Compresión automática de imágenes antes de guardarlas.
* 🔐 Autenticación de usuarios mediante Firebase Authentication.
* ☁️ Persistencia de datos mediante Cloud Firestore.
* 🔎 Visualización de mascotas reportadas.
* 📍 Información relacionada con la ubicación de la mascota.
* 📱 Diseño adaptable a dispositivos móviles y computadoras.
* ⚡ Actualización de información en tiempo real mediante Firestore.

---

## 🛠️ Tecnologías utilizadas

### Frontend

* **React**
* **TypeScript**
* **Vite**
* HTML5
* CSS

### Backend / Servicios

* **Firebase Authentication**
* **Cloud Firestore**
* **Firebase Hosting**

La aplicación utiliza Firebase como infraestructura para autenticación, almacenamiento de datos y publicación de la aplicación.

---

## 🗄️ Base de datos

Dónde Pet utiliza **Cloud Firestore**, una base de datos NoSQL orientada a documentos.

Los reportes de mascotas se almacenan como documentos dentro de una colección.

Cada mascota contiene información como:

```text
id
nombre
especie
raza
color
sexo
descripción
ubicación
fecha
fotografía
ownerId
```

El campo `ownerId` permite relacionar el reporte con el usuario que lo creó.

### 🔐 Seguridad

Las reglas de Firestore controlan quién puede realizar determinadas operaciones.

Por ejemplo, al crear un reporte se verifica que el usuario autenticado sea el propietario indicado en el documento:

```text
request.resource.data.ownerId == request.auth.uid
```

Esto evita que un usuario pueda crear un reporte asignándolo arbitrariamente a otra cuenta.

---

## 📷 Sistema de imágenes

Una de las particularidades del proyecto es el tratamiento de las fotografías.

En lugar de utilizar Firebase Storage, las imágenes se procesan directamente en el navegador y posteriormente se almacenan como **Base64 dentro de Firestore**.

### Flujo

```text
📷 Usuario selecciona una imagen
          ↓
🖼️ Se procesa en el navegador
          ↓
📐 Se reduce a un máximo de 1280 × 1280 px
          ↓
🗜️ Se comprime como JPEG
          ↓
📦 Se convierte a Base64
          ↓
☁️ Se guarda en Firestore
```

La compresión se realiza mediante `Canvas`, reduciendo considerablemente el tamaño de las fotografías antes de enviarlas a Firestore.

Esto permite utilizar el sistema sin depender de Firebase Storage.

### Límites

La aplicación verifica el tamaño final de la imagen comprimida antes de guardarla.

Actualmente se utiliza un límite aproximado de:

```text
900 KB
```

---

## 📂 Estructura del proyecto

Una estructura simplificada del proyecto es:

```text
Donde-Pet/
│
├── public/
│
├── src/
│   │
│   ├── components/
│   │   └── ReportForm.tsx
│   │
│   ├── contexts/
│   │   └── PetsContext.tsx
│   │
│   ├── utils/
│   │   └── imageCompression.ts
│   │
│   ├── ...
│   │
│   └── main.tsx
│
├── firestore.rules
├── firebase.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/blue28lnx/Donde-Pet.git
```

Entrar en la carpeta:

```bash
cd Donde-Pet
```

### 2. Instalar dependencias

El proyecto utiliza `pnpm`:

```bash
pnpm install
```

También se puede utilizar npm si se adapta el proyecto:

```bash
npm install
```

### 3. Configurar Firebase

Es necesario crear un proyecto en Firebase y configurar los servicios utilizados por la aplicación.

Los servicios principales son:

* Firebase Authentication
* Cloud Firestore
* Firebase Hosting

La configuración de Firebase debe realizarse utilizando las variables de entorno correspondientes.

---

## 💻 Ejecutar en desarrollo

Para iniciar el servidor de desarrollo:

```bash
pnpm dev
```

Luego abrir la dirección indicada por Vite, normalmente:

```text
http://localhost:5173
```

---

## 🏗️ Compilar para producción

Para generar la versión de producción:

```bash
pnpm run build
```

El resultado se genera dentro de:

```text
dist/
```

---

## 🌐 Deploy

El proyecto utiliza Firebase Hosting.

Para publicar la aplicación:

```bash
firebase deploy
```

O solamente actualizar el hosting:

```bash
firebase deploy --only hosting
```

La versión publicada actualmente está disponible en:

**https://donde-pet-7ab50.web.app/**

---

## 🔄 Funcionamiento general

El funcionamiento principal de Dónde Pet puede resumirse de la siguiente manera:

```text
                    DÓNDE PET
                        │
          ┌─────────────┴─────────────┐
          │                           │
      Registrarse                 Iniciar sesión
          │                           │
          └─────────────┬─────────────┘
                        │
                    Usuario
                        │
                ┌───────┴───────┐
                │               │
          Ver mascotas      Reportar mascota
                                │
                         Completar formulario
                                │
                          Seleccionar foto
                                │
                         Comprimir imagen
                                │
                           Firestore
                                │
                         Nuevo reporte
                                │
                      Visible para usuarios
```

---

## 🧩 Componentes principales

### `ReportForm.tsx`

Se encarga del formulario utilizado para reportar una mascota.

Entre sus responsabilidades se encuentran:

* Capturar los datos del reporte.
* Seleccionar una fotografía.
* Comprimir la fotografía.
* Validar el tamaño de la imagen.
* Obtener el usuario autenticado.
* Crear el documento correspondiente en Firestore.

---

### `PetsContext.tsx`

Centraliza la información de las mascotas dentro de la aplicación.

Utiliza Firestore para:

* Obtener los reportes.
* Escuchar cambios en tiempo real.
* Agregar nuevos reportes.
* Mantener sincronizada la interfaz con la base de datos.

---

### `imageCompression.ts`

Contiene la lógica encargada de comprimir las imágenes antes de almacenarlas.

La función principal:

```typescript
compressImage()
```

recibe una imagen y devuelve información sobre la imagen procesada, incluyendo:

```typescript
{
  dataUrl,
  originalSize,
  compressedSize
}
```

---

## 🔐 Autenticación

La autenticación está gestionada mediante **Firebase Authentication**.

El usuario debe iniciar sesión para realizar determinadas acciones, como publicar una mascota.

El identificador del usuario autenticado se utiliza posteriormente como `ownerId` dentro del reporte.

Esto permite relacionar:

```text
Usuario
   │
   └── ownerId
          │
          ▼
      Mascota reportada
```

---

## 🎯 Objetivo del proyecto

El objetivo de Dónde Pet es crear una herramienta sencilla y accesible que facilite la difusión de mascotas perdidas.

La idea es que una persona pueda realizar un reporte rápidamente y que otras personas puedan consultar esos reportes para colaborar con la búsqueda.

Además, el proyecto sirve como práctica para aplicar conceptos de:

* Desarrollo frontend.
* React.
* TypeScript.
* Bases de datos NoSQL.
* Autenticación.
* Seguridad mediante reglas.
* Procesamiento de imágenes.
* Firebase.
* Deploy de aplicaciones web.
* Git y GitHub.

---

## 📚 Aprendizajes

Durante el desarrollo del proyecto se trabajó especialmente con:

* Componentes reutilizables de React.
* Hooks y manejo de estado.
* Context API.
* TypeScript.
* Firebase Authentication.
* Firestore.
* Consultas y listeners en tiempo real.
* Reglas de seguridad.
* Conversión de imágenes a Base64.
* Compresión de imágenes mediante Canvas.
* Vite.
* Firebase Hosting.
* Git y GitHub.

---

## 🚧 Próximas mejoras

Algunas funcionalidades que pueden incorporarse en futuras versiones:

* 🔔 Notificaciones sobre nuevos reportes.
* 🗺️ Mapa interactivo con ubicaciones.
* 🔎 Filtros por especie, zona y características.
* 📍 Búsqueda de mascotas cercanas.
* 📱 Mejoras específicas para dispositivos móviles.
* 💬 Sistema de contacto entre usuarios.
* 📸 Soporte para múltiples fotografías.
* 🐾 Estado del reporte: perdido, encontrado o cerrado.
* 📊 Estadísticas de mascotas recuperadas.
* 🛡️ Mejoras adicionales de seguridad y validación.

---

## 👨‍💻 Autor

Proyecto desarrollado por **Santiago Silva** como proyecto personal de desarrollo web.

---

## 📄 Licencia

Este proyecto se encuentra destinado principalmente a fines educativos y de desarrollo personal.

Si deseas utilizar, modificar o reutilizar partes del proyecto, se recomienda consultar previamente con el autor.
