# CatalogOS

Catálogo de negocios con panel de administración.

## Stack
- **Next.js 14** (modo servidor)
- **Vercel Blob** para imágenes y datos en producción
- **Filesystem local** para imágenes y datos en desarrollo
- **Middleware** para proteger `/admin` con contraseña

---

## Desarrollo local

```bash
cp .env.local.example .env.local
# Edita .env.local → pon ADMIN_PASSWORD

npm install
npm run dev
# http://localhost:3000
# Panel: http://localhost:3000/admin
```

En local, **no necesitas** `BLOB_READ_WRITE_TOKEN`.  
Los datos se leen/escriben en `data/` y las imágenes en `public/uploads/`.

---

## Deploy en Vercel

### 1. Configura el Blob Store

En el dashboard de Vercel:  
`Settings → Storage → Create Database → Blob`

Vercel agrega automáticamente `BLOB_READ_WRITE_TOKEN` a las env vars del proyecto.

### 2. Variables de entorno en Vercel

```
ADMIN_PASSWORD=tu-contrasena-muy-segura
```
(BLOB_READ_WRITE_TOKEN la agrega Vercel automáticamente)

### 3. Sube los datos iniciales al Blob

Después del primer deploy, ejecuta el seed localmente con tu token:

```bash
# En .env.local agrega temporalmente:
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxx   ← cópialo del dashboard de Vercel

npm run seed-blob
```

Esto sube todos los `.json` de `data/` al Blob Store.  
Las **imágenes** se suben desde el panel de admin después del deploy.

---

## Backup

Desde el panel de admin (`/admin`), el botón **💾 Backup** descarga un `.zip` con:

```
catalogos-backup-2025-03-10_14-30.zip
├── data/
│   ├── businesses.json
│   ├── config.json
│   ├── business/
│   │   ├── burger-house.json
│   │   └── pizza-palace.json
│   └── products/
│       ├── burger-house.json
│       └── pizza-palace.json
└── public/
    └── uploads/
        ├── 1234-burger-logo.jpg
        └── 5678-pizza-cover.png
```

Para restaurar en local: extrae el zip en la raíz del proyecto.  
Para restaurar en producción: vuelve a correr `npm run seed-blob` con los JSON restaurados.

---

## Arquitectura de storage

```
┌─────────────────────────────────────────────────────┐
│                  lib/storage.ts                      │
│           (StorageDriver interface)                  │
│  getDriver() → BlobDriver si BLOB_READ_WRITE_TOKEN   │
│             → FsDriver   si no hay token             │
└──────────────┬──────────────────┬───────────────────┘
               │                  │
    ┌──────────▼──────┐  ┌────────▼────────┐
    │  storage.blob   │  │   storage.fs    │
    │  (Vercel Blob)  │  │  (filesystem)   │
    │  producción     │  │  desarrollo     │
    └─────────────────┘  └─────────────────┘
               │
    ┌──────────▼────────────────────────────┐
    │  /api/data   /api/upload  /api/backup │
    │  (únicos puntos de acceso a storage)  │
    └───────────────────────────────────────┘
```

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Catálogo de negocios |
| `/{slug}` | Catálogo de un negocio |
| `/view/{slug}` | Pedido compartido |
| `/admin` | Panel de administración (requiere contraseña) |
| `/login` | Login del admin |
| `/api/data` | CRUD de datos JSON |
| `/api/upload` | Subida de imágenes |
| `/api/backup` | Descarga backup ZIP |
| `/api/auth/login` | Autenticación |
| `/api/auth/logout` | Cerrar sesión |
