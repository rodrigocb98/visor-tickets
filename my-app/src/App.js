import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
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

export default function CsvTicketViewer() {
  const [data, setData] = useState([]);
  const [filtroAnio, setFiltroAnio] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [mesesDisponibles, setMesesDisponibles] = useState([]);

  const normalizeString = (str) => str?.replace(/[^0-9]/g, "") || "";

  const extractAnioMesFromId = (idRaw) => {
    const id = normalizeString(idRaw);
    return {
      anio: id.slice(0, 4),
      mes: id.slice(4, 7),
      solicitud: parseInt(id.slice(7), 10)
    };
  };

  const cleanDescription = (text) => {
    const frasesAEliminar = [
      "Buena tarde,", "Buenas tardes", "Buena tarde", "Saludos y gracias","Buenas tardes,",
      "Saludos", "Buena noche", "Buenas noches", "Buen día","Buena noche, "
    ];
    let nueva = text || "";
    frasesAEliminar.forEach(frase => {
      const regex = new RegExp(frase, "gi");
      nueva = nueva.replace(regex, "").trim();
    });
    return nueva;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          let rows = results.data.filter(
            (row) => row["ID"] && row["Fecha de apertura"] && row["Fecha de solución"]
          );

          rows = rows.map((row) => {
            row["Descripción"] = cleanDescription(row["Descripción"]);
            row["Asignado a - Grupo de técnicos"] = row["Asignado a - Grupo de técnicos"]?.replace(/<br\s*\/?>/gi, ", ") || "";
            return row;
          });

          const sorted = [...rows].sort((a, b) => {
            const idA = normalizeString(a["ID"]);
            const idB = normalizeString(b["ID"]);
            return idA.localeCompare(idB);
          });

          const processed = sorted.map((row) => {
            const fechaApertura = parseFecha(row["Fecha de apertura"]);
            const fechaSolucion = parseFecha(row["Fecha de solución"]);
            let tiempoRespuesta = "";

            if (fechaApertura && fechaSolucion) {
              const diffMs = fechaSolucion - fechaApertura;
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              const diffHrs = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
              const diffMins = Math.floor((diffMs / (1000 * 60)) % 60);
              const diffSecs = Math.floor((diffMs / 1000) % 60);
              tiempoRespuesta = `${diffDays}d ${diffHrs}h ${diffMins}m ${diffSecs}s`;
            } else {
              tiempoRespuesta = "Error en fechas";
            }

            return {
              ...row,
              "Tiempo de Respuesta": tiempoRespuesta,
            };
          });

          const ids = processed.map((row) => normalizeString(row["ID"]));
          const anios = [...new Set(ids.map((id) => id.slice(0, 4)))].sort();
          const meses = [...new Set(ids.map((id) => id.slice(4, 7)))].sort();

          setAniosDisponibles(anios);
          setMesesDisponibles(meses);
          setData(processed);
          setFiltroAnio("");
          setFiltroMes("");
        },
      });
    }
  };

  const filteredData = (() => {
    const base = data.filter((row) => {
      const { anio, mes } = extractAnioMesFromId(row["ID"]);
      return (!filtroAnio || anio === filtroAnio) && (!filtroMes || mes === filtroMes);
    });

    const solicitudes = base.map(row => extractAnioMesFromId(row["ID"]).solicitud);
    const min = Math.min(...solicitudes);
    const max = Math.max(...solicitudes);
    const completadoPorNumero = new Map();

    base.forEach(row => {
      const { solicitud } = extractAnioMesFromId(row["ID"]);
      completadoPorNumero.set(solicitud, row);
    });

    const final = [];
    let contador = 1;
    for (let i = min; i <= max; i++) {
      if (completadoPorNumero.has(i)) {
        final.push({
          ...completadoPorNumero.get(i),
          "No.": contador++,
          "Solicitud": i
        });
      } else {
        final.push({
          "No.": contador++,
          "ID": "Solicitud no encontrada",
          "Solicitud": i
        });
      }
    }
    return final;
  })();

  const columns = [
    "No.", "ID", "Fecha de apertura", "Título", "Tipo", "Descripción",
    "Tiempo de Respuesta", "Fecha de solución", "Prioridad",
    "Asignado a - Grupo de técnicos", "Observaciones"
  ];

  const exportarExcel = () => {
    const exportData = filteredData.map(row => {
      let obj = {};
      columns.forEach(col => {
        obj[col] = row[col] || "";
      });
      return obj;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const dataBlob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(dataBlob, "tickets_filtrados.xlsx");
  };

  return (
    <div className="app-container">
      <h1 className="header">Visor de Tickets (CSV)</h1>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="file-input"
      />

      {data.length > 0 && (
        <div className="filters-container">
          <label>
            Año:
            <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}>
              <option value="">Todos</option>
              {aniosDisponibles.map((anio) => (
                <option key={anio} value={anio}>{anio}</option>
              ))}
            </select>
          </label>

          <label>
            Mes:
            <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
              <option value="">Todos</option>
              {mesesDisponibles.map((mes) => (
                <option key={mes} value={mes}>
                  {nombreMes[mes] || mes}
                </option>
              ))}
            </select>
          </label>

          <button onClick={exportarExcel}>Exportar Excel</button>
        </div>
      )}

      {filteredData.length > 0 ? (
        <>
          <p style={{ color: "#64b5f6", marginBottom: "1rem", textAlign: "center" }}>
            {filteredData.length} resultado(s) encontrado(s)
          </p>
          <div className="ticket-table-container">
            <table className="ticket-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col}>{row[col] || ""}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : data.length > 0 ? (
        <p style={{ color: "#f88", textAlign: "center", fontWeight: "600" }}>
          No se encontraron resultados con ese año y mes.
        </p>
      ) : null}
    </div>
  );
}
