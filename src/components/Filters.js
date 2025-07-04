import React from "react";

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
  onExport
}) {
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

      <button onClick={onExport}>Generar Entregable</button>
    </div>
  );
}
