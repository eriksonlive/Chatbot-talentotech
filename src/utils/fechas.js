export const normalizarFecha = (fechaTexto) => {
  const limpio = fechaTexto.replace(/El\s*/i, '').trim();

  if (/^\d{1,2}$/.test(limpio)) {
    const day = limpio.padStart(2, '0');
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(limpio)) {
    return limpio;
  }

  return null;
};