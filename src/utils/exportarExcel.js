import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

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
  "100": "OCTUBRE", "110": "NOVIEMBRE", "120": "DICIEMBRE"
};

export default function exportarExcel(data, columns, proyecto, mes, anio) {
  if (!Array.isArray(columns) || columns.includes(undefined)) {
    console.error("Error: Hay columnas indefinidas en el arreglo `columns`.");
    return;
  }

  // Mapeo de datos
  const exportData = data.map((row, i) => {
    let obj = {};
    columns.forEach((col) => {
      obj[col] = col === "No." ? i + 1 : (row[col] ?? "");
    });
    return obj;
  });

  const worksheet = XLSX.utils.json_to_sheet([], { skipHeader: true });

  // Estilos
  const headerStyle = {
    font: { bold: true, color: { rgb:  proyecto === "SECIHTI" ? "FFFFFF" : "000000" }, size: 12 },
    fill: { fgColor: { rgb: proyecto === "SECIHTI" ? "FF4874C4" : "C5D3FF" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "thin", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "000000" } },
      right: { style: "thin", color: { rgb: "000000" } }
    }
  };

  const textStyle = {
    font: { bold: false, color: { rgb: "000000" }, size: 12 },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: headerStyle.border
  };

  // Para filas variables según proyecto
  const headerRowIndex = proyecto === "SECIHTI" ? 0 : 2; // fila 1 o fila 3

  // FILAS 1 y 2 con contenido especial solo para UNADM y PREPA
  if (["UNADM", "PREPA"].includes(proyecto)) {
    worksheet["H1"] = { t: "s", v: "Tiempo a descontar por espera", s: headerStyle };
    worksheet["J1"] = { t: "s", v: 'Tiempo a descontar por se independientemente acciones "humanas"', s: headerStyle };

    worksheet["F2"] = { t: "s", v: "a", s: headerStyle };
    worksheet["G2"] = { t: "s", v: "b", s: headerStyle };
    worksheet["H2"] = { t: "s", v: "d", s: headerStyle };
    worksheet["I2"] = { t: "s", v: "d1", s: headerStyle };
    worksheet["J2"] = { t: "s", v: "e", s: headerStyle };
    worksheet["K2"] = { t: "s", v: "e1", s: headerStyle };
    worksheet["L2"] = { t: "s", v: "f", s: headerStyle };

    worksheet["!merges"] = [
      { s: { r: 0, c: 7 }, e: { r: 0, c: 8 } },  // H1:I1
      { s: { r: 0, c: 9 }, e: { r: 0, c: 10 } }  // J1:K1
    ];
  }

  // FILA de encabezados (fila 1 para SECIHTI, fila 3 para otros)
  columns.forEach((col, i) => {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: i });
    worksheet[cellRef] = { t: "s", v: col, s: headerStyle };
  });

  // FILA de descripciones manuales solo para UNADM y PREPA en fila 4 (índice 3)
  if (["UNADM", "PREPA"].includes(proyecto)) {
    const descripciones = [
      "(Ticket creado)",
      "(Asignación de ticket a grupo de trabajo)",
      "(Solicitud de información a cliente)",
      "(Respuesta del cliente)",
      "(Fecha y hora de inicio de ejecución por VMs)",
      "(Fecha y hora de solución)",
      "(=f-b(d1-d)-(e1-e)"
    ];
    descripciones.forEach((texto, i) => {
      const colIndex = 5 + i; // F (5) ... M (12)
      const cellRef = XLSX.utils.encode_cell({ r: 3, c: colIndex });
      worksheet[cellRef] = { t: "s", v: texto, s: textStyle };
    });
  }

  // Fila donde empiezan los datos
  const dataStartRow = proyecto === "SECIHTI" ? headerRowIndex + 1 : headerRowIndex + 2;

  // Agregar datos (filas a partir de dataStartRow)
  const aoaData = exportData.map(row => columns.map(col => row[col] ?? ""));
  XLSX.utils.sheet_add_aoa(worksheet, aoaData, { origin: { r: dataStartRow, c: 0 } });

  // Altura de filas
  if (proyecto === "SECIHTI") {
    // Altura fija para encabezado y filas de datos para simular autoajuste
    const filasAltura = [];
    const totalRows = exportData.length + dataStartRow;
    for (let i = 0; i < totalRows; i++) {
      if (i === headerRowIndex) filasAltura.push({ hpt: 40 }); // encabezado alto
      else filasAltura.push({ hpt: 30 }); // filas datos más altas
    }
    worksheet["!rows"] = filasAltura;
  } else {
    // Altura normal para UNADM y PREPA
    worksheet["!rows"] = [
      { hpt: 30 }, // fila 1
      { hpt: 25 }, // fila 2
      { hpt: 40 }, // fila 3
      { hpt: 25 }, // fila 4
    ];
  }

  // Ancho de columnas
  worksheet["!cols"] = columns.map((col) => {
    if (col === "Descripción" || (proyecto === "SECIHTI" && col === "Solución")) return { wch: 50 };
    if (col === "Titulo") return { wch: 30 };
    const maxLen = Math.max(col.length, ...exportData.map((row) => (row[col] ? row[col].toString().length : 0)));
    return { wch: maxLen + 2 };
  });

  // Estilos especiales en filas de datos
  const tiempoColIndex = columns.findIndex((col) => col.includes("Tiempo de Respuesta"));
  if (tiempoColIndex !== -1) {
    for (let i = 0; i < exportData.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: dataStartRow + i, c: tiempoColIndex });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          fill: { fgColor: { rgb: "FFE0E4F4" } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: headerStyle.border
        };
      }
    }
  }

  const descripcionColIndex = columns.findIndex((col) => col === "Descripción");
  if (descripcionColIndex !== -1) {
    for (let i = 0; i < exportData.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: dataStartRow + i, c: descripcionColIndex });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = {
          alignment: { wrapText: true, vertical: "top" },
          border: headerStyle.border
        };
      }
    }
  }

  // Para SECIHTI: Estilo especial en columna Solución (sin fill)
  if (proyecto === "SECIHTI") {
    const solucionColIndex = columns.findIndex((col) => col === "Solución");
    if (solucionColIndex !== -1) {
      for (let i = 0; i < exportData.length; i++) {
        const cellRef = XLSX.utils.encode_cell({ r: dataStartRow + i, c: solucionColIndex });
        if (worksheet[cellRef]) {
          worksheet[cellRef].s = {
            alignment: { wrapText: true, vertical: "top" },
            border: headerStyle.border,
            fill: { fgColor: { rgb: "FFFFFF" } }
          };
        }
      }
    }
  }

  // Bordes generales en datos (filas de datos)
  for (let r = dataStartRow; r < dataStartRow + exportData.length; r++) {
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

  const nombreMes = nombreMesMap[mes] || "MES";
  const annio = anio || "AÑO";
  const fileName = `Entregable_${proyecto}_${nombreMes}_${annio}.xlsx`;

  const buffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true
  });

  const blob = new Blob([buffer], { type: "application/octet-stream" });
  saveAs(blob, fileName);
}
