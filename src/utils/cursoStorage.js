// Progreso de cursos persistido en localStorage — sin backend, sin datos personales.
// Solo se guarda un indicador por módulo completado (cursoId + moduloId), nunca
// nombres, correos ni ninguna otra información identificable del usuario.

const PREFIJO = 'sdhp_curso';

function claveModulo(cursoId, moduloId) {
  return `${PREFIJO}_${cursoId}_modulo_${moduloId}`;
}

// El valor guardado codifica si la respuesta fue correcta ('1') o no ('0');
// `obtenerProgreso` solo mira si la clave existe (módulo respondido),
// `obtenerCorrectas` sí distingue el valor (para calcular la calificación).
export function guardarProgreso(cursoId, moduloId, esCorrecta = true) {
  try {
    localStorage.setItem(claveModulo(cursoId, moduloId), esCorrecta ? '1' : '0');
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

// Módulos cuyo quiz está respondido CORRECTAMENTE ahora mismo (útil para
// calcular la calificación final y decidir si se habilita la constancia).
export function obtenerCorrectas(cursoId) {
  const correctas = [];
  const prefijoCurso = `${PREFIJO}_${cursoId}_modulo_`;

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefijoCurso)) continue;
      const moduloId = Number(key.slice(prefijoCurso.length));
      if (!Number.isNaN(moduloId) && localStorage.getItem(key) === '1') correctas.push(moduloId);
    }
  } catch {
    // localStorage no disponible — se devuelve vacío.
  }

  return correctas.sort((a, b) => a - b);
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
