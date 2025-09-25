import React, { useState } from "react";
import Papa from "papaparse";
import Header from "./components/Header";
import FileUploader from "./components/FileUploader";
import Filters from "./components/Filters";
import TicketTable from "./components/TicketTable";
import exportarExcel from "./utils/exportarExcel";
import { parseFecha } from "./utils/parseFecha";
import { cleanDescription } from "./utils/cleanDescription";
import { normalizarSecihti, normalizarMujeres } from "./utils/normalizar";
import exportarExcelMujeres from "./utils/exportarMujeres";
import { getDescripcion } from "./utils/getDescripcion";
import { getSolucion } from "./utils/getSolucion";
import { columnMapping } from "./utils/mapColumnNames";
import "./App.css";

const nombreMes = {
  "010": "Enero", "020": "Febrero", "030": "Marzo", "040": "Abril",
  "050": "Mayo", "060": "Junio", "070": "Julio", "080": "Agosto",
  "090": "Septiembre", "100": "Octubre", "110": "Noviembre", "120": "Diciembre"
};

// 🔹 Helpers para el cálculo
const safeDiff = (f1, f2) => {
  if (!f1 || !f2) return 0;
  return f1 - f2;
};

const formatDiff = (ms) => {
  if (ms === null) return null;
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  const h = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const m = Math.floor((ms / (1000 * 60)) % 60);
  const s = Math.floor((ms / 1000) % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
};

export default function CsvTicketViewer({ proyecto, volver }) {
  const [data, setData] = useState([]);
  const [filtroAnio, setFiltroAnio] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroTecnico, setFiltroTecnico] = useState("");
  const [aniosDisponibles, setAniosDisponibles] = useState([]);
  const [mesesDisponibles, setMesesDisponibles] = useState([]);
  const [tecnicosDisponibles, setTecnicosDisponibles] = useState([]);

  const normalizeString = (str) => str?.replace(/[^0-9]/g, "") || "";

  const extractAnioMesYNumero = (idRaw) => {
    const id = normalizeString(idRaw);
    return {
      anio: id.slice(0, 4),
      mes: id.slice(4, 7),
      num: parseInt(id.slice(7), 10),
    };
  };

  const detectarDelimitador = (contenido) => {
    const linea = contenido.split("\n")[0];
    return linea.includes(";") ? ";" : ",";
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target.result;
      const delimitador = detectarDelimitador(contenido);

      Papa.parse(contenido, {
        header: true,
        skipEmptyLines: true,
        delimiter: delimitador,
        complete: (results) => {
          let rows = results.data;

          // 🔹 Normalizar nombres de columnas
          rows = rows.map(row => {
            const newRow = {};
            Object.keys(row).forEach(colName => {
              const newColName = columnMapping[colName] || colName;
              newRow[newColName] = row[colName];
            });
            return newRow;
          });

          if (proyecto === "SECIHTI") {
            rows = rows.map(normalizarSecihti).filter(r => r.ID && r.ID.trim() !== "");
              rows = rows.map(row => {
            let servicio = row["Servicio"] || "";
            let partes = servicio.split(">").map(p => p.trim());

            let servicioBase = partes[0] || "";
            let actividad = partes[1] || "";
            let categoria = partes[2] || "";
            let subcategoria = partes[3] || "";

            return {
              ...row,
              "Servicio": servicioBase,
              "Actividad": actividad,
              "Categoría": categoria,
              "Subcategoria": subcategoria,
            };
          });
            
          } else if (proyecto === "MUJERES") {
            rows = rows.map(normalizarMujeres).filter(r => r.ID && r.ID.trim() !== "");
          } else {
            rows = rows.filter(row => row["ID"] && row["ID"].trim() !== "");
          }

          const tecnicoSet = new Set();

          rows = rows.map(row => {
            // 🔹 Fechas para tiempo respuesta
            const fechaSolucion = parseFecha(row["Fecha de solución"] || row["Fecha de resolución"] || "");
            const fechaApertura = parseFecha(row["Fecha y hora de apertura"] || row["Fecha de apertura"] || "");
            const diff = fechaSolucion && fechaApertura ? fechaSolucion - fechaApertura : null;

            const tiempoRespuesta = diff !== null
              ? `${Math.floor(diff / (1000 * 60 * 60 * 24))}d ${Math.floor((diff / (1000 * 60 * 60)) % 24)}h ${Math.floor((diff / (1000 * 60)) % 60)}m ${Math.floor((diff / 1000) % 60)}s`
              : "Error en fechas";

            // 🔹 Fechas para tiempo efectivo de atención
            const fechaResolucion = parseFecha(row["Fecha de solución"] || row["Fecha de resolución"] || "");
            const fechaInicioTrabajos = parseFecha(row["Fecha y hora de inicio de trabajos"] || "");
            const fechaSolicitudInfo = parseFecha(row["(Opcional. Solicitud de retroalimentación, elementos adicionales o similares)"] || "");
            const fechaRespuestaOperador = parseFecha(row["Respuesta de operador"] || "");
            const fechaEjecucion = parseFecha(row["(Opcional. Ejecución de tareas por maquina p.e conversión OVA, copiado, etc.)"] || "");
            const fechaConclusion = parseFecha(row["Conclusión de tareas por máquina"] || "");

            let tiempoEfectivo = null;
            if (fechaResolucion && fechaInicioTrabajos) {
              const base = fechaResolucion - fechaInicioTrabajos;

              // ✅ si safeDiff devuelve null/undefined => usa 0
              const resta1 = safeDiff(fechaRespuestaOperador, fechaSolicitudInfo) || 0;
              const resta2 = safeDiff(fechaConclusion, fechaEjecucion) || 0;

              tiempoEfectivo = base - resta1 - resta2;
            }

            const tiempoEfectivoFmt = tiempoEfectivo !== null ? formatDiff(tiempoEfectivo) : null;


            // 🔹 Técnicos
            const grupoTecnicos = (row["Asignado a - Grupo de técnicos"] || "").replace(/<br\s*\/?>/gi, ", ");
            const tecnicosIndividuales = grupoTecnicos
              .split(",")
              .map(t => t.trim())
              .filter(Boolean);

            tecnicosIndividuales.forEach(t => tecnicoSet.add(t));

            return {
              ...row,
              "Descripción": cleanDescription(getDescripcion(row)),
              "Solución":
                (proyecto === "SECIHTI" || proyecto === "MUJERES")
                  ? cleanDescription(getSolucion(row))
                  : row["Solución"],
              "Asignado a - Grupo de técnicos": grupoTecnicos,
              "Tiempo de Respuesta (Dias, hrs : min : seg)": tiempoRespuesta,
              "Tiempo efectivo de atención": tiempoEfectivoFmt,  // ✅ nueva columna
              _tecnicosIndividuales: tecnicosIndividuales
            };
          });

          const sorted = [...rows].sort((a, b) =>
            normalizeString(a["ID"]).localeCompare(normalizeString(b["ID"]))
          );

          const ids = sorted.map(r => normalizeString(r["ID"]));
          const anios = [...new Set(ids.map(id => id.slice(0, 4)))].sort();
          const meses = [...new Set(ids.map(id => id.slice(4, 7)))].sort();
          const tecnicos = Array.from(tecnicoSet).sort();

          setData(sorted);
          setAniosDisponibles(anios);
          setMesesDisponibles(meses);
          setTecnicosDisponibles(tecnicos);
          setFiltroAnio("");
          setFiltroMes("");
          setFiltroTecnico("");
        }
      });
    };

    reader.readAsText(file);
  };

  const filteredData = data.filter((row) => {
    const { anio, mes } = extractAnioMesYNumero(row["ID"]);
    const matchTecnico = !filtroTecnico || row._tecnicosIndividuales?.includes(filtroTecnico);

    return (
      (!filtroAnio || anio === filtroAnio) &&
      (!filtroMes || mes === filtroMes) &&
      matchTecnico
    );
  });

  const sinResultadosPorMes = filtroMes && filteredData.length === 0;

  const columnsUNADM_PREPA = [
    "No.",
    "ID",
    "Título",
    "Descripción",
    "Prioridad",
    "Asignado a - Grupo de técnicos",
    "Fecha de apertura",
    "Fecha y hora de inicio de trabajos",
    "(Opcional. Solicitud de retroalimentación, elementos adicionales o similares)",
    "Respuesta de operador",
    "(Opcional. Ejecución de tareas por maquina p.e conversión OVA, copiado, etc.)",
    "Conclusión de tareas por máquina",
    "Fecha de solución",
    "Tiempo efectivo de atención",   // ✅ ya está aquí
    "Observaciones",
  ];

  const columnsSECIHTI = [
    "No.",
    "Identificador de Solicitud",
    "Fecha y hora de apertura",
    "Titulo",
    "Solicitante",
    "Descripción",
    "Servicio",
    "Actividad",
    "Categoría",
    "Subcategoria",
    "Prioridad",
    "Estado",
    "Solución",
    "Fecha de Solución"
  ];

  const columnsMUJERES = [
    "No.",
    "ID",
    "Titulo",
    "Estado",
    "Fecha de apertura",
    "Prioridad",
    "Asignado a - Grupo de técnicos",
    "Solicitante",
    "Categoría",
    "Descripción",
    "Solución",
    "Fecha de solución",
    "Atendió",
  ];

  const columns =
    proyecto === "SECIHTI" ? columnsSECIHTI :
      proyecto === "MUJERES" ? columnsMUJERES :
        columnsUNADM_PREPA;

  return (
    <div className="app-container">
      {volver && (
        <div className="volver-container">
          <button className="volver-btn" onClick={volver}>
            ← Volver a seleccionar proyecto
          </button>
        </div>
      )}

      <Header proyecto={proyecto} />
      <FileUploader onUpload={handleFileUpload} />

      {data.length > 0 && (
        <Filters
          filtroAnio={filtroAnio}
          setFiltroAnio={setFiltroAnio}
          filtroMes={filtroMes}
          setFiltroMes={setFiltroMes}
          filtroTecnico={filtroTecnico}
          setFiltroTecnico={setFiltroTecnico}
          anios={aniosDisponibles}
          meses={mesesDisponibles}
          tecnicos={tecnicosDisponibles}
          nombreMes={nombreMes}
          data={filteredData}
          proyecto={proyecto}
          onExport={async (proy, mes, anio, logo1, logo2, dataExport) => {
            if (proy === "MUJERES") {
              await exportarExcelMujeres(dataExport, nombreMes[mes] || mes, anio, logo1, logo2, columnsMUJERES);
            } else {
              exportarExcel(dataExport, columns, proy, mes, anio);
            }
          }}
        />
      )}

      {sinResultadosPorMes && (
        <p style={{ color: "red", textAlign: "center", marginTop: "1rem" }}>
          No hay resultados para el mes seleccionado.
        </p>
      )}

      {filteredData.length > 0 && (
        <TicketTable
          data={filteredData}
          columns={columns}
          onDataChange={(updatedData) => {
            setData(prevData => {
              const newData = [...prevData];
              updatedData.forEach((row, i) => {
                const globalIndex = prevData.indexOf(filteredData[i]);
                if (globalIndex !== -1) {
                  newData[globalIndex] = row;
                }
              });
              return newData;
            });
          }}
        />
      )}
    </div>
  );
}
