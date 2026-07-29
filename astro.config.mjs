import { defineConfig } from 'astro/config';

// Cabeceras de seguridad para el servidor de desarrollo local (`astro dev`).
// Astro genera un sitio 100% estático para GitHub Pages, que no tiene
// servidor propio ni lee este archivo — por eso las cabeceras que SÍ aplican
// en producción viven en otro lado (ver más abajo y SEGURIDAD.md).
// 'unsafe-inline' en script-src SOLO aplica aquí (dev): el cliente de HMR de
// Vite inyecta un script inline al arrancar, y sin esta excepción la página
// queda en blanco en `astro dev`. En build/preview, Astro ya no necesita
// esta excepción porque `security.csp` (abajo) genera hashes reales.
const cabecerasSeguridadDev = {
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
    headers: cabecerasSeguridadDev,
  },

  // CSP real de producción: Astro genera el <meta> de cada página en build
  // con hashes SHA-256 exactos de lo que esa página realmente inlinea — a
  // diferencia de un <meta> escrito a mano, esto no se rompe cuando Astro
  // decide inlinear un script distinto en una futura versión. Solo funciona
  // en `build`/`preview`, no en `dev` (de ahí la cabecera de arriba). Ver
  // SEGURIDAD.md para el detalle completo.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      styleDirective: {
        // Sin 'self' aquí, no queda incluido por defecto una vez que se
        // provee un arreglo propio de resources. El sitio usa bastantes
        // atributos style="" inline estáticos (barras de progreso,
        // márgenes puntuales, etc.); los hashes de Astro no cubren
        // atributos por diseño de CSP, así que se permite 'unsafe-inline'
        // SOLO ahí (style-src-attr), no en hojas de estilo/<style>.
        resources: [
          "'self'",
          'https://fonts.googleapis.com',
          { resource: "'unsafe-inline'", kind: 'attribute' },
        ],
      },
    },
  },
});
