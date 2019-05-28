define(['jquery'], function(){

	var Utilities = {};

	//use to load css
	function loadCss(url) {
	    $(url).each(function(){
	      var link = document.createElement("link");
	      link.type = "text/css";
	      link.rel = "stylesheet";
	      link.href = this;
	      document.getElementsByTagName("head")[0].appendChild(link);
	    });
	}

	Utilities.loadCss = loadCss;

	return Utilities;

});

