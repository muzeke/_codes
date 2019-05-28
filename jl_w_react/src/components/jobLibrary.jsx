import React, { Component } from "react";

import "../stylesheets/joblibrary.scss";
import { connect } from "react-redux";

import JobFamilyGroup from "./JobFamilyGroup";
class JobLibrary extends Component {
  componentDidMount() {
    //dispatch on load
    this.props.onJobFamilyLoad();
  }
  render() {
    console.log(this.props);
    const {
      jobFamilyGroups,
      jobFamily,
      jfgSelectOpen,
      jfSelectOpen,
      jobFamilyGroupDescription,
      jobFamilyDescription,
      selectedJFG,
      selectedJF
    } = this.props.state.jobLibraryReducer;

    const {
      onJobFamilySelectOpen,
      onJobFamilyGroupDescriptionLoad,
      onJobFamilyGroupSelectOpen,
      onJobFamilyDescriptionLoad
    } = this.props;

    return (
      <React.Fragment>
        <div className="panel jl">
          <div onClick={onJobFamilyGroupSelectOpen} className="panel-header">
            <span>{selectedJFG}</span>
            <b />
          </div>

          {jfgSelectOpen && (
            <div className="select-option">
              <div className="select-options">
                {jobFamilyGroups.map(item => {
                  const activeClass = item.Job_Family_Group === selectedJFG;
                  return (
                    <JobFamilyGroup
                      onJobFamilyGroupDescriptionLoad={
                        onJobFamilyGroupDescriptionLoad
                      }
                      key={item.Id}
                      item={item}
                      activeClass={activeClass}
                    />
                  );
                })}
              </div>
              <div className="select-option--search">
                <input type="text" placeholder="Search Job Family Group" />
              </div>
            </div>
          )}

          <div className="panel-body">{jobFamilyGroupDescription}</div>
        </div>

        <div className="panel jl">
          <div onClick={onJobFamilySelectOpen} className="panel-header">
            <span>{selectedJF}</span>
            <b />
          </div>

          {jfSelectOpen && (
            <div className="select-option">
              <div className="select-options">
                {jobFamily.map(item => {
                  const activeClass =
                    item.Job_Family === selectedJF
                      ? "select-options--item active"
                      : "select-options--item";
                  return (
                    <div
                      onClick={() =>
                        onJobFamilyDescriptionLoad(item.Job_Family)
                      }
                      key={item.Id}
                      className={activeClass}
                    >
                      {item.Job_Family}
                    </div>
                  );
                })}
              </div>
              <div className="select-option--search">
                <input type="text" placeholder="Search Job Family Group" />
              </div>
            </div>
          )}

          <div className="panel-body">{jobFamilyDescription}</div>
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = state => {
  return { state };
};

const mapDispatchToProps = dispatch => {
  return {
    onJobFamilyLoad: () =>
      dispatch({
        type: "FETCH_JOB_FAMILY_GROUP"
      }),
    onJobFamilySelectOpen: () =>
      dispatch({
        type: "OPEN_SELECT_JF"
      }),
    onJobFamilyGroupSelectOpen: () =>
      dispatch({
        type: "OPEN_SELECT_JFG"
      }),
    onJobFamilyGroupDescriptionLoad: jobfamilygroup =>
      dispatch({
        type: "FETCH_JOB_FAMILY_GROUP_DESCRIPTION",
        jobfamilygroup: jobfamilygroup
      }),
    onJobFamilyDescriptionLoad: jobfamily =>
      dispatch({
        type: "FETCH_JOB_FAMILY_DESCRIPTION",
        jobfamily: jobfamily
      })
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(JobLibrary);
