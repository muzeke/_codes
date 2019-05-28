import React, { Component } from "react";
import "../stylesheets/main.scss";
import Header from "./header";
import Breadcrumb from "./breadcrumb";
import Navigation from "./navigation";
import Workspace from "./workspace";
import { BrowserRouter } from "react-router-dom";

const App = () => {
  return (
    <React.Fragment>
      <Header />
      <Breadcrumb />
      <div className="body-contents">
        <BrowserRouter basename="/sites/JobLibrary/Pages/User.aspx#">
          <Navigation />
          <Workspace />
        </BrowserRouter>
      </div>
    </React.Fragment>
  );
};

export default App;
