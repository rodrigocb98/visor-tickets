import React, { useState } from "react";
import CsvTicketViewer from "./CsvTicketViewer";
import ProyectoSelector from "./components/ProyectoSelector";
import "./App.css";

function App() {
  const [proyecto, setProyecto] = useState(null);

  return (
    <div>
      {!proyecto ? (
        <ProyectoSelector onSelect={setProyecto} />
      ) : (
        <CsvTicketViewer proyecto={proyecto} volver={() => setProyecto(null)} />
      )}
    </div>
  );
}

export default App;
