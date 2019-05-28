( function(global, factory){
		
	if( typeof define !== "undefined" ) {
		
		define(['jquery'], function($){
			
			return factory();
        });
    }else{
		global.Rest = factory();
    }

	
})(window, function(){
	var Rest = (function(){

		//object to be returned to make methods accessible outside
		var app = {};
		
		/**
	     * A constructor function jQuery ajax calls
	     * @constructor
	     * @param  {string} type    - ['GET', 'POST']
	     * @param  {string} baseEndpoint - api endpoint
	     */
		function AjaxHeadersSettings(type, baseEndpoint){

				this.url = _spPageContextInfo.webAbsoluteUrl + baseEndpoint;

				this.type = type;

				this.setHeaders();
	     }
		
		/**
	     * Prototype for AjaxheadersSettings Constructor
	     * @set headers
	     */
		 AjaxHeadersSettings.prototype.setHeaders = function(){
			if(this.type == "GET") {
				this.headers =  {
					"accept": "application/json;odata=verbose"
	            }
	        }else if(this.type == "POST"){
				this.headers =  {
					"accept": "application/json;odata=verbose",
	                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
	                "content-Type": "application/json;odata=verbose"
	            }
	        }else if(this.type == "PATCH"){
	        	this.headers =  {
					"accept": "application/json;odata=verbose",
		            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
		            "content-Type": "application/json;odata=verbose",
		            "X-Http-Method": "PATCH",
		            "If-Match": "*"
	            }
	        }else if(this.type == "DELETE"){
	        	this.headers =  {
					"accept": "application/json;odata=verbose",
		            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
		            "If-Match": "*"
	            }
	        }
	     }

		/**
	     * Function to add methods to the returned ajax object
	     * @param  {object} ajaxCall    - the jQuery ajax object
	     */
		function addMethodsToAjax(ajaxCall){
			
			//Developer log method, used to log the results
			ajaxCall.log = function(){

				ajaxCall.then(function(d){
					console.log(d);
	            });

				return ajaxCall;
	       }
			
			//Developer count / length method, used to log the count / length of the results
		    ajaxCall.count = ajaxCall.length = function(){

				ajaxCall.then(function(d){
					console.log(d.d.results.length);
	            });

				return ajaxCall;
	        }

			ajaxCall.fail(function(er){
	            console.log("%c " + er.responseJSON.error.message.value, 'padding:10px;color:red;background:rgba(255,0,0,.1);border-radius:5px');
	        });

	    }
		
		
		/**
		 * show Error 
		 * @param  {object} error    - error from an ajax Request
		**/
		function showError(error){
			console.error(error.message.value);		
	    }


		
		/**
		 * List Methods
		 * @param  {string} listname    - name of the SharePoint list, library
		**/
		app.list = function(listname){
			
			//list app to be returned
			var _listapp = {};

			
			/**
		    * Create/Insert a new item into SP List/Library
			*
			* @example
			* Rest.list('MyTestList').lmfn();
			*
			* @return {Promise} - Return `Promise` containing the list metadata name
			*/
			_listapp.lmfn = function(){
				var ajaxRequest = new AjaxHeadersSettings("GET", "/_api/Web/Lists/GetByTitle('" + listname + "')/ListItemEntityTypeFullName");

				ajaxRequest.success = function(data){
					console.log(data.d.ListItemEntityTypeFullName);
	            }

				return $.ajax(ajaxRequest);	
	        }

			/**
		    * Create/Insert a new item into SP List/Library
			*
			* @example
			* Rest.list('MyTestList').lmfn();
			* @param  {object} options    - object of options [columns, filter]
			*
			* @example - without arguments
			*  Rest.list('MyTestList').getItems();
			*
			* @example - with select columns options
			*
			* @return {Promise} - Return `Promise` containing the data results
			*/

			_listapp.getItems = function(options){
				
				//
				options = options || {};
				
				var ajaxRequest = new AjaxHeadersSettings("GET", "/_api/web/lists/getbytitle('"+ listname +"')/Items?");
				
				if(options.url){
					ajaxRequest.url = options.url;
				}
				
				if(options.columns){

					options.columns = options.columns || [];

					if( !Array.isArray(options.columns) ) options.columns = [options.columns];

					var selectQ = options.filter || options.expands ? "$select=" + options.columns.join(',') + "&" : "$select=" + options.columns.join(',');
				
					ajaxRequest.url = ajaxRequest.url + selectQ;
					
	            }
				
				if(options.expands){
					
					 options.expands = options.expands || [];

					 if( !Array.isArray(options.expands) ) options.expands = [options.expands];

					 ajaxRequest.url = options.filter ? ajaxRequest.url + "$expand=" + options.expands.join(',') + "&" : ajaxRequest.url + "$expand=" + options.expands.join(',');
	            }

				if(options.filter){
					 ajaxRequest.url = ajaxRequest.url + options.filter;
	            }
				
				var ajaxCall = $.ajax(ajaxRequest);

				addMethodsToAjax(ajaxCall);
				
				return ajaxCall;
		
	        }


	        _listapp.recursiveGetItems = function(options, response){

	        	options = options || {};

	        	var ajaxRequest = new AjaxHeadersSettings("GET", "/_api/web/lists/getbytitle('"+ listname +"')/Items?");

	        	if(options.url){
					ajaxRequest.url = options.url;
				}

				if(options.columns){

					options.columns = options.columns || [];

					if( !Array.isArray(options.columns) ) options.columns = [options.columns];

					var selectQ = options.filter || options.expands ? "$select=" + options.columns.join(',') + "&" : "$select=" + options.columns.join(',');
				
					ajaxRequest.url = ajaxRequest.url + selectQ;
					
	            }
				
				if(options.expands){
					
					 options.expands = options.expands || [];

					 if( !Array.isArray(options.expands) ) options.expands = [options.expands];

					 ajaxRequest.url = options.filter ? ajaxRequest.url + "$expand=" + options.expands.join(',') + "&" : ajaxRequest.url + "$expand=" + options.expands.join(',');
	            }

				if(options.filter){
					 ajaxRequest.url = ajaxRequest.url + options.filter;
	            }
				
				console.log(options);


				var ajaxCall = $.ajax(ajaxRequest);

				addMethodsToAjax(ajaxCall);
				
				response = response || [];
			
				return ajaxCall.then(function(data){

					response = response.concat(data.d.results);

					if(!data.d.__next) return response;

					return _listapp.recursiveGetItems({
							url: data.d.__next
					}, response);	

				});

				

	        }
			
			_listapp.create = function(data){

				if(!data) {
					console.error("Please fill out data to insert");
					return;
	            }

				data = data || {};
				
				var ajaxRequest = new AjaxHeadersSettings("POST", "/_api/web/lists/getbytitle('"+ listname +"')/Items");

				if(!data.__metadata){

					console.warn("No __metadata tag for the list included in the data, an ajax request will be sent to get the __metadata before creating the item");

					return Rest.list(listname).lmfn().then(function(x){
					
						data.__metadata = {
							"type" : x.d.ListItemEntityTypeFullName
	                    }

						ajaxRequest.data = JSON.stringify(data);	

						return $.ajax(ajaxRequest);
	                });
					
	            }

				ajaxRequest.data = JSON.stringify(data);

				return $.ajax(ajaxRequest);
				
	        }

	        _listapp.update = function(data){

	        	if(!data) {
					console.error("Please fill out data to insert");
					return;
	            }

				data = data || {};
				
				if(!data.id){
					console.log("Please include the id of the item you want to update!");
					return;
				}

				var ajaxRequest = new AjaxHeadersSettings("PATCH", "/_api/web/lists/getbytitle('"+ listname +"')/getItemById('"+ data.id +"')");

				if(!data.__metadata){

					console.warn("No __metadata tag for the list included in the data, an ajax request will be sent to get the __metadata before creating the item");

					//get __metadata
					
					return Rest.list(listname).lmfn().then(function(x){
					
						data.__metadata = {
							"type" : x.d.ListItemEntityTypeFullName
	                    }

						ajaxRequest.data = JSON.stringify(data);	

						return $.ajax(ajaxRequest);
	                });
					
	            }

	            delete data.id;
	            
				ajaxRequest.data = JSON.stringify(data);

				return $.ajax(ajaxRequest);

	        }

	        _listapp.delete = function(id){

	        	var ajaxRequest = new AjaxHeadersSettings("DELETE", "/_api/web/lists/getbytitle('"+ listname +"')/getItemById('"+ id +"')");

	        	return $.ajax(ajaxRequest);
	        }

			return _listapp;
	    } //list methods end


	    app.user = function(loginName){

	    	//list app to be returned
			var _userapp = {};

			
			/**
		    * Create/Insert a new item into SP List/Library
			*
			* @example
			* Rest.list('MyTestList').lmfn();
			*
			* @return {Promise} - Return `Promise` containing the list metadata name
			*/
			_userapp.ensureUser = function(){
				var ajaxRequest = new AjaxHeadersSettings("POST", "/_api/web/ensureuser");

				ajaxRequest.data = JSON.stringify({ 'logonName' : loginName})

				return $.ajax(ajaxRequest);	
	        }


	    	return _userapp;
	    } //user methods end

	    app.group = function(groupname){
	    	
	    	//list app to be returned
			var _groupapp = {};

			
			/**
		    * Create/Insert a new item into SP List/Library
			*
			* @example
			* Rest.list('MyTestList').lmfn();
			*
			* @return {Promise} - Return `Promise` containing the list metadata name
			*/
			_groupapp.getUsers = function(){
				var ajaxRequest = new AjaxHeadersSettings("GET", "/_api/Web/sitegroups/getbyname('" + groupname + "')/users?$select=LoginName");

				var ajaxCall = $.ajax(ajaxRequest);

				addMethodsToAjax(ajaxCall);
				
				return ajaxCall;
	        }

	        _groupapp.addUser = function(metadata){

	        	metadata = metadata || {};

	        	var ajaxRequest = new AjaxHeadersSettings("POST", "/_api/Web/sitegroups/getbyname('" + groupname + "')/users");

	        	ajaxRequest.data = JSON.stringify(metadata);
	        	
	        	var ajaxCall = $.ajax(ajaxRequest);

				addMethodsToAjax(ajaxCall);

				return ajaxCall;

	        }

	        _groupapp.removeUser = function(metadata){

	        	metadata = metadata || {};

	        	var ajaxRequest = new AjaxHeadersSettings("POST", "/_api/Web/sitegroups/getbyname('" + groupname + "')/users/removeByLoginName");

	        	ajaxRequest.data = JSON.stringify(metadata);
	        	
	        	var ajaxCall = $.ajax(ajaxRequest);

				addMethodsToAjax(ajaxCall);
				return ajaxCall;
	        }


	    	return _groupapp;
	    } //user methods end
		
		
		app._ajaxSet = AjaxHeadersSettings;
		
		return app;
	})();



	/**
	 * jQuery plugin : Excel to JSON data 
	 *
	 * @return     {object}  excel copied data will be converted to JSON data
	 */
	$.fn.excelToJson = function(){
		
		console.log($(this));

		var data = $(this).val();
		
		var rows = data.split("\n");
	    var jsonData = [];
		
		var headerCells = rows[0].split("\t");

		for(i=0;i<rows.length;++i){

	        var headCell = rows[0].split("\t");

	        var cell = rows[i].split("\t");

	        var tempObj = {};

	        var dontPush = false;

	        if(i > 0){

	            for(x=0;x<headCell.length;++x){

	                if(cell[x] != undefined){
	                    tempObj[headCell[x]] = cell[x];
	                }else{
	                    dontPush = true;
	                }
	            }

	            if(!dontPush) jsonData.push(tempObj);

	        }
	    }

		return jsonData;
	}

	$.fn.preLoad = function(promise, options, callBack_) {

		    var node = this;


		    var defaultCss = {
		        backgroundImage: "url(https://mfc.sharepoint.com/sites/GOPlaybook/eucinventoryassets/images/loader.gif)",
		        backgroundSize: "9%",
		        backgroundColor: "#fff",
		        backgroundRepeat: "no-repeat",
		        backgroundPosition: "center",
		        width: "100%",
		        height: "100%",
		        position: "absolute",
		        top: 0,
		        left: 0,
		        opacity: .88,
		        zIndex: 5
		    };

		    var options = options || {};

		    var templateCss = $.extend({}, defaultCss, options);

		    //enable multiple calls
		    $(node).each(function() {

		        var self = $(this);

		        $(self).find(".--preloader").remove();

		        var template = $("<div class='--preloader'></div>");

		        self.css('position', 'relative');

		        template.css(templateCss).prependTo(self);

		        promise = promise || [];

		        var promises = Array.isArray(promise) ? promise : [promise];

		        console.log("Promises: %o", promises);

		        $.when.apply($, promises).then(function() {
		            console.log("done");
		            var args = (promise.length === 1) ? [arguments] : arguments;

		            /*var responses = [];
		            $.each(args, function(i, response) {
		                responses.push(response);
		            });*/

		            //callback(responses);

		            template.animate({
		                opacity: 0.88
		            }, 1200).fadeOut('slow', function() {
		                $(this).remove();
		            });

		            if (callBack_) callBack_();
		        });

		    });


		    if(options.returnPromise) {
		        return promise;
		    }
		    //enable chaining of methods
		    return node;

		} // dropss


	return Rest;
	
});



