import React from "react";
import { Switch, Route } from "react-router-dom";

import Home from "./Home";

import JobLibrary from "./JobLibrary";
import CareerFamily from "./Career";
import "../stylesheets/workspace.scss";
const Workspace = () => {
  return (
    <div className="workspace-content">
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
