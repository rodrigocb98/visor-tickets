// utils/getDescripcion.js

export const getDescripcion = (row) => {
  return (
    row["Descripción"] ||
    row["Descripcion"] ||
    row["descripcion"] ||
    row["Detalle"] ||
    row["Comentario"] ||
    ""
  );
};
