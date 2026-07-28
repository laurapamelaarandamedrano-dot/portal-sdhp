# Seguridad — Portal SDHP

Este documento describe la postura de seguridad del portal institucional de la
Subsecretaría de Derechos Humanos y Población de Michoacán, para efectos del
dictamen de ciberseguridad de Gobierno Digital.

**Última actualización:** 2026-07-28.

## 1. Naturaleza del sitio

El portal es un sitio **100% estático**, generado con Astro y publicado en
GitHub Pages:

- No hay backend, servidor de aplicación ni base de datos.
- No hay autenticación de usuarios ni sesiones.
- Todo el código que corre "en el servidor" es en realidad HTML/CSS/JS
  generado en tiempo de compilación (`npm run build`); lo único que se
  ejecuta con datos del usuario corre en su propio navegador.

Esto reduce drásticamente la superficie de ataque típica de un sitio de
gobierno (no hay inyección SQL posible porque no hay SQL; no hay RCE de
backend porque no hay backend; no hay fuga de sesión porque no hay sesión).

## 2. Medidas implementadas y por qué

### 2.1 Cabeceras de seguridad (CSP, X-Frame-Options, etc.)

Se definieron las siguientes cabeceras/directivas:

| Cabecera | Valor | Por qué |
|---|---|---|
| `Content-Security-Policy` | solo `'self'` + Google Fonts (ver detalle abajo) | Limita de qué orígenes puede cargar scripts, estilos y fuentes, mitigando XSS e inyección de recursos externos maliciosos. |
| `X-Frame-Options` | `DENY` | Evita que el sitio se embeba en un `<iframe>` ajeno (clickjacking). |
| `X-Content-Type-Options` | `nosniff` | Evita que el navegador "adivine" el tipo de contenido de un archivo, mitigando ataques de MIME-sniffing. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Evita filtrar la URL completa (con posibles parámetros) a sitios externos al seguir un enlace. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | El sitio no necesita cámara, micrófono ni geolocalización; se deshabilitan explícitamente aunque nunca se pidan. |

**Limitación importante — léase con atención:** GitHub Pages **no permite
configurar cabeceras HTTP personalizadas**; no hay servidor propio que las
envíe. Por eso estas cabeceras existen en tres lugares distintos, con
distinto alcance real:

1. **`astro.config.mjs` (`server.headers`)** — se aplican solo cuando alguien
   corre `npm run dev` o `npm run preview` en su máquina. Útil para desarrollo,
   **sin efecto en producción**.
2. **`public/_headers`** — formato estándar de Netlify/Cloudflare Pages.
   GitHub Pages no lo lee. Queda listo para el día que el sitio se migre a un
   host que sí lo soporte, o se coloque un proxy (p. ej. Cloudflare gratuito)
   delante de GitHub Pages.
3. **`<meta http-equiv="...">` en `BaseLayout.astro`** — de las cinco
   cabeceras de la tabla, **solo `Content-Security-Policy` y `Referrer-Policy`
   pueden entregarse vía `<meta>`** y sí tienen efecto real en el sitio
   publicado hoy en GitHub Pages. `X-Frame-Options`, `X-Content-Type-Options`
   y `Permissions-Policy` **no** tienen equivalente en `<meta>` — los
   navegadores los ignoran ahí por diseño. Mientras el sitio siga en GitHub
   Pages sin proxy, esas tres cabeceras **no están activas en producción**;
   solo quedan documentadas/preparadas en `public/_headers`.

Recomendación concreta si se necesita que las cinco cabeceras apliquen de
verdad en producción: poner el dominio detrás de Cloudflare (plan gratuito)
y configurar un "Transform Rule" o "Response Header" ahí, o migrar el
hosting a Netlify/Cloudflare Pages (que sí leen `public/_headers`).

La CSP permite explícitamente Google Fonts (`fonts.googleapis.com` para el
CSS, `fonts.gstatic.com` para los archivos de fuente) porque es el único
recurso de terceros que carga el sitio. Incluye `'unsafe-inline'` en
`style-src` porque el sitio usa atributos `style=""` inline en varios
componentes (barras de progreso, colores dinámicos del organigrama, etc.);
no hay `'unsafe-inline'` en `script-src`.

### 2.2 Formulario de contacto

El formulario de `/contacto` es el único punto donde el sitio recibe texto
libre de un visitante. Se implementaron tres mitigaciones, todas del lado
del cliente (no hay backend al que protejer, pero sí se documenta el patrón
para cuando exista uno):

- **Honeypot:** un campo (`sitio_web`) oculto visualmente pero presente en
  el DOM. Las personas nunca lo ven ni lo llenan; los bots que autollenan
  formularios sí. Si llega lleno, se descarta silenciosamente el envío sin
  avisar al bot que fue detectado.
- **Rate limiting simulado (localStorage):** máximo 3 envíos por ventana de
  10 minutos, contados en el propio navegador. Es una mitigación básica de
  abuso mientras no hay backend — no sustituye un rate limit real del lado
  del servidor si en el futuro el formulario se conecta a un endpoint.
- **Sanitización antes de mostrar en pantalla:** el nombre capturado se
  refleja en el mensaje de confirmación pasado por una función de escape de
  HTML (`escapeHtml`, basada en `textContent`/`innerHTML` del propio DOM),
  para que caracteres como `<script>` nunca se interpreten como marcado.

El formulario **no envía datos a ningún lado** actualmente: el "envío" es una
simulación (`setTimeout`) documentada en el código con un comentario
`// en producción: fetch a un endpoint`. No hay riesgo de fuga porque los
datos nunca salen del navegador del usuario.

### 2.3 Enlaces externos

Todos los enlaces que abren en pestaña nueva (`target="_blank"`) llevan
`rel="noopener noreferrer"`, para evitar que la página destino controle
`window.opener` (tabnabbing) y para no filtrar el referrer a sitios externos.

### 2.4 Progreso de cursos en localStorage — sin datos personales

El sistema de cursos (`src/utils/cursoStorage.js`) guarda en `localStorage`
únicamente un indicador por módulo completado, con claves del tipo
`sdhp_curso_<cursoId>_modulo_<n>`. **Nunca se guarda el nombre de la persona,
correo, ni ningún otro dato identificable.** El nombre que se escribe para
la constancia PDF vive solo en memoria/DOM mientras la página está abierta
(vía `textContent`, nunca `innerHTML`) y se descarta al cerrar o recargar la
pestaña; no se persiste en ningún almacenamiento del navegador.

## 3. Qué NO hace este sitio

- **No tiene backend ni base de datos** — no hay nada que hackear del lado
  del servidor porque no existe.
- **No recaba datos sensibles** — el único dato que se pide es el del
  formulario de contacto (nombre, correo, mensaje), y solo para responder la
  solicitud. Ver [`/privacidad`](src/pages/privacidad.astro) para el aviso
  completo.
- **No usa cookies de rastreo ni analítica de terceros** — no hay Google
  Analytics, píxeles de redes sociales, ni ningún script de tracking.
- **No usa autenticación** — no hay cuentas de usuario, contraseñas ni
  sesiones que proteger o que puedan filtrarse.
- **No transfiere datos a terceros** — nada de lo que el usuario escribe en
  el sitio (contacto, constancia) se envía a ningún servicio externo.

## 4. Cómo reportar una vulnerabilidad

Si encuentras una vulnerabilidad de seguridad en este sitio, repórtala de
forma responsable escribiendo a:

**ddhh@michoacan.gob.mx**

Por favor incluye:

- Una descripción clara del problema y los pasos para reproducirlo.
- El impacto potencial (qué podría hacer un atacante con esto).
- Si es posible, una prueba de concepto no destructiva.

Pedimos no explotar la vulnerabilidad más allá de lo necesario para
demostrarla, no acceder ni modificar datos que no te pertenezcan, y darnos
un plazo razonable para corregirla antes de hacerla pública. No existe
actualmente un programa formal de recompensas (bug bounty); los reportes se
atienden como parte del mantenimiento normal del sitio.

<!-- TODO: agregar un contacto/canal dedicado de seguridad si Gobierno
     Digital lo requiere para el dictamen (distinto del correo institucional
     general de la Subsecretaría). -->
