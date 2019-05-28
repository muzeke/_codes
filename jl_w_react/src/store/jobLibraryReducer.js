import * as types from "../constants/actionTypes";
import React from "react";

const initialState = {
  jobFamilyGroups: [],
  jobFamily: [],
  jobFamilyGroupDescription: "Please select a Job Family Group",
  jobFamilyDescription: "Please select a Job Family",
  jfgSelectOpen: false,
  jfSelectOpen: false,
  selectedJFG: (
    <React.Fragment>
      <span style={{ color: "#FF5722" }}> Select</span> a Job Family Group
    </React.Fragment>
  ),
  selectedJF: (
    <React.Fragment>
      <span style={{ color: "#FF5722" }}> Select</span> a Job Family
    </React.Fragment>
  )
};

const reducer = (state = initialState, action) => {
  const newState = { ...state };

  //destruction action
  var { type, payload } = action;

  if (type === types.RECEIVE_JOB_FAMILY_GROUP) {
    newState.jobFamilyGroups = payload;
  }

  if (type === types.OPEN_SELECT_JFG) {
    newState.jfgSelectOpen = newState.jfgSelectOpen ? false : true;
    newState.jfSelectOpen = false;
  }

  if (type === types.OPEN_SELECT_JF) {
    newState.jfSelectOpen = newState.jfSelectOpen ? false : true;
    newState.jfgSelectOpen = false;
  }

  if (type === types.RECEIVE_JOB_FAMILY_GROUP_DESCRIPTION) {
    newState.jobFamilyGroupDescription = payload;
  }

  if (type === types.RECEIVE_JOB_FAMILY_DESCRIPTION) {
    newState.jobFamilyDescription = payload;
  }

  if (type === types.CHANGE_SELECTED_JFG) {
    newState.selectedJFG = payload;
    newState.selectedJF = (
      <React.Fragment>
        <span style={{ color: "#FF5722" }}> Select</span> a Job Family
      </React.Fragment>
    );
    newState.jobFamilyDescription = "Please select a Job Family";
  }

  if (type === types.CHANGE_SELECTED_JF) {
    newState.selectedJF = payload;
  }

  if (type === types.RECEIVE_JOB_FAMILY) {
    newState.jobFamily = payload;
  }

  return newState;
};

export default reducer;
