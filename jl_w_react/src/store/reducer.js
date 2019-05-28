import * as types from "../constants/actionTypes";

const initialState = {
  ajaxError: "",
  user: {}
};

const reducer = (state = initialState, action) => {
  const newState = { ...state };

  //destruction action
  var { type, payload } = action;

  if (type === types.FETCH_FAILED) {
    newState.ajaxError = payload;
  }

  if (type === types.RECEIVE_USER) {
    newState.user = payload;
  }
  return newState;
};

export default reducer;
