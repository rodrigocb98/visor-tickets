import React, { useState } from "react";
import CsvTicketViewer from "./CsvTicketViewer";
import ProyectoSelector from "./components/ProyectoSelector"; // ✅ debe coincidir con el nombre del archivo
import "./App.css"
function App() {
  const [proyecto, setProyecto] = useState(null);

  return (
    <div>
      {!proyecto ? (
        <ProyectoSelector onSelect={setProyecto} />
      ) : (
        <CsvTicketViewer proyecto={proyecto} />
      )}
    </div>
  );
}

export default App;
