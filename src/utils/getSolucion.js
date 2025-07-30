export const getSolucion = (row) => {
  return (
    row["Solución"] ||
    row["Solucion"] ||
    row["solucion"] ||
    ""
  );
};
