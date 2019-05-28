/**
 * Set Interval to Reset for digest
 * @param  {[type]} ){                                     UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);      console.log("%c Form Digest has been refreshed! n"+ document.getElementById("__REQUESTDIGEST").value, "padding:10px;font-size:18px;color:#00A758;font-weight:bold;font-family:'Calibri';");  } [description]
 * @param  {[type]} 5   *             60000 [description]
 * @return {[type]}     [description]
 */
setInterval(function() {
  UpdateFormDigest(
    _spPageContextInfo.webServerRelativeUrl,
    _spFormDigestRefreshInterval
  );
  console.log(
    "%c Form Digest has been refreshed! \n" +
      document.getElementById("__REQUESTDIGEST").value,
    "padding:10px;font-size:18px;color:#00A758;font-weight:bold;font-family:'Calibri';"
  );
}, 5 * 60000);

//assign window namespace to global
var global = window;

/**
 * log "Settings the variable to contain the console.log function"
 * @type {[function]}
 */
const log = console.log;

/*
 * Set PAGE  / APP environment defaults
 */
global.APP_ENV_DEFAULTS = {
  pagePrefix: "userHome",
  defaultPage: "home",
  assetsFolderName: "joblibraryassets"
};

global.APP_HTML_PAGES = [];
/*
 * requireJS configuration object
 */
global.configObject = {
  baseUrl: "../" + APP_ENV_DEFAULTS.assetsFolderName + "/javascripts",
  paths: {
    jquery: "vendors/jquery-3.1.1.min",
    pageRouter: "pageRouter",
    rest: "rest",
    nprogress: "vendors/nprogress",
    peoplePicker: "zPeoplePicker"
  }
};

var getUrlParameter = function getUrlParameter(sParam) {
  var sPageURL = decodeURIComponent(window.location.search.substring(1)),
    sURLVariables = sPageURL.split("&"),
    sParameterName,
    i;

  for (i = 0; i < sURLVariables.length; i++) {
    sParameterName = sURLVariables[i].split("=");

    if (sParameterName[0] === sParam) {
      return sParameterName[1] === undefined ? true : sParameterName[1];
    }
  }
};

//setup requirejs configuration
requirejs.config(configObject);

var PushState = (function() {
  var push = function(page) {
    global.history.pushState(
      page,
      "",
      global.location.pathname + "?page=" + page
    );
  };

  return {
    push: push
  };
})();

var PageLoader = (function() {
  var load = function(page) {
    require(["jquery", "pageRouter", "nprogress"], function(
      $,
      pageRouter,
      NProgress
    ) {
      var pageNotFoundError =
        "<article style='font-size:15px;font-family:Manulife JH Sans Demibold; padding:20px'>The page you are trying to access is not found.</article>";
      //start the nprogress here
      NProgress.configure({
        parent: ".workspace"
      });

      NProgress.start();

      PushState.push(page);

      pageRouter
        .load(page)
        .then(function(html) {
          $(".menu").show();

          $(".workspace").html(html);
          console.log(getUrlParameter("page"));
          $(".menu-item").removeClass("active");
          $(".menu-item[data-page='" + getUrlParameter("page") + "']").addClass(
            "active"
          );
        })
        .fail(function(err) {
          $(".workspace").html(pageNotFoundError);
        })
        .always(function() {
          setTimeout(function() {
            NProgress.done();
          }, 500);
        });
    });
  };

  return {
    load: load
  };
})();

var DefaultScripts = (function() {
  //adding event listeners here
  var pageOnLoad = function(page) {
    if (getUrlParameter("page")) {
      var currentPage = getUrlParameter("page");

      PageLoader.load(currentPage);

      return;
    }

    PageLoader.load(APP_ENV_DEFAULTS.defaultPage);
  };

  var bindEvents = function() {
    global.onpopstate = function(event) {
      console.log(event.state);

      PageLoader.load(event.state);
    };

    require(["jquery"], function() {
      $("div.menu > div.menu-item").on("click", function() {
        var page = $(this).attr("data-page");

        PageLoader.load(page);
      });
    });
  }; //END of bind events

  var init = function() {
    //set welcome
    document.querySelector(".welcome-user").innerHTML =
      "Welcome, " + _spPageContextInfo.userDisplayName;

    pageOnLoad();

    bindEvents();
  };

  return {
    init: init
  };
})();

/*
 * On Load  - execute script
 */
window.addEventListener("load", function() {
  DefaultScripts.init();
});

console.log("%c Connected to dashboard.require.config", "font-size:25px;");
