import React, { Component } from "react";

const hostSite =
  typeof _spPageContextInfo === "undefined"
    ? ""
    : window._spPageContextInfo.webAbsoluteUrl;

class Home extends Component {
  state = {
    item: 0
  };

  componentDidMount() {
    var url =
      hostSite +
      "/_api/web/lists/getbytitle('Job_Family')/Items?$select=*,Job_Family_Group/Job_Family_Group&$expand=Job_Family_Group&$filter=Job_Family_Group/Job_Family_Group%20eq%20%27Analytics%20Group%27&$top=1";

    fetch(url, {
      headers: {
        accept: "application/json;odata=verbose"
      }
    })
      .then(d => d.json())
      .then(d => {
        this.setState({
          item: d.d.results[0].Job_Family
        });
        console.log(d.d.results[0].Job_Family);
      });
  }

  render() {
    return (
      <div>
        <span> {this.state.item} </span>
      </div>
    );
  }
}

export default Home;
