# Portal Institucional — Subsecretaría de Derechos Humanos y Población de Michoacán

Sitio web institucional 100% estático, construido con **Astro 7** y publicado en **GitHub Pages**. Incluye consulta del marco normativo, organigrama interactivo, un curso gratuito de derechos humanos con constancia descargable en PDF, y un formulario de contacto blindado contra bots — todo sin backend ni base de datos.

🔗 **Sitio en vivo:** https://laurapamelaarandamedrano-dot.github.io/portal-sdhp/

---

## Stack tecnológico

| Herramienta | Versión | Uso |
|---|---|---|
| [Astro](https://astro.build) | 7.1.6 | Framework principal, genera HTML estático en build |
| Node.js | ≥22.12.0 (requisito de Astro 7) | Entorno de desarrollo y build |
| [jsPDF](https://github.com/parallax/jsPDF) + [html2canvas](https://html2canvas.hertzen.com/) | — | Generación de la constancia del curso en PDF, 100% en el navegador |
| CSS puro (variables/custom properties) | — | Sin frameworks de CSS (ni Tailwind ni Bootstrap) |
| Vanilla JS (`<script>` por página) | — | Sin React/Vue/Svelte; cada página maneja su propia interactividad |

No hay backend, base de datos, autenticación de usuarios ni servicios de terceros más allá de Google Fonts.

---

## Estructura del proyecto

```
portal-sdhp/
├── .github/workflows/deploy.yml     — CI/CD: build + deploy a GitHub Pages
├── astro.config.mjs                 — Config de Astro (site, base, CSP nativa)
├── public/
│   ├── _headers                     — Cabeceras HTTP (Netlify/Cloudflare Pages; GitHub Pages no las lee)
│   └── images/
├── src/
│   ├── layouts/
│   │   └── BaseLayout.astro         — <head>, meta tags, Nav + Footer
│   ├── components/
│   │   ├── Nav.astro                — Navegación + menú móvil
│   │   └── Footer.astro
│   ├── pages/
│   │   ├── index.astro              — Inicio (hero + carrusel 3D de frases)
│   │   ├── nosotros.astro           — Quiénes somos + marco normativo (resumen)
│   │   ├── normativa.astro          — Buscador/filtro de documentos legales
│   │   ├── organigrama.astro        — Organigrama interactivo (árbol expandible)
│   │   ├── contacto.astro           — Formulario de contacto con anti-spam
│   │   ├── privacidad.astro         — Aviso de privacidad (LGPDPPSO)
│   │   ├── 404.astro
│   │   └── cursos/
│   │       ├── index.astro          — Catálogo de cursos
│   │       └── introduccion-derechos-humanos.astro  — Curso 1 completo (6 módulos + quiz + constancia PDF)
│   ├── utils/
│   │   ├── url.ts                   — `withBase()`: resuelve rutas con el `base` de GitHub Pages
│   │   └── cursoStorage.js          — Progreso de cursos en localStorage (sin datos personales)
│   └── styles/global.css            — Tokens de diseño (colores, tipografía, espaciado) y estilos globales
├── SEGURIDAD.md                     — Postura de seguridad completa (para auditorías/dictamen)
└── package.json
```

---

## Desarrollo local

Requiere **Node.js ≥22.12.0** (Astro 7 no arranca con versiones menores).

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo (http://localhost:4321)
npm run dev

# Build de producción → carpeta dist/
npm run build

# Previsualizar el build de producción localmente
npm run preview
```

> **Nota:** la Content-Security-Policy "real" (con hashes por página) solo se genera en `build`/`preview`. En `astro dev` corre una CSP más permisiva aparte, solo para desarrollo — ver `SEGURIDAD.md`.

---

## Despliegue

El repositorio despliega automáticamente a GitHub Pages con cada push a `main`, vía `.github/workflows/deploy.yml`:

1. `actions/checkout@v4`
2. `actions/setup-node@v4` (Node 22)
3. `npm ci`
4. `npm run build`
5. `actions/upload-pages-artifact@v3` (sube `dist/`)
6. `actions/deploy-pages@v4`

Para verificar un despliegue: pestaña **Actions** del repo → correr más reciente de "Deploy Astro to GitHub Pages".

Si el sitio cambia de nombre de repo o de usuario/organización, hay que actualizar `site` y `base` en `astro.config.mjs` para que coincidan.

---

## Manual técnico

### 1. Arquitectura general

Todo el sitio se compila a HTML/CSS/JS estático en `npm run build`. No existe ningún endpoint de servidor: los formularios, el buscador, el organigrama y el curso funcionan enteramente con JavaScript del lado del cliente. Esto significa:

- No hay inyección SQL posible (no hay SQL).
- No hay sesiones que robar (no hay sesiones).
- El único dato que "sale" del navegador de un visitante es lo que él mismo escribe en el formulario de contacto — y ni siquiera eso se envía a ningún lado todavía (ver sección 6).

### 2. Sistema de diseño (`src/styles/global.css`)

Paleta institucional, expuesta como variables CSS:

| Token | Hex | Uso |
|---|---|---|
| `--color-guinda` | `#4A001F` | Color primario: headers, botones, títulos |
| `--color-morado` | `#6A0F49` | Secundario: gradientes, acentos |
| `--color-rosa` | `#FFC3D0` | Acento: badges, highlights, autor de frases |
| `--color-salvia` | `#6D807F` | Texto secundario, bordes, metadatos |
| `--color-fondo` / `--color-fondo-alt` | `#FAF7F8` / `#F3EEF0` | Fondos de sección |
| `--color-texto` / `--color-texto-muted` | `#1A0A0F` / `#5A4550` | Texto principal / secundario |

Tipografía: **Nunito** (`--font-display`, títulos y elementos destacados) y **DM Sans** (`--font-body`, texto corrido), cargadas desde Google Fonts. Escala tipográfica y espaciado también son variables (`--text-*`, `--space-*`) para mantener consistencia entre páginas.

### 3. Páginas y funcionalidad

- **Inicio (`index.astro`):** hero con carrusel de 6 frases con efecto 3D (CSS `perspective`/`rotateX`/`rotateY`/`translateZ`, con fallback a fade simple si el usuario tiene `prefers-reduced-motion`), accesos rápidos, cursos destacados.
- **Organigrama (`organigrama.astro`):** árbol jerárquico generado desde una estructura de datos en el frontmatter (fácil de editar/ampliar). Cada nodo es clickeable: expande/colapsa hijos y muestra su descripción en un panel lateral (o abajo, en móvil). Sin `onclick` inline — todo con `addEventListener`, requisito de la CSP estricta.
- **Normativa (`normativa.astro`):** catálogo de documentos legales (internacional/federal/estatal) con buscador por nombre y filtro por nivel, ambos en JS vanilla sin recargar la página.
- **Contacto (`contacto.astro`):** formulario con:
  - **Honeypot** (campo oculto que solo un bot llenaría).
  - **Rate limiting en cliente** (máx. 3 envíos por 10 minutos, vía `localStorage`).
  - **Sanitización** del nombre antes de reflejarlo en el mensaje de confirmación (escape de HTML).
  - El envío hoy es **simulado** (no hay backend todavía); está marcado en el código con un comentario para cuando se conecte a un endpoint real.
- **Privacidad (`privacidad.astro`):** aviso conforme a la Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados.

### 4. Sistema de cursos (`cursos/introduccion-derechos-humanos.astro`)

- 6 módulos de contenido (texto, citas, tablas comparativas, líneas de tiempo, todo como componentes HTML estilizados, no `<table>` planas).
- Cada módulo tiene un quiz de opción múltiple. **Responder (bien o mal) siempre permite avanzar** — el quiz nunca bloquea el progreso del curso, solo afecta la calificación final.
- El progreso (qué módulo se respondió y si fue correcto) se guarda en `localStorage` vía `src/utils/cursoStorage.js` — **nunca se guarda el nombre de la persona**, solo indicadores por módulo (`sdhp_curso_<id>_modulo_<n>`).
- Al terminar los 6 módulos:
  - Si la calificación final es **≥80%**, se habilita descargar la constancia en PDF.
  - Si es menor, se invita a repasar; cada quiz tiene un botón "↺ Intentar de nuevo" para volver a responder sin perder el resto del avance.
- La constancia se genera con **jsPDF + html2canvas**, capturando únicamente el diseño del certificado (sin nav/footer), en orientación horizontal tipo diploma, con folio local (hash corto, sin servicios externos). El nombre que el usuario escribe se sanitiza (solo letras/espacios/acentos, máx. 100 caracteres) y se inserta siempre vía `textContent`, nunca `innerHTML`.

### 5. Seguridad

El detalle completo vive en **[`SEGURIDAD.md`](./SEGURIDAD.md)** (pensado para dictámenes de ciberseguridad), pero en resumen:

- **CSP nativa de Astro** (`security.csp` en `astro.config.mjs`): cada página lleva su propia Content-Security-Policy con hashes SHA-256 exactos de lo que esa página inlinea, generada automáticamente en cada build. Por eso **no hay `onclick=""` inline en ningún lado del sitio** — todo usa `addEventListener`.
- `X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`: documentadas en `public/_headers` para cuando el sitio tenga un host que sí lea cabeceras HTTP (GitHub Pages no lo permite).
- Todos los enlaces externos (`target="_blank"`) llevan `rel="noopener noreferrer"`.
- Sin cookies de rastreo, sin analítica de terceros, sin autenticación.

### 6. Cómo agregar/editar contenido

- **Nueva ley en Normativa:** agregar un objeto al arreglo `documentos` en `normativa.astro` (título, nivel, año, descripción, URL oficial).
- **Nuevo nodo en el Organigrama:** agregar un objeto al árbol `organigrama` en `organigrama.astro` (nombre, descripción, hijos). Hay comentarios `TODO` marcando qué partes de la jerarquía actual son aproximaciones pendientes de verificar contra el Reglamento Interior oficial.
- **Nuevo curso:** duplicar la estructura de `introduccion-derechos-humanos.astro`, reutilizando `cursoStorage.js` con un `CURSO_ID` distinto.

### 7. Problemas comunes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Node.js vX is not supported by Astro` en CI | El workflow quedó con una versión de Node vieja | Confirmar que `.github/workflows/deploy.yml` use `node-version: 22` (o mayor) |
| Un botón/carrusel deja de responder tras actualizar Astro | Astro empezó a inlinear un script que antes iba externo, y el CSP lo bloquea | No agregar `unsafe-inline`: revisar que el hash se regenere corriendo `npm run build` de nuevo; si persiste, revisar `astro.config.mjs` → `security.csp` |
| La página se ve en blanco en `astro dev` | Cliente de HMR de Vite bloqueado por CSP | Ya está resuelto vía `server.headers` en `astro.config.mjs` (dev-only) |

---

## Licencia

_(agregar aquí la licencia correspondiente, si aplica)_
