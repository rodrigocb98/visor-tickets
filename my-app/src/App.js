import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";
import "./App.css";

const nombreMes = {
  "100": "Octubre", "020": "Febrero", "030": "Marzo", "040": "Abril",
  "050": "Mayo", "060": "Junio", "070": "Julio", "080": "Agosto",
  "090": "Septiembre", "010": "Enero", "110": "Noviembre", "120": "Diciembre"
};

const parseFecha = (fechaStr) => {
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

const cleanDescription = (text) => {
  const frasesAEliminar = [
    "Buena tarde,", "Buenas tardes", "Buena tarde", "Saludos y gracias", "Buenas tardes,",
    "Saludos", "Buena noche", "Buenas noches", "Buen día", "Buena noche, ", ", "
  ];
  let nueva = text || "";
  frasesAEliminar.forEach(frase => {
    const regex = new RegExp(frase, "gi");
    nueva = nueva.replace(regex, "").trim();
  });
  return nueva;
};

export default function CsvTicketViewer() {
  const [data, setData] = useState([]);
  const [filtroAnio, setFiltroAnio] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [mesesDisponibles, setMesesDisponibles] = useState([]);

  const normalizeString = (str) => str?.replace(/[^0-9]/g, "") || "";

  const extractAnioMesYNumero = (idRaw) => {
    const id = normalizeString(idRaw);
    return {
      anio: id.slice(0, 4),
      mes: id.slice(4, 7),
      num: parseInt(id.slice(7), 10),
    };
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          let rows = results.data.filter(row => row["ID"]);

          // Preliminar: limpiar campos y aplicar parseo
          rows = rows.map(row => {
            const fechaSolucion = parseFecha(row["Fecha de solución"]);
            const fechaApertura = parseFecha(row["Fecha de apertura"]);
            row["Descripción"] = cleanDescription(row["Descripción"]);
            const diff = fechaSolucion && fechaApertura ? fechaSolucion - fechaApertura : null;

            const tiempoRespuesta = diff !== null ?
              `${Math.floor(diff / (1000 * 60 * 60 * 24))}d ${Math.floor((diff / (1000 * 60 * 60)) % 24)}h ${Math.floor((diff / (1000 * 60)) % 60)}m ${Math.floor((diff / 1000) % 60)}s`
              : "Error en fechas";

            return {
              ...row,
              "Descripción": cleanDescription(row["Descripción"]),
              "Asignado a - Grupo de técnicos": (row["Asignado a - Grupo de técnicos"] || "").replace(/<br\s*\/?>/gi, ", "),
              "Tiempo de Respuesta": tiempoRespuesta,
            };
          });

          // Ordenar
          const sorted = [...rows].sort((a, b) => normalizeString(a["ID"]).localeCompare(normalizeString(b["ID"])));

          const ids = sorted.map(r => normalizeString(r["ID"]));
          const anios = [...new Set(ids.map(id => id.slice(0, 4)))].sort();
          const meses = [...new Set(ids.map(id => id.slice(4, 7)))].sort();

          setData(sorted);
          setAniosDisponibles(anios);
          setMesesDisponibles(meses);
          setFiltroAnio("");
          setFiltroMes("");
        },
      });
    }
  };

  const filteredData = data.filter((row) => {
    const { anio, mes } = extractAnioMesYNumero(row["ID"]);
    return (!filtroAnio || anio === filtroAnio) && (!filtroMes || mes === filtroMes);
  });

  const columns = [
    "No.", "ID", "Fecha de apertura", "Título", "Tipo", "Descripción",
    "Tiempo de Respuesta", "Fecha de solución", "Prioridad",
    "Asignado a - Grupo de técnicos", "Observaciones"
  ];

  const exportarExcel = () => {
    const exportData = filteredData.map((row, i) => {
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
    };

    // Estilo para columna "Tiempo de Respuesta"
    const tiempoStyle = {
      fill: { fgColor: { rgb: "e0e4f4" } }, // 
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    };

    // Aplicar estilos a encabezados
    columns.forEach((col, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      if (worksheet[cellRef]) worksheet[cellRef].s = headerStyle;
    });

    // Identificar el índice de la columna "Tiempo de Respuesta"
    const tiempoColIndex = columns.indexOf("Tiempo de Respuesta");

    // Aplicar color a celdas en esa columna
    for (let i = 0; i < exportData.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: tiempoColIndex });
      if (!worksheet[cellRef]) continue;
      worksheet[cellRef].s = tiempoStyle;
    }

    // Ajuste automático de columnas con estilo especial para "Descripción"
    worksheet["!cols"] = columns.map((col) => {
      if (col === "Descripción") {
        return {
          wch: 50, // Ancho limitado
        };
      }
      const maxLen = Math.max(
        col.length,
        ...exportData.map((row) => (row[col] ? row[col].toString().length : 0))
      );
      return { wch: maxLen + 2 };
    });
    const descripcionColIndex = columns.indexOf("Descripción");
    const descripcionStyle = {
      alignment: { wrapText: true, vertical: "top" }
    };
    for (let i = 0; i < exportData.length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: descripcionColIndex });
      if (worksheet[cellRef]) {
        worksheet[cellRef].s = descripcionStyle;
      }
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
      cellStyles: true,
    });

    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, "Entregable.xlsx");
  };

  return (
    <div className="app-container">
      <h1 className="header">Visor de Tickets (CSV)</h1>
      <input type="file" accept=".csv" onChange={handleFileUpload} className="file-input" />

      {data.length > 0 && (
        <div className="filters-container">
          <label>Año:
            <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}>
              <option value="">Todos</option>
              {aniosDisponibles.map(anio => <option key={anio}>{anio}</option>)}
            </select>
          </label>
          <label>Mes:
            <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
              <option value="">Todos</option>
              {mesesDisponibles.map(mes => <option key={mes} value={mes}>{nombreMes[mes] || mes}</option>)}
            </select>
          </label>
          <button onClick={exportarExcel}>Exportar Excel</button>
        </div>
      )}

      {filteredData.length > 0 && (
        <div className="ticket-table-container">
          <p style={{ color: "#64b5f6", textAlign: "center" }}>{filteredData.length} resultado(s) encontrado(s)</p>
          <table className="ticket-table">
            <thead>
              <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
            </thead>
            <tbody>
              {filteredData.map((row, i) => (
                <tr key={i}>
                  {columns.map(col => <td key={col}>{col === "No." ? i + 1 : row[col] || ""}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
