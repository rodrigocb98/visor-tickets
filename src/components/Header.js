import React from "react";
import Logo1 from "../img/LogoM.png";
import Logo2 from "../img/logo2.png";
import Logo3 from "../img/logo3.png";
import Logo4 from "../img/secihti-logo.png";
import Logo5 from "../img/mujeres-logo.png"

const Header = ({ proyecto }) => {
  // Asignar logo2 dinámicamente según proyecto
  let logo2Src;

  switch (proyecto) {
    case "UNADM":
      logo2Src = Logo2;
      break;
    case "PREPA":
      logo2Src = Logo3;
      break;
    case "SECIHTI":
      logo2Src = Logo4;
      break;
    case "MUJERES":
      logo2Src = Logo5;
      break;  
    default:
      logo2Src = Logo2 // fallback o default
     
  }

  return (
    <div className="header-container">
      <img src={Logo1} alt="Logo izquierda" />
      <h1 className="header">Entregables {proyecto} (CSV)</h1>
      <img src={logo2Src} alt="Logo derecha 2" className="header-img" />
    </div>
  );
};

export default Header;
