export function normalizarSecihti(row) {
  return {
    ID: row["ID"] || "",
    "No.": "", // Si no existe, déjalo vacío o genera un índice si quieres
    "Identificador de Solicitud": row["ID"] || "",
    "Fecha y hora de apertura": row["Fecha de apertura"] || "",
    "Titulo": row["Título"] || "",
    "Solicitante": row["Solicitante - Solicitante"] || "",
    "Descripción": row["Descripción"] || "",
    "Servicio": row["Category"] || "",
    "Actividad": "", // No está en tu CSV, déjalo vacío
    "Categoría": "", // No está en tu CSV, déjalo vacío
    "Subcategoria": "", // No está en tu CSV, déjalo vacío
    "Prioridad": row["Prioridad"] || "",
    "Estado": row["Status"] || "",
    "Solución": row["Soluciones - Soluciones"] || "",
    "Fecha de Solución": row["Fecha de resolución"] || ""
  };
}
export function normalizarMujeres(row) {
  return {
    ID: row["ID"] || "",
    Titulo: row["Título"] || "",
    Estado: row["Status"] || "",
    Tipo: row["Type"] || "",
    "Fecha de apertura": row["Fecha de apertura"] || "",
    Prioridad: row["Prioridad"] || "",
    "Última edición por": row["Última edicion por"] || "",
     "Asignado a - Grupo de técnicos": row["Asignado a - Grupo técnico"] || "",
    Solicitante: row["Solicitante - Solicitante"] || "",
    Categoría: row["Category"] || "",
    Descripción: row["Descripción"] || "",
    "Fecha de solución": row["Fecha de resolución"] || "",
    Solución: row["Soluciones - Soluciones"] || "",
    "Atendió": row["Plugins - Personal que Atendió - Personal que Atendió"] || "",
    "Última modificación": row["Última modificación"] || "",
  };
}
