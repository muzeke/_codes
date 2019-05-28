/**
 * Set Interval to Reset for digest
 * @param  {[type]} ){                                     UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);      console.log("%c Form Digest has been refreshed! n"+ document.getElementById("__REQUESTDIGEST").value, "padding:10px;font-size:18px;color:#00A758;font-weight:bold;font-family:'Calibri';");  } [description]
 * @param  {[type]} 5   *             60000 [description]
 * @return {[type]}     [description]
 */
  setInterval(function(){
      UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
      console.log("%c Form Digest has been refreshed! \n"+ document.getElementById("__REQUESTDIGEST").value, "padding:10px;font-size:18px;color:#00A758;font-weight:bold;font-family:'Calibri';");
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
	title: "Automation Workflows"
}


global.APP_HTML_PAGES = [];
/*
 * requireJS configuration object
 */
global.configObject = {
    baseUrl: '../accassets/javascripts',
    paths: {
        jquery: 'vendor/jquery-3.1.1.min',
        menu: 'dashboard.menu',
        pageRouter: 'dashboard.pageRouter',
        nprogress: 'vendor/nprogress',
        chartjs: 'vendor/chart.bundle.min',
        dataTable: 'vendor/jquery.dataTables.min',
        rest: 'rest'
    }
}


var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

//setup requirejs configuration
requirejs.config(configObject);

var DefaultScripts = (function(){

	//adding event listeners here
	var bindEvents = function(){

		
		if(getUrlParameter("page")) {

			var page = getUrlParameter("page");

			require(['pageRouter', 'nprogress'], function(pageRouter, NProgress){
					NProgress.configure({ parent: ".grid-box-2" });

					NProgress.start();
					var pageTitle = page.replace(/([a-z])([A-Z])/g, '$1 $2');

					pageTitle = pageTitle[0].toUpperCase() + pageTitle.substring(1);

					pageRouter.load(page, pageTitle).always(function(){
						setTimeout(function(){NProgress.done()}, 500);
						
					});
			});
		}




		global.onpopstate = function(event) {
		
		  require(['pageRouter'], function(pageRouter){
					pageRouter.load(event.state);
		  });

		};


	} //END of bind events


	var init = function(){

		//set banner title
		document.querySelector(".banner-text > .banner-text--title").innerHTML = APP_ENV_DEFAULTS.title;

		//append menus
		require(['menu'], function(){
			//bind events - this in particular just includes the toggler events
			bindEvents();
		});

		
	}

	return {
		init: init
	}
})();



/*
 * On Load  - execute script
 */
window.onload = function(){
	//initiating default scripts Module
	DefaultScripts.init();
	console.log("init loaded");
}


console.log("%c Connected to dashboard.require.config", "font-size:25px;")



