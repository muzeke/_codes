import axios from "axios";

//in SharePoint Online
const hostSite =
  typeof _spPageContextInfo === "undefined"
    ? ""
    : window._spPageContextInfo.webAbsoluteUrl;

export function _fetch(options) {
  // `axios` function returns promise, you can use any ajax lib, which can
  // return promise, or wrap in promise ajax call
  options.method = options.method || "get";

  options.headers = {
    accept: "application/json;odata=verbose"
  };

  options.url = hostSite + options.url;

  return axios(options);
}
