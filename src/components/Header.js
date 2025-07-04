import React from "react";
import Logo1 from "../img/LogoM.png";
import Logo2 from "../img/logo2.png";
import Logo3 from "../img/logo3.png";

const Header = () => (
  <div className="header-container">
    <img src={Logo1} alt="Logo izquierda"/>
    <h1 className="header">Entregables UnADM/Prepa (CSV)</h1>
    <img src={Logo2} alt="Logo derecha" className="header-img" />
    <img src={Logo3} alt="Logo derecha" className="header-img" />
  </div>
);

export default Header;
