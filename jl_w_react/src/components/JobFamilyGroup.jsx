import React, { Component } from "react";

class JobFamilyGroup extends Component {
  state = {
    isActive: false
  };

  setClass = () => {
    const activeClass = this.props.activeClass ? " active" : "";
    return "select-options--item" + activeClass;
  };

  render() {
    return (
      <div
        onClick={() =>
          this.props.onJobFamilyGroupDescriptionLoad(
            this.props.item.Job_Family_Group
          )
        }
        className={this.setClass()}
      >
        {this.props.item.Job_Family_Group}
      </div>
    );
  }
}

export default JobFamilyGroup;
