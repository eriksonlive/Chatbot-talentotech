export function procesarCitas(dataxlsx) {
  const citas = [];

  for (const fila of dataxlsx) {
    for (const key in fila) {
      const valor = fila[key];
      if (valor && typeof valor === 'string' && valor.includes('El')) {
        const [fecha, profesional] = valor.trim().split('\n');
        if (fecha && profesional) {
          citas.push({
            fecha: fecha.trim(), // Ej: "El 24 a las 12:30"
            profesional: profesional.trim(), // Ej: "DAVES ROLENZO LAM LEUNG"
          });
        }
      }
    }
  }

  return citas;
}