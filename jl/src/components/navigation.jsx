import React, { Component } from "react";
import { NavLink } from "react-router-dom";
const Navigation = () => {
  return (
    <nav className="navigation">
      <div className="nav-item">
        <NavLink to="/" exact>
          Home
        </NavLink>
      </div>
      <div className="nav-item">
        <NavLink to="/jobLibrary" exact>
          Job Library
        </NavLink>
      </div>
      <div className="nav-item">
        <NavLink to="/careerFamily" exact>
          Career Family
        </NavLink>
      </div>
    </nav>
  );
};

export default Navigation;
