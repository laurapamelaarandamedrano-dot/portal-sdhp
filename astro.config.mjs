import { defineConfig } from 'astro/config';

// Cabeceras de seguridad para el servidor de desarrollo/preview local
// (`astro dev` / `astro preview`). Astro genera un sitio 100% estático para
// GitHub Pages, que no tiene servidor propio ni lee este archivo — por eso
// las mismas cabeceras se replican en public/_headers (para hosts que sí las
// aplican, como Netlify/Cloudflare Pages) y, en la medida en que el navegador
// lo permite vía <meta>, en src/layouts/BaseLayout.astro. Ver SEGURIDAD.md.
// Nota: 'unsafe-inline' en script-src SOLO aplica aquí (dev/preview local).
// El Vite dev server inyecta scripts inline para su cliente de HMR y con
// script-src 'self' a secas los bloquea por completo, dejando el sitio en
// blanco en modo `astro dev`. La CSP real de producción (en BaseLayout.astro
// vía <meta>, la única que de verdad ve un visitante) NO tiene esta
// excepción — ver SEGURIDAD.md.
const cabecerasSeguridad = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default defineConfig({
  site: 'https://laurapamelaarandamedrano-dot.github.io',
  base: '/portal-sdhp', // Debe coincidir exactamente con el nombre de tu repositorio
  server: {
    headers: cabecerasSeguridad,
  },
});
