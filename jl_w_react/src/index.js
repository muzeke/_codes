import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./components/App";
import * as serviceWorker from "./serviceWorker";
import "./stylesheets/main.scss";

import { BrowserRouter } from "react-router-dom";
import sharePointContext from "./constants/spoPageContext";

import { Provider } from "react-redux";
import { createStore, applyMiddleware, combineReducers } from "redux";
import createSagaMiddleware from "redux-saga";

import reducer from "./store/reducer";
import jobLibraryReducer from "./store/jobLibraryReducer";
import rootSaga from "./sagas/sagas";
import "promise-polyfill/src/polyfill";
const rootReducer = combineReducers({
  jobLibraryReducer,
  reducer
});

const sagaMiddleware = createSagaMiddleware();

const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));

//assign to window object
window.spo_context_info = sharePointContext.spoPageContext;

sagaMiddleware.run(rootSaga);

ReactDOM.render(
  <BrowserRouter basename="/sites/JobLibrary/Pages/user-index.aspx#">
    <Provider store={store}>
      <App />
    </Provider>
  </BrowserRouter>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
