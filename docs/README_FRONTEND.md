# Despliegue del frontend (static site)

Recomendado para Render: crear un **Static Site** apuntando a la carpeta `docs/`.

Pasos rápidos:
- Conecta el repo con Render.
- Crea un nuevo `Static Site` y selecciona la rama.
- Publish directory: `docs`
- No necesitas build commands si son páginas estáticas.

Configurar la URL del backend en el frontend:
- Por defecto el JS usa `window.__API_BASE__ || ''`.
- Puedes poner en tu `index.html` o `premio.html` un snippet en el `<head>`:
  ```html
  <script>
    // Cambia a la URL del backend desplegado en Render
    window.__API_BASE__ = 'https://tu-backend.onrender.com';
  </script>
  ```
- Si el frontend y el backend están en el mismo dominio (p.ej si sirves los archivos desde el servidor), no hace falta establecer `__API_BASE__`.

CORS:
- Si usas frontend en un dominio distinto, añade su URL como `FRONTEND_URL` en el `.env` del backend (o como variable en Render) para restringir orígenes.
