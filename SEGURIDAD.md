# Seguridad — Portal SDHP

Este documento describe la postura de seguridad del portal institucional de la
Subsecretaría de Derechos Humanos y Población de Michoacán, para efectos del
dictamen de ciberseguridad de Gobierno Digital.

**Última actualización:** 2026-07-30.

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
| `Content-Security-Policy` | `'self'` + hashes SHA-256 por página (ver detalle abajo) | Limita de qué orígenes puede cargar scripts, estilos y fuentes, mitigando XSS e inyección de recursos externos maliciosos. |
| `X-Frame-Options` | `DENY` | Evita que el sitio se embeba en un `<iframe>` ajeno (clickjacking). |
| `X-Content-Type-Options` | `nosniff` | Evita que el navegador "adivine" el tipo de contenido de un archivo, mitigando ataques de MIME-sniffing. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Evita filtrar la URL completa (con posibles parámetros) a sitios externos al seguir un enlace. |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | El sitio no necesita cámara, micrófono ni geolocalización; se deshabilitan explícitamente aunque nunca se pidan. |

**CSP — usamos el soporte nativo de Astro, no un `<meta>` escrito a mano.**
Astro (desde v6) puede generar por sí mismo, en cada build, una CSP con
hashes SHA-256 exactos del contenido que esa página en particular inlinea
(`security.csp` en `astro.config.mjs`). Esto reemplazó una primera versión
manual que escribíamos nosotros mismos como `<meta>` fijo: esa versión se
rompió en producción cuando una actualización de Astro empezó a inlinear
scripts que antes iban en archivos externos (el `script-src 'self'` sin
`unsafe-inline` los bloqueaba silenciosamente — sin esto, el carrusel de
frases y algunos botones dejaron de responder). La versión nativa de Astro
se genera de nuevo en cada `npm run build`, así que no se vuelve a romper
si una futura versión de Astro decide inlinear algo distinto.

`style-src` permite `'unsafe-inline'`, pero **acotado solo a atributos**
(`kind: 'attribute'`, ver `astro.config.mjs`) — el sitio usa bastantes
atributos `style=""` estáticos (barras de progreso, colores dinámicos del
organigrama). Las hojas de estilo (`<style>`, `.css`) siguen restringidas a
`'self'` + hashes, sin excepción. `script-src` **no** tiene ninguna
excepción de `unsafe-inline`/`unsafe-hashes`: todo el JavaScript del sitio
se conecta con `addEventListener` (nunca `onclick=""` inline), así que no
necesitamos debilitar esa directiva en absoluto.

**Limitación importante — léase con atención:** GitHub Pages **no permite
configurar cabeceras HTTP personalizadas**; no hay servidor propio que las
envíe. Por eso las cabeceras de la tabla existen en varios lugares
distintos, con distinto alcance real:

1. **CSP de producción (`<meta>` auto-generado por Astro, punto anterior)**
   — es la que de verdad ve un visitante. Solo se genera en `build`/`preview`,
   no en `dev` (ver punto 2).
2. **`astro.config.mjs` (`server.headers`)** — cabeceras aparte que solo
   aplican cuando alguien corre `npm run dev` en su máquina (la CSP nativa de
   Astro no funciona en modo dev). Aquí `script-src` sí incluye
   `'unsafe-inline'` porque el cliente de HMR de Vite inyecta un script
   inline al arrancar el dev server; sin esa excepción la página queda en
   blanco en `astro dev`. Sin efecto en producción.
3. **`public/_headers`** — formato estándar de Netlify/Cloudflare Pages, para
   `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` y
   `Permissions-Policy` (**sin** CSP: un valor único y estático no puede
   incluir los hashes correctos de cada página). GitHub Pages no lo lee;
   queda listo para el día que el sitio se migre a un host que sí lo
   soporte, o se coloque un proxy (p. ej. Cloudflare gratuito) delante de
   GitHub Pages.
4. **`<meta http-equiv="Referrer-Policy">` en `BaseLayout.astro`** — de las
   cuatro cabeceras restantes, **solo esta** puede entregarse vía `<meta>` y
   sí tiene efecto real en el sitio publicado hoy en GitHub Pages.
   `X-Frame-Options`, `X-Content-Type-Options` y `Permissions-Policy` **no**
   tienen equivalente en `<meta>` — los navegadores los ignoran ahí por
   diseño. Mientras el sitio siga en GitHub Pages sin proxy, esas tres
   cabeceras **no están activas en producción**; solo quedan
   documentadas/preparadas en `public/_headers`.

Recomendación concreta si se necesita que todas las cabeceras apliquen de
verdad en producción: poner el dominio detrás de Cloudflare (plan gratuito)
y configurar un "Transform Rule" o "Response Header" ahí, o migrar el
hosting a Netlify/Cloudflare Pages (que sí leen `public/_headers`).

La CSP permite explícitamente Google Fonts (`fonts.googleapis.com` para el
CSS, `fonts.gstatic.com` para los archivos de fuente) porque es el único
recurso de terceros que carga el sitio.

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

### 2.5 Constancia de curso en PDF

La constancia del Curso 1 se genera **100% en el navegador**, sin backend ni
servicio externo:

- **Librerías:** `jsPDF` + `html2canvas` (ambas cliente-only, sin llamadas de
  red). El botón de descarga solo se muestra si la calificación final del
  curso (aciertos de los 6 quizzes) es de al menos 80% — si no, se invita a
  repasar y reintentar los quizzes fallados, sin exponer ningún botón de
  descarga.
- **Nombre del participante:** se filtra en cada tecla a solo letras, espacios
  y acentos (`sanitizarNombreEntrada`), con tope de 100 caracteres, y se
  inserta en el DOM siempre vía `textContent` — nunca `innerHTML` con el
  valor del usuario. Se probó explícitamente con una entrada tipo
  `<script>alert(1)</script>`: el resultado se renderiza como texto plano
  inocuo, sin ejecutar nada.
- **Nombre del archivo descargado:** se deriva del nombre sanitizado
  (`sanitizarNombreArchivo`), quitando acentos y cualquier carácter que no
  sea letra o número, para evitar problemas con el sistema de archivos.
- **Folio:** un hash corto (`hashCorto`) calculado localmente a partir del
  nombre + la fecha/hora exacta de la descarga — no es criptográfico, no
  identifica a la persona por sí solo, y no depende de ningún servicio
  externo.

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
