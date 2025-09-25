import React, { useState, useEffect, useRef } from "react";

export default function TicketTable({ data, columns, onDataChange }) {
  const [editableData, setEditableData] = useState(data);
  const [editingCell, setEditingCell] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [closing, setClosing] = useState(false);

  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);
  const tableRef = useRef(null);
  const [tableWidth, setTableWidth] = useState(1000); // ancho por defecto

  useEffect(() => {
    setEditableData(data);
  }, [data]);

  useEffect(() => {
    if (tableRef.current) {
      setTableWidth(tableRef.current.scrollWidth); // ancho real de la tabla
    }
  }, [editableData, columns]);

  // sincronizar scroll horizontal
  const syncScroll = (source) => {
    if (source === "top" && bottomScrollRef.current) {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
    if (source === "bottom" && topScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    }
  };

  const handleOpenModal = (rowIndex, col) => {
    setEditingCell({ rowIndex, col });
    setTempValue(editableData[rowIndex][col] || "");
    setClosing(false);
  };

  const handleSave = () => {
    const { rowIndex, col } = editingCell;
    const updated = [...editableData];
    updated[rowIndex][col] = tempValue;
    setEditableData(updated);
    onDataChange(updated);
    triggerClose();
  };

  const handleCancel = () => {
    triggerClose();
  };

  const triggerClose = () => {
    setClosing(true);
    setTimeout(() => {
      setEditingCell(null);
      setClosing(false);
    }, 300);
  };

  const isEditableColumn = (col) =>
    ["Descripción", "Solución", "Soluciones"].includes(col);

  return (
    <div className="ticket-table-container">
      <p style={{ color: "#64b5f6", textAlign: "center" }}>
        {editableData.length} resultado(s) encontrado(s)
      </p>

      {/* Scroll superior */}
      <div
        className="scrollbar-horizontal"
        ref={topScrollRef}
        onScroll={() => syncScroll("top")}
      >
        <div
          className="scrollbar-spacer"
          style={{ width: `${tableWidth}px` }}
        />
      </div>

      {/* Contenedor con scroll principal */}
      <div
        className="table-scroll"
        ref={bottomScrollRef}
        onScroll={() => syncScroll("bottom")}
      >
        <table className="ticket-table" ref={tableRef}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {editableData.map((row, i) => (
              <tr key={i}>
                {columns.map((col) => {
                  if (col === "No.") {
                    return <td key={col}>{i + 1}</td>;
                  }
                  if (isEditableColumn(col)) {
                    return (
                      <td key={col}>
                        <div>{row[col] || ""}</div>
                        <button
                          onClick={() => handleOpenModal(i, col)}
                          className="edit-btn"
                        >
                          Editar
                        </button>
                      </td>
                    );
                  }
                  return <td key={col}>{row[col] || ""}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {editingCell && (
        <div
          className={`modal-overlay ${closing ? "fade-out" : "fade-in"}`}
        >
          <div
            className={`modal-container ${closing ? "scale-out" : "scale-in"}`}
          >
            <h2>
              Editar {editingCell.col} (Ticket #{editingCell.rowIndex + 1})
            </h2>
            <textarea
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
            />
            <div className="modal-actions">
              <button onClick={handleCancel} className="cancel-btn">
                Cancelar
              </button>
              <button onClick={handleSave} className="save-btn">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
