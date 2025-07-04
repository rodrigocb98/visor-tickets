import React, { useState } from "react";
import Papa from "papaparse";
import Header from "./components/Header";
import FileUploader from "./components/FileUploader";
import Filters from "./components/Filters";
import TicketTable from "./components/TicketTable";
import exportarExcel from "./utils/exportarExcel";
import { parseFecha } from "./utils/parseFecha";
import { cleanDescription } from "./utils/cleanDescription";
import "./App.css"

const nombreMes = {
  "100": "Octubre", "020": "Febrero", "030": "Marzo", "040": "Abril",
  "050": "Mayo", "060": "Junio", "070": "Julio", "080": "Agosto",
  "090": "Septiembre", "010": "Enero", "110": "Noviembre", "120": "Diciembre"
};

export default function CsvTicketViewer() {
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

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let rows = results.data.filter(row => row["ID"]);

        const tecnicoSet = new Set();

        rows = rows.map(row => {
          const fechaSolucion = parseFecha(row["Fecha de solución"]);
          const fechaApertura = parseFecha(row["Fecha de apertura"]);
          const diff = fechaSolucion && fechaApertura ? fechaSolucion - fechaApertura : null;

          const tiempoRespuesta = diff !== null
            ? `${Math.floor(diff / (1000 * 60 * 60 * 24))}d ${Math.floor((diff / (1000 * 60 * 60)) % 24)}h ${Math.floor((diff / (1000 * 60)) % 60)}m ${Math.floor((diff / 1000) % 60)}s`
            : "Error en fechas";

          const grupoTecnicos = (row["Asignado a - Grupo de técnicos"] || "").replace(/<br\s*\/?>/gi, ", ");
          const tecnicosIndividuales = grupoTecnicos
            .split(",")
            .map(t => t.trim())
            .filter(Boolean);

          tecnicosIndividuales.forEach(t => tecnicoSet.add(t));

          return {
            ...row,
            "Descripción": cleanDescription(row["Descripción"]),
            "Asignado a - Grupo de técnicos": grupoTecnicos,
            "Tiempo de Respuesta (Dias, hrs : min : seg)": tiempoRespuesta,
            "_tecnicosIndividuales": tecnicosIndividuales
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
      },
    });
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

  // Mensaje si no hay resultados para el mes seleccionado
  const sinResultadosPorMes = filtroMes && filteredData.length === 0;

  const columns = [
    "No.", "ID", "Fecha de apertura", "Título", "Tipo", "Descripción",
    "Tiempo de Respuesta (Dias, hrs : min : seg)", "Fecha de solución", "Prioridad",
    "Asignado a - Grupo de técnicos", "Observaciones"
  ];

  return (
    <div className="app-container">
      <Header />
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
          onExport={() => exportarExcel(filteredData, columns)}
        />
      )}

      {sinResultadosPorMes && (
        <p style={{ color: "red", textAlign: "center", marginTop: "1rem" }}>
          No hay resultados para el mes seleccionado.
        </p>
      )}

      {filteredData.length > 0 && (
        <TicketTable data={filteredData} columns={columns} />
      )}
    </div>
  );
}
