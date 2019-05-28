define(['jquery'], function($){

	var getParams = function (url) {

		var params = {};

		var parser = document.createElement('a');

		parser.href = url;

		var query = parser.search.substring(1);

		var vars = query.split('&');

		for (var i = 0; i < vars.length; i++) {
			var pair = vars[i].split('=');
			params[pair[0]] = decodeURIComponent(pair[1]);
		}

		return params;

	};

	var Router = {};

	Router.load = function(pageName){

		return $.ajax({
			method : "GET",
			url: _spPageContextInfo.webAbsoluteUrl + "/accassets/html/dashboard." + pageName + ".html"
		}).then(function(html){

			//console.log(html);

			$(APP_ENV_DEFAULTS.mainView).html(html);

			var pageSettings = JSON.parse($("#APP-CURRENT-PAGE-SETTINGS").attr("data-val"));

			$("div.currentPage span.title").html(pageSettings.pageTitle);

		}).catch(function(err){
				console.log(err);
			$("div.currentPage span.title").html("Page not found");
			$(APP_ENV_DEFAULTS.mainView).html("<span style='font-size:25px'>The page you are looking for does not exists</span>");
		});

	}

	return Router;

});

