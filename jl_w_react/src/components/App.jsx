import React, { Component } from "react";
import { connect } from "react-redux";
import "../stylesheets/apps.scss";
import Header from "../components/Header";
import Navigation from "../components/Navigation";
import Workspace from "../components/Workspace";
class App extends Component {
  alertErrors = () => {
    if (this.props.reducer.ajaxError !== "")
      alert(this.props.reducer.ajaxError);
  };
  render() {
    //destructure states

    return (
      <React.Fragment>
        <Header />
        <div className="workspace">
          {this.alertErrors()}
          <Navigation />
          <Workspace />
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => {
  return state;
};

const mapDispatchToProps = dispatch => {
  return {
    onFetchUser: () =>
      dispatch({
        type: "FETCH_USER"
      })
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(App);
