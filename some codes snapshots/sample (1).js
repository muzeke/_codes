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


/*
require(['rest','jquery'], function(rest, $){
	rest.group("ACC Contribute Access").getUsers().then(function(x){
		console.log("Number of Items: " + x.d.results.length);
		
		var calls = [];

		//for loop for every item to delete all groups 1 by one
		for(var i = 0; i < x.d.results.length; i++){
			calls.push(rest.group("ACC Contribute Access").removeUser({loginName: x.d.results[i].LoginName}).then(function(d){
				
            }));
        }
		
		//return all ajax that was called
		return $.when.apply($, calls);
		
    }).then(function(data){

		//get all users from the access list v2 {recursively}

		return rest.list("ACC_Access_ListV2").recursiveGetItems({ filter: "$top=50", columns: ["Name/Name"], expands: ["Name"]});
		
    }).then(function(data){

		var calls = [];

		for(var i = 0; i < data.length; i++){

			var  userEmail = data[i].Name.Name;

			calls.push(rest.group("ACC Contribute Access").addUser({__metadata: { 'type': 'SP.User' }, LoginName: userEmail}));

        }

		return $.when.apply($, calls);

    }).then(function(){
		console.log("All users has been added %c", "font-family:Calibri;font-size:25px;color:red");
    });

});*/