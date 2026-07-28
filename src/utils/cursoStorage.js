// Progreso de cursos persistido en localStorage — sin backend, sin datos personales.
// Solo se guarda un indicador por módulo completado (cursoId + moduloId), nunca
// nombres, correos ni ninguna otra información identificable del usuario.

const PREFIJO = 'sdhp_curso';

function claveModulo(cursoId, moduloId) {
  return `${PREFIJO}_${cursoId}_modulo_${moduloId}`;
}

export function guardarProgreso(cursoId, moduloId) {
  try {
    localStorage.setItem(claveModulo(cursoId, moduloId), '1');
  } catch {
    // localStorage no disponible (modo privado, cuota excedida, etc.) — se ignora.
  }
}

export function obtenerProgreso(cursoId) {
  const completados = [];
  const prefijoCurso = `${PREFIJO}_${cursoId}_modulo_`;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefijoCurso)) continue;
      const moduloId = Number(key.slice(prefijoCurso.length));
      if (!Number.isNaN(moduloId)) completados.push(moduloId);
    }
  } catch {
    // localStorage no disponible — se devuelve progreso vacío.
  }

  return completados.sort((a, b) => a - b);
}

export function limpiarProgreso(cursoId) {
  const prefijoCurso = `${PREFIJO}_${cursoId}_modulo_`;

  try {
    const keysABorrar = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefijoCurso)) keysABorrar.push(key);
    }
    keysABorrar.forEach(key => localStorage.removeItem(key));
  } catch {
    // localStorage no disponible — no hay nada que limpiar.
  }
}
