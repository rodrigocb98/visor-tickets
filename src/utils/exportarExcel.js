import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

// Mapa para traducir número de mes a nombre en español
const nombreMesMap = {
  "010": "ENERO", "1": "ENERO",
  "020": "FEBRERO", "2": "FEBRERO",
  "030": "MARZO", "3": "MARZO",
  "040": "ABRIL", "4": "ABRIL",
  "050": "MAYO", "5": "MAYO",
  "060": "JUNIO", "6": "JUNIO",
  "070": "JULIO", "7": "JULIO",
  "080": "AGOSTO", "8": "AGOSTO",
  "090": "SEPTIEMBRE", "9": "SEPTIEMBRE",
  "100": "OCTUBRE",
  "110": "NOVIEMBRE",
  "120": "DICIEMBRE"
};

export default function exportarExcel(data, columns, proyecto, mes, anio) {
  const exportData = data.map((row, i) => {
    let obj = {};
    columns.forEach((col) => {
      obj[col] = col === "No." ? i + 1 : row[col] || "";
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFFFF" }, size: 12 },
    fill: {
      fgColor: {
        rgb: proyecto === "SECIHTI" ? "FF4874C4" : "FF283464"
      }
    },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "FF000000" } },
      bottom: { style: "thin", color: { rgb: "FF000000" } },
      left: { style: "thin", color: { rgb: "FF000000" } },
      right: { style: "thin", color: { rgb: "FF000000" } }
    }
  };

  columns.forEach((col, i) => {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
    if (worksheet[cellRef]) worksheet[cellRef].s = headerStyle;
  });

  worksheet["!rows"] = [{ hpt: 40 }];

  worksheet["!cols"] = columns.map((col) => {
    if (col === "Descripción" || (proyecto === "SECIHTI" && col === "Solución")) return { wch: 50 };
    if (col === "Titulo") return { wch: 30 };
    const maxLen = Math.max(
      col.length,
      ...exportData.map((row) => (row[col] ? row[col].toString().length : 0))
    );
    return { wch: maxLen + 2 };
  });

  // Estilo especial para algunas columnas
  const tiempoColIndex = columns.findIndex((col) => col.includes("Tiempo de Respuesta"));
  if (tiempoColIndex !== -1) {
    for (let i = 0; i < exportData.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: tiempoColIndex });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          fill: { fgColor: { rgb: "FFE0E4F4" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: headerStyle.border
        };
      }
    }
  }

  const descripcionColIndex = columns.indexOf("Descripción");
  if (descripcionColIndex !== -1) {
    for (let i = 0; i < exportData.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: descripcionColIndex });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          alignment: { wrapText: true, vertical: "top" },
          border: headerStyle.border
        };
      }
    }
  }

  if (proyecto === "SECIHTI") {
    const solucionColIndex = columns.indexOf("Solución");
    if (solucionColIndex !== -1) {
      for (let i = 0; i < exportData.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: solucionColIndex });
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            alignment: { wrapText: true, vertical: "top" },
            border: headerStyle.border,
            fill: { fgColor: { rgb: "FFF0F7F9" } }
          };
        }
      }
    }
  }

  // Bordes para todas las celdas
  for (let r = 1; r <= exportData.length; r++) {
    for (let c = 0; c < columns.length; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c });
      if (!worksheet[cellRef]) continue;
      worksheet[cellRef].s = {
        ...worksheet[cellRef].s,
        border: headerStyle.border
      };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true
  });

  // Usa el mes y año filtrado
  const nombreMes = nombreMesMap[mes] || "MES";
  const annio = anio || "AÑO";
  const fileName = `Entregable_${proyecto}_${nombreMes}_${annio}.xlsx`;

  const blob = new Blob([buffer], { type: "application/octet-stream" });
  saveAs(blob, fileName);
}
