# Despliegue en Render (Guía rápida)

1. Crear cluster en MongoDB Atlas (free tier)
   - Crear usuario de BD y anotar usuario/contraseña.
   - Permitir conexión desde cualquier IP (0.0.0.0/0) o añadir IPs de Render.
   - Copiar la cadena de conexión (URI) y reemplazar <password> y <dbname>.

2. Subir el repo a GitHub (o Git provider soportado por Render).

3. Crear un nuevo servicio en Render (Web Service)
   - Conectar tu repo y seleccionar la rama.
   - Build Command: `npm install`
   - Start Command: `npm start` o `node server.js`
   - Environment: Node 18+ (o LTS que elijas)

4. Añadir Variables de Entorno (Environment Variables)
   - `MONGO_URI` = tu cadena de conexión de MongoDB Atlas
   - `EMAIL_USER` = tu correo (ej: micorreo@gmail.com)
   - `EMAIL_PASS` = contraseña o App Password de Gmail

5. Opcional: Añadir `render.yaml` para despliegue reproducible (ejemplo en la raíz del repo)

6. Seguridad
   - No subas `.env` al repo. Usa variables de entorno en Render.
   - Revisa los logs en Render si hay errores de conexión.

7. Comprobación
   - En la pestaña de Deploys de Render revisa el build y el start.
   - En tu navegador visita la URL que te asigna Render (o `curl` al `/`).

8. Migración de esquema (si actualizas desde una versión anterior)
   - He añadido un script de migración `backend/scripts/migrate_schema.js` para copiar `isUsed`/`usedBy` al nuevo esquema (`used`, `usedAt`, `ip`).
   - Para ejecutarlo localmente: `cd backend && npm install && npm run migrate` (asegúrate de tener `MONGO_URI` en tu .env o en las env vars de Render si ejecutas `one-off` job).
   - Si despliegas en Render puedes ejecutar un Job manual con `node backend/scripts/migrate_schema.js`.

9. Variables de entorno nuevas
   - `FRONTEND_URL` (opcional): restringe CORS al dominio de tu frontend.
   - No olvides `MONGO_URI`, `EMAIL_USER` y `EMAIL_PASS`.


Si quieres, puedo generar un `render.yaml` de ejemplo y modificar CORS para restringir el origen del frontend desplegado.