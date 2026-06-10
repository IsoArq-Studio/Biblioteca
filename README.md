# Biblioteca IsoArq

Biblioteca web de recursos para arquitectura y AutoCAD. El frontend es estatico y se puede publicar en GitHub Pages. Los datos no se escanean en vivo desde Drive: se leen desde un Google Sheet indexado por Apps Script, lo que evita los timeouts de Google Drive.

## Estado actual

- Frontend: HTML, CSS y JavaScript sin framework.
- Backend de datos: Google Apps Script + Google Sheets.
- Endpoint activo: https://script.google.com/macros/s/AKfycby1ZP_9fInLR4mjdRhQ1a0tWid9etzbaMRO8xQExJqFwJUqn-LpaJThu4rzzYkAy7pr/exec
- Build/cache esperado: 20260609-review-fix-v22.
- Conteo esperado aproximado en frontend: 3454 archivos y 12 secciones.
- El logo del encabezado enlaza a Instagram: https://www.instagram.com/isoarq_studio/

## Estructura

```
index.html
src/
  app.js
  config.js
  styles.css
assets/
apps-script/
  Code.gs
  appsscript.json
```

## Publicar en GitHub Pages

1. Entra a GitHub con la cuenta de IsoArq.
2. Crea un repositorio, por ejemplo: `biblioteca-isoarq`.
3. Sube estos archivos al repositorio, manteniendo la estructura de carpetas.
4. Verifica que exista `.nojekyll` en la raiz.
5. En GitHub: `Settings > Pages`.
6. Selecciona `Deploy from a branch`.
7. Branch: `main`.
8. Folder: `/root`.
9. Guarda y espera a que GitHub publique.

La URL esperada tendra una forma parecida a:

```
https://USUARIO.github.io/biblioteca-isoarq/
```

## Actualizar datos de la biblioteca

1. Agrega o corrige recursos en Google Drive.
2. Ejecuta en Apps Script la funcion de indexado por lotes hasta que el registro muestre `done: true`.
3. Revisa que el Google Sheet tenga las filas esperadas.
4. Abre el endpoint de Apps Script y confirma que responda con `"success": true`.
5. Recarga la biblioteca en navegador.

## Notas de seguridad

- No subir claves privadas, tokens ni archivos `.env`.
- `src/config.js` solo debe contener la URL publica del endpoint.
- El endpoint de Apps Script debe estar publicado para que cualquiera pueda verlo si GitHub Pages sera publico.
- El Google Sheet puede seguir protegido; Apps Script es quien lo lee.

## Verificacion rapida

Antes de publicar:

- La pagina carga sin el panel negro de debug.
- El contador muestra miles de recursos, no 53.
- El logo se ve completo y abre Instagram.
- Los filtros de Biblioteca, PDF, Libros, AutoCAD y Favoritos funcionan.
- Los botones Ver y Descargar abren enlaces de Google Drive.
