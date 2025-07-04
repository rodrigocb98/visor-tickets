import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

export default function exportarExcel(data, columns) {
  const exportData = data.map((row, i) => {
    let obj = {};
    columns.forEach((col) => {
      obj[col] = col === "No." ? i + 1 : row[col] || "";
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Estilo de encabezados
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "283464" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } },
    },
  };

  // Aplicar estilo a encabezados
  columns.forEach((col, i) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
    if (worksheet[cellRef]) worksheet[cellRef].s = headerStyle;
  });

  worksheet["!rows"] = [{ hpt: 40 }]; // altura de encabezado

  // Estilo especial para columna "Tiempo de Respuesta"
  const tiempoColIndex = columns.findIndex((col) => col.includes("Tiempo de Respuesta"));
  const tiempoStyle = {
    fill: { fgColor: { rgb: "e0e4f4" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: headerStyle.border,
  };

  for (let i = 0; i < exportData.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: tiempoColIndex });
    if (worksheet[cellRef]) worksheet[cellRef].s = tiempoStyle;
  }

  // Ajustar tamaño de columnas
  worksheet["!cols"] = columns.map((col) => {
    if (col === "Descripción") return { wch: 50 };
    const maxLen = Math.max(
      col.length,
      ...exportData.map((row) => (row[col] ? row[col].toString().length : 0))
    );
    return { wch: maxLen + 2 };
  });

  // Estilo para la columna "Descripción"
  const descripcionColIndex = columns.indexOf("Descripción");
  const descripcionStyle = {
    alignment: { wrapText: true, vertical: "top" },
    border: headerStyle.border,
  };

  for (let i = 0; i < exportData.length; i++) {
    const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: descripcionColIndex });
    if (worksheet[cellRef]) worksheet[cellRef].s = descripcionStyle;
  }

  // Bordes por defecto para todas las celdas
  for (let r = 1; r <= exportData.length; r++) {
    for (let c = 0; c < columns.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!worksheet[cellRef]) continue;
      worksheet[cellRef].s = {
        ...worksheet[cellRef].s,
        border: headerStyle.border,
      };
    }
  }

  // Crear y exportar el archivo
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true,
  });

  const blob = new Blob([buffer], { type: "application/octet-stream" });
  saveAs(blob, "Entregable.xlsx");
}
