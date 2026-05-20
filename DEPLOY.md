# Deploy en Railway (backend + frontend)

La base de datos está en Supabase, así que solo deployamos **backend** y **frontend**.

## 0. Prerrequisitos

```powershell
# Instalar CLI
npm i -g @railway/cli

# Login (abre el navegador)
railway login
```

## 1. Crear proyecto y vincularlo

```powershell
cd C:\Users\gian_\dev\scheduling-unt

# Crear proyecto nuevo
railway init

# O vincular a uno existente
railway link
```

## 2. Crear los 2 servicios

```powershell
railway add --service backend
railway add --service frontend
```

## 3. Variables del backend

```powershell
railway variable set `
  'DB_HOST=xxx.supabase.co' `
  'DB_PORT=6543' `
  'DB_USER=postgres' `
  'DB_PASS=tu-password' `
  'DB_NAME=postgres' `
  'JWT_SECRET=un-secreto-largo' `
  'JWT_EXPIRES_IN=8h' `
  'ADMIN_USER=admin' `
  'ADMIN_PASS=admin123' `
  'DOCENTE_PASSWORD=docente123' `
  'NODE_ENV=production' `
  --service backend
```

> Railway asigna `PORT` automáticamente. No lo setees.
> Puerto 6543 = Supabase pooling (transaction mode). 5432 = conexión directa.

## 4. Deploy del backend

```powershell
railway up .\backend --service backend --path-as-root --detach
```

## 5. Dominio público del backend

```powershell
railway domain --service backend
```

Guarda la URL que te da (ej: `backend-production-xxxx.up.railway.app`).

## 6. Variables del frontend

```powershell
railway variable set `
  'VITE_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}/api' `
  --service frontend
```

> `${{backend.RAILWAY_PUBLIC_DOMAIN}}` se resuelve automáticamente al dominio del backend.

## 7. Deploy del frontend

```powershell
railway up .\frontend --service frontend --path-as-root --detach
```

## 8. Dominio público del frontend

```powershell
railway domain --service frontend
```

## Comandos útiles

```powershell
# Ver logs en tiempo real
railway logs --service backend
railway logs --service frontend

# Ver variables seteadas
railway variables --service backend

# Redeploy sin subir código nuevo
railway redeploy --service backend

# Abrir el dashboard en el navegador
railway open
```

## Arquitectura final

```
Navegador
  ├─ frontend.railway.app  (React + Vite)
  │    └─ VITE_API_URL → https://backend.railway.app/api
  │
  └─ backend.railway.app   (Express)
       └─ DB_HOST → Supabase PostgreSQL
```
