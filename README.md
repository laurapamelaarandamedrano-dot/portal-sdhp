# Portal Institucional — Subsecretaría de Derechos Humanos y Población de Michoacán

Sitio estático construido con **Astro 4** + **GitHub Pages**.

## Estructura

```
src/
├── layouts/BaseLayout.astro       — Layout base (meta SEO, nav, footer)
├── components/
│   ├── Nav.astro                  — Navegación principal con menú móvil
│   └── Footer.astro               — Pie de página
├── pages/
│   ├── index.astro                — Página de inicio
│   ├── semaforo.astro             — Consulta de recomendaciones CEDH/CNDH
│   ├── nosotros.astro             — Quiénes somos + marco normativo
│   ├── contacto.astro             — Formulario de contacto
│   ├── cursos/index.astro         — Catálogo de cursos
│   └── cursos/
│       └── introduccion-derechos-humanos.astro  — Curso 1 completo
├── styles/global.css              — Tokens de diseño y estilos globales
└── 404.astro                      — Página de error
```

## Inicio rápido

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Generar sitio estático
npm run build

# Vista previa del build
npm run preview
```

## Paleta de colores

| Token            | Hex       | Uso                          |
|------------------|-----------|------------------------------|
| `--color-guinda` | `#4A001F` | Primario, headers, botones   |
| `--color-morado` | `#6A0F49` | Secundario, gradientes       |
| `--color-rosa`   | `#FFC3D0` | Acento, badges, highlights   |
| `--color-salvia` | `#6D807F` | Texto secundario, bordes     |

## Semáforo de recomendaciones

El archivo `semaforo.astro` contiene datos demo hardcodeados en la variable `datosDemo`.
Para conectar con datos reales, reemplaza esa variable con un `fetch()` a tu API o CMS.

Expedientes de prueba:
- `CEDH/2024/001234` → En proceso (amarillo)
- `CNDH/2023/005678` → Cumplida (verde)
- `CEDH/2025/000099` → Pendiente (rojo)

## Deploy en GitHub Pages

1. Actualiza `astro.config.mjs` con tu usuario/repositorio real:
   ```js
   site: 'https://tu-usuario.github.io',
   base: '/nombre-del-repo/', // si no es el repo raíz
   ```

2. Añade el workflow de GitHub Actions:
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   jobs:
     build:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: 20 }
         - run: npm ci
         - run: npm run build
         - uses: actions/upload-pages-artifact@v3
           with: { path: dist }
     deploy:
       needs: build
       runs-on: ubuntu-latest
       permissions:
         pages: write
         id-token: write
       environment:
         name: github-pages
         url: ${{ steps.deployment.outputs.page_url }}
       steps:
         - uses: actions/deploy-pages@v4
           id: deployment
   ```

## Accesibilidad

- Skip link para saltar al contenido principal
- ARIA labels en navegación, formularios y secciones
- `aria-live` en resultados del semáforo
- `aria-current="page"` en el enlace activo
- Contraste WCAG AA verificado en todos los colores
- `prefers-reduced-motion` respetado en animaciones
- Navegación por teclado en todos los elementos interactivos

## Próximos pasos

- [ ] Conectar semáforo con API real (Google Sheets, Airtable, o endpoint propio)
- [ ] Agregar más cursos (módulos 2 y 3 ya tienen estructura)
- [ ] Integrar formulario de contacto con email (Resend, Formspree, o endpoint propio)
- [ ] Agregar constancia PDF con jsPDF o Puppeteer
- [ ] Favicon oficial de la Subsecretaría
- [ ] Analytics (sin cookies, p.ej. Plausible o Umami)
