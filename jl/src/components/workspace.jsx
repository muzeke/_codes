import React, { Component } from "react";
import { Switch, Route } from "react-router-dom";
import Home from "./home";
import JobLibrary from "./jobLibrary";
import CareerFamily from "./careerFamily";

const Workspace = () => {
  return (
    <div className="workspace">
      <Switch>
        <Route path="/" exact component={Home} />
        <Route path="/joblibrary" exact component={JobLibrary} />
        <Route path="/careerFamily" exact component={CareerFamily} />
        <Route path="/search" exact component={Home} />
      </Switch>
    </div>
  );
};

export default Workspace;
