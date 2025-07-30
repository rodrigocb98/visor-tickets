// components/ProyectoSelector.js
import React from "react";
import logoCNS from "../assets/cns_logo.png"
import logoMesa from "../assets/LogoM.png"
import logoUNADM from "../assets/logo2.png";
import logoPrepa from "../assets/logo3.png";
import logoSECIHTI from "../img/secihti-logo.png";
import logoMUJERES from "../img/mujeres-logo.png";

export default function ProyectoSelector({ onSelect }) {
  return (
    <div className="proyecto-selector">
        <div className="header-container-selector">
        <img className="header-img-selector"  src={logoCNS} alt="CNS" />
      <h2>GENERADOR DE ENTREGABLES</h2>
     <img className="header-img-selector" src={logoMesa} alt="Mesa" />
     </div>
      <h2>Seleccione un Proyecto</h2>
      <div className="proyecto-grid">
        
        <button className="proyecto-btn" onClick={() => onSelect("UNADM")}>
          <img src={logoUNADM} alt="UNADM" />
          <span>UNADM</span>
        </button>
        <button className="proyecto-btn" onClick={() => onSelect("PREPA")}>
          <img src={logoPrepa} alt="Prepa en Línea" />
          <span>Prepa en Línea</span>
        </button>
        <button className="proyecto-btn" onClick={() => onSelect("SECIHTI")}>
          <img src={logoSECIHTI} alt="SECIHTI" />
          <span>SECIHTI</span>
        </button>
         <button className="proyecto-btn" onClick={() => onSelect("MUJERES")}>
          <img src={logoMUJERES} alt="MUJERES" />
          <span>Mujeres</span>
        </button>
      </div>
    </div>
  );
}