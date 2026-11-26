# Publicar la app gratis con GitHub Pages

GitHub Pages aloja gratis páginas hechas con HTML, CSS y JavaScript, como esta.
Te da una dirección del tipo `https://TU-USUARIO.github.io/portugues/` que abrís desde el iPhone.
No hace falta instalar nada: se hace todo desde la web de GitHub.

> Ojo: con la cuenta gratis el repositorio tiene que ser **público**, o sea que cualquiera puede ver el código y las tarjetas.
> Tu **progreso no se sube**: queda guardado solo en tu teléfono.

---

## 1. Crear la cuenta (si no tenés)
1. Entrá a <https://github.com/signup> y creá la cuenta.
2. El nombre de usuario va a quedar en la dirección de la app (`usuario.github.io`).

## 2. Crear el repositorio (la "carpeta" en GitHub)
1. Arriba a la derecha tocá **+** → **New repository**.
2. **Repository name:** `portugues`
3. Marcá **Public**.
4. No toques nada más y tocá **Create repository**.

## 3. Subir los archivos
1. En la página del repositorio recién creado, tocá el link **uploading an existing file**.
2. En tu PC abrí la carpeta `Desktop\ClaudeCode\portugues-tarjetas`.
3. Seleccioná **todo lo que hay adentro** (Ctrl+A), incluida la carpeta `icons`, y arrastralo a la página de GitHub.
   - Arrastrá el **contenido**, no la carpeta `portugues-tarjetas` entera: `index.html` tiene que quedar "en la raíz".
   - Si arrastrás con Chrome o Edge, la carpeta `icons` sube con sus 3 imágenes adentro. Fijate en la lista que aparezcan `icons/icon-192.png`, `icons/icon-512.png` e `icons/apple-touch-icon.png`.
4. Abajo, tocá **Commit changes** (es "guardar los cambios").

## 4. Prender GitHub Pages
1. En el repositorio, andá a **Settings** (arriba, el engranaje).
2. En el menú de la izquierda, **Pages**.
3. En **Build and deployment** → **Source** elegí **Deploy from a branch**.
4. En **Branch** elegí **main** y la carpeta **/ (root)**. Tocá **Save**.
5. Esperá 1 o 2 minutos y recargá esa página: arriba aparece **"Your site is live at https://TU-USUARIO.github.io/portugues/"**.
6. Abrí ese link en la PC para comprobar que carga.

## 5. Instalarla en el iPhone
1. Abrí el link con **Safari** (tiene que ser Safari, no Chrome).
2. Tocá el botón **Compartir** (el cuadrado con la flecha para arriba).
3. Bajá y tocá **Agregar a inicio** → **Agregar**.
4. Listo: aparece el ícono "Portugués" en la pantalla de inicio. Abrila siempre **desde ese ícono**.
5. Para probar que anda sin internet: abrila una vez con internet, cerrala, poné el modo avión y volvé a abrirla.

### Importante sobre tus datos en el iPhone
- La app del ícono guarda su progreso **aparte** de la pestaña de Safari. Si estudiás en la pestaña y después abrís el ícono, no vas a ver ese progreso. Usá siempre el ícono.
- Una vez por semana: **Ajustes → Exportar backup → Guardar en Archivos** (o mandátelo por WhatsApp/Mail).
  Si algún día se borra todo, entrás a **Ajustes → Importar backup** y elegís ese archivo.
- La app te avisa en el inicio si hace más de 7 días que no hacés backup.

---

## Cómo actualizarla si cambiamos algo
1. En el repositorio de GitHub tocá **Add file → Upload files**.
2. Arrastrá los archivos que cambiaron (con el mismo nombre se reemplazan) y tocá **Commit changes**.
3. Esperá 1 o 2 minutos. En el iPhone, abrí la app, cerrala y volvela a abrir: la versión nueva aparece **la segunda vez** que la abrís (la primera usa la copia guardada para andar sin internet).

Tus tarjetas y tu progreso **no se pierden** al actualizar: viven en el teléfono, no en GitHub.

## Sincronización entre aparatos
- En un aparato: **Ajustes → Sincronizar entre aparatos → Activar en este aparato**. Te muestra un código (16 letras y números).
- En el otro: mismo lugar, escribí el código y tocá **Vincular**. Las tarjetas y el progreso de los dos se combinan sin perder nada.
- Después se sincroniza solo: al abrir la app, al terminar una tanda, al editar tarjetas y al salir.
- El servidor es un Worker de Cloudflare (carpeta `sync/`). Si cambiás `sync/worker.js`: `npx wrangler deploy` desde `sync/`.

## Para probarla en la PC
- Con Claude Code: pedile "abrí la app de portugués" (usa el servidor `portugues-tarjetas` de `.claude/launch.json`).
- Las pruebas del repaso espaciado: en esta carpeta, `node pruebas.js`.
- Si cambiás el dibujo del ícono: `python generar_iconos.py`.
- Audios de pronunciación (voz brasileña de Kokoro, local y gratis): agregá palabras en `audio/extra.txt` y corré
  `..\piloto-canal\tools\venv\Scripts\python.exe -X utf8 generar_audios.py`. Las palabras sin audio grabado usan la voz del teléfono.
