export const parseFecha = (fechaStr) => {
  if (!fechaStr) return null;
  const regexDDMMYYYY = /^(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})$/;
  const regexISO = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/;
  let match;

  if ((match = fechaStr.match(regexDDMMYYYY))) {
    const [, dd, mm, yyyy, hh, min] = match;
    return new Date(`${yyyy}-${mm}-${dd}T${hh}:${min}:00`);
  } else if ((match = fechaStr.match(regexISO))) {
    return new Date(fechaStr);
  } else {
    const d = new Date(fechaStr);
    return isNaN(d) ? null : d;
  }
};
