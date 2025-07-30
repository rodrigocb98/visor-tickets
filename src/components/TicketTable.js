import React from "react";

const TicketTable = ({ data, columns }) => (
  <div className="ticket-table-container">
    <p style={{ color: "#64b5f6", textAlign: "center" }}>
      {data.length} resultado(s) encontrado(s)
    </p>
    <table className="ticket-table">
      <thead>
        <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map(col => (
              <td key={col}>{col === "No." ? i + 1 : row[col] || ""}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default TicketTable;
