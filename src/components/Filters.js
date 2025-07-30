import React from "react";
import logoIzq from "../assets/Logo-CNS.png";
import logoDer from "../assets/MUJERES_Logo_(2025).png";

export default function Filters({
  filtroAnio,
  setFiltroAnio,
  filtroMes,
  setFiltroMes,
  filtroTecnico,
  setFiltroTecnico,
  anios,
  meses,
  tecnicos,
  nombreMes,
  onExport,
  proyecto,
  data
}) {
  async function handleExportClick() {
    const base64Logo1 = await fetch(logoIzq).then(res => res.blob()).then(blobToBase64);
    const base64Logo2 = await fetch(logoDer).then(res => res.blob()).then(blobToBase64);

    // Llama a la función export con todos los parámetros necesarios
    onExport(proyecto, filtroMes, filtroAnio, base64Logo1, base64Logo2, data);
  }

  function blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  }

  return (
    <div className="filters-container">
      <label>
        Año:
        <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}>
          <option value="">Todos</option>
          {anios.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>
      </label>

      <label>
        Mes:
        <select value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
          <option value="">Todos</option>
          {meses.map((mes) => (
            <option key={mes} value={mes}>
              {nombreMes[mes] || mes}
            </option>
          ))}
        </select>
      </label>

      <label>
        Área Técnica:
        <select value={filtroTecnico} onChange={(e) => setFiltroTecnico(e.target.value)}>
          <option value="">Todos</option>
          {tecnicos.map((tec, index) => (
            <option key={index} value={tec}>
              {tec}
            </option>
          ))}
        </select>
      </label>

      <button onClick={handleExportClick}>Generar Entregable</button>
    </div>
  );
}
