var $ = require("jquery");

(function(global, factory) {
  if (typeof define !== "undefined") {
    define(["jquery"], function($) {
      return factory();
    });
  } else {
    global.Rest = factory();
  }
})(window, function() {
  var Rest = (function() {
    //object to be returned to make methods accessible outside
    var app = {};
    /**
     * A constructor function jQuery ajax calls
     * @constructor
     * @param  {string} type    - ['GET', 'POST']
     * @param  {string} baseEndpoint - api endpoint
     */
    function AjaxHeadersSettings(type, baseEndpoint) {
      this.url = _spPageContextInfo.webAbsoluteUrl + baseEndpoint;
      this.type = type;
      this.setHeaders();
    }
    /**
     * Prototype for AjaxheadersSettings Constructor
     * @set headers
     */
    AjaxHeadersSettings.prototype.setHeaders = function() {
      if (this.type == "GET") {
        this.headers = {
          accept: "application/json;odata=verbose"
        };
      } else if (this.type == "POST") {
        this.headers = {
          accept: "application/json;odata=verbose",
          "X-RequestDigest": $("#__REQUESTDIGEST").val(),
          "content-Type": "application/json;odata=verbose"
        };
      } else if (this.type == "PATCH") {
        this.headers = {
          accept: "application/json;odata=verbose",
          "X-RequestDigest": $("#__REQUESTDIGEST").val(),
          "content-Type": "application/json;odata=verbose",
          "X-Http-Method": "PATCH",
          "If-Match": "*"
        };
      } else if (this.type == "DELETE") {
        this.headers = {
          accept: "application/json;odata=verbose",
          "X-RequestDigest": $("#__REQUESTDIGEST").val(),
          "If-Match": "*"
        };
      }
    };
    /**
     * Function to add methods to the returned ajax object
     * @param  {object} ajaxCall    - the jQuery ajax object
     */
    function addMethodsToAjax(ajaxCall) {
      //Developer log method, used to log the results
      ajaxCall.log = function() {
        ajaxCall.then(function(d) {
          console.log(d);
        });
        return ajaxCall;
      };
      //Developer count / length method, used to log the count / length of the results
      ajaxCall.count = ajaxCall.length = function() {
        ajaxCall.then(function(d) {
          console.log(d.d.results.length);
        });
        return ajaxCall;
      };
      ajaxCall.fail(function(er) {
        console.log(
          "%c " + er.responseJSON.error.message.value,
          "padding:10px;color:red;background:rgba(255,0,0,.1);border-radius:5px"
        );
      });
    }
    /**
     * show Error
     * @param  {object} error    - error from an ajax Request
     **/
    function showError(error) {
      console.error(error.message.value);
    }
    /**
     * List Methods
     * @param  {string} listname    - name of the SharePoint list, library
     **/
    app.list = function(listname) {
      //list app to be returned
      var _listapp = {};
      /**
       *
       * @example
       * Rest.list('MyTestList').lmfn();
       *
       * @return {Promise} - Return `Promise` containing the list metadata name
       */
      _listapp.lmfn = function() {
        var ajaxRequest = new AjaxHeadersSettings(
          "GET",
          "/_api/Web/Lists/GetByTitle('" +
            listname +
            "')/ListItemEntityTypeFullName"
        );
        ajaxRequest.success = function(data) {
          console.log(data.d.ListItemEntityTypeFullName);
        };
        return $.ajax(ajaxRequest);
      };

      /**
       * Get Items From Library
       *
       * @example
       * Rest.list('MyTestList').getItems();
       * @param  {object} options    - object of options [columns, filter]
       *
       * @example - without arguments
       *  Rest.list('MyTestList').getItems();
       *
       * @example - with select columns options
       *  Rest.list('MyTestList').getItems({ columns: [], filter: "", expands:[]});
       *
       * @return {Promise} - Return `Promise` containing the data results
       */
      _listapp.getItems = function(options) {
        //
        options = options || {};
        var ajaxRequest = new AjaxHeadersSettings(
          "GET",
          "/_api/web/lists/getbytitle('" + listname + "')/Items?"
        );
        if (options.url) {
          ajaxRequest.url = options.url;
        }
        if (options.columns) {
          options.columns = options.columns || [];
          if (!Array.isArray(options.columns))
            options.columns = [options.columns];
          var selectQ =
            options.filter || options.expands
              ? "$select=" + options.columns.join(",") + "&"
              : "$select=" + options.columns.join(",");
          ajaxRequest.url = ajaxRequest.url + selectQ;
        }
        if (options.expands) {
          options.expands = options.expands || [];
          if (!Array.isArray(options.expands))
            options.expands = [options.expands];
          ajaxRequest.url = options.filter
            ? ajaxRequest.url + "$expand=" + options.expands.join(",") + "&"
            : ajaxRequest.url + "$expand=" + options.expands.join(",");
        }
        if (options.filter) {
          ajaxRequest.url = ajaxRequest.url + options.filter;
        }
        var ajaxCall = $.ajax(ajaxRequest);
        addMethodsToAjax(ajaxCall);
        return ajaxCall;
      };

      /**
       * Recursive Get Items From Library
       * Use if SP List / Library exceeds 5000
       * @example
       * Rest.list('MyTestList').recursiveGetItems();
       * @param  {object} options    - object of options [columns, filter]
       *
       * @example - without arguments
       *  Rest.list('MyTestList').recursiveGetItems();
       *
       * @example - with select columns options
       *  Rest.list('MyTestList').recursiveGetItems({ columns: [], filter: "", expands:[]});
       *
       * @return {Promise} - Return `array` containing all of the data results
       */

      _listapp.recursiveGetItems = function(options, response) {
        options = options || {};
        var ajaxRequest = new AjaxHeadersSettings(
          "GET",
          "/_api/web/lists/getbytitle('" + listname + "')/Items?"
        );
        if (options.url) {
          ajaxRequest.url = options.url;
        }
        if (options.columns) {
          options.columns = options.columns || [];
          if (!Array.isArray(options.columns))
            options.columns = [options.columns];
          var selectQ =
            options.filter || options.expands
              ? "$select=" + options.columns.join(",") + "&"
              : "$select=" + options.columns.join(",");
          ajaxRequest.url = ajaxRequest.url + selectQ;
        }
        if (options.expands) {
          options.expands = options.expands || [];
          if (!Array.isArray(options.expands))
            options.expands = [options.expands];
          ajaxRequest.url = options.filter
            ? ajaxRequest.url + "$expand=" + options.expands.join(",") + "&"
            : ajaxRequest.url + "$expand=" + options.expands.join(",");
        }
        if (options.filter) {
          ajaxRequest.url = ajaxRequest.url + options.filter;
        }
        console.log(options);
        var ajaxCall = $.ajax(ajaxRequest);
        addMethodsToAjax(ajaxCall);
        response = response || [];
        return ajaxCall.then(function(data) {
          response = response.concat(data.d.results);
          if (!data.d.__next) return response;
          return _listapp.recursiveGetItems(
            {
              url: data.d.__next
            },
            response
          );
        });
      };

      /**
       * Create Item
       *
       * @example
       * Rest.list('MyTestList').create( data );
       *
       * @example - without arguments
       *  Rest.list('MyTestList').create();
       *
       * @return {Promise} - Return `Promise`
       */
      _listapp.create = function(data) {
        if (!data) {
          console.error("Please fill out data to insert");
          return;
        }
        data = data || {};
        var ajaxRequest = new AjaxHeadersSettings(
          "POST",
          "/_api/web/lists/getbytitle('" + listname + "')/Items"
        );
        if (!data.__metadata) {
          console.warn(
            "No __metadata tag for the list included in the data, an ajax request will be sent to get the __metadata before creating the item"
          );
          return Rest.list(listname)
            .lmfn()
            .then(function(x) {
              data.__metadata = {
                type: x.d.ListItemEntityTypeFullName
              };
              ajaxRequest.data = JSON.stringify(data);
              return $.ajax(ajaxRequest);
            });
        }
        ajaxRequest.data = JSON.stringify(data);
        return $.ajax(ajaxRequest);
      };

      /**
       * Update Item
       *
       * @example
       * Rest.list('MyTestList').update( data );
       *
       * @example - without arguments
       *  Rest.list('MyTestList').update();
       *
       * @return {Promise} - Return `Promise`
       */

      _listapp.update = function(data) {
        if (!data) {
          console.error("Please fill out data to insert");
          return;
        }
        data = data || {};
        if (!data.id) {
          console.log("Please include the id of the item you want to update!");
          return;
        }
        var ajaxRequest = new AjaxHeadersSettings(
          "PATCH",
          "/_api/web/lists/getbytitle('" +
            listname +
            "')/getItemById('" +
            data.id +
            "')"
        );
        if (!data.__metadata) {
          console.warn(
            "No __metadata tag for the list included in the data, an ajax request will be sent to get the __metadata before creating the item"
          );
          //get __metadata
          return Rest.list(listname)
            .lmfn()
            .then(function(x) {
              data.__metadata = {
                type: x.d.ListItemEntityTypeFullName
              };
              ajaxRequest.data = JSON.stringify(data);
              return $.ajax(ajaxRequest);
            });
        }
        delete data.id;
        ajaxRequest.data = JSON.stringify(data);
        return $.ajax(ajaxRequest);
      };

      /**
       * Delete Item
       *
       * @example
       * Rest.list('MyTestList').delete( id );
       *
       * @example - without arguments
       *  Rest.list('MyTestList').delete();
       *
       * @return {Promise} - Return `Promise`
       */

      _listapp.delete = function(id) {
        var ajaxRequest = new AjaxHeadersSettings(
          "DELETE",
          "/_api/web/lists/getbytitle('" +
            listname +
            "')/getItemById('" +
            id +
            "')"
        );
        return $.ajax(ajaxRequest);
      };

      /**
       * Get Field Name Props
       *
       * @example
       * Rest.list('MyTestList').field( fieldName );
       *
       * @return {Promise} - Return `Promise`
       */
      _listapp.field = function(fieldName) {
        var temp = {};
        temp.getOptions = function() {
          var ajaxRequest = new AjaxHeadersSettings(
            "GET",
            "/_api/web/lists/getbytitle('" +
              listname +
              "')/fields?$filter=EntityPropertyName eq '" +
              fieldName +
              "'"
          );
          return $.ajax(ajaxRequest);
        };
        return temp;
      };
      return _listapp;
    }; //list methods end

    app.user = function(loginName) {
      //list app to be returned
      var _userapp = {};
      /**
       * Ensure user to the sharepoint online
       *
       * @example
       * Rest.user('loginname').ensureUser();
       *
       * @return {Promise} - Return `Promise`
       */
      _userapp.ensureUser = function() {
        var ajaxRequest = new AjaxHeadersSettings(
          "POST",
          "/_api/web/ensureuser"
        );
        ajaxRequest.data = JSON.stringify({
          logonName: loginName
        });
        return $.ajax(ajaxRequest);
      };
      return _userapp;
    }; //user methods end

    app.group = function(groupname) {
      //list app to be returned
      var _groupapp = {};

      /**
       * Get users from a group in SP
       *
       * @example
       * Rest.user('groupname').getUsers();
       *
       * @return {Promise} - Return `Promise`
       */
      _groupapp.getUsers = function() {
        var ajaxRequest = new AjaxHeadersSettings(
          "GET",
          "/_api/Web/sitegroups/getbyname('" +
            groupname +
            "')/users?$select=LoginName"
        );
        var ajaxCall = $.ajax(ajaxRequest);
        addMethodsToAjax(ajaxCall);
        return ajaxCall;
      };

      /**
       * Add users to a group in SP
       *
       * @example
       * Rest.user('groupname').addUser(metadata);
       *
       * @return {Promise} - Return `Promise`
       */
      _groupapp.addUser = function(metadata) {
        metadata = metadata || {};
        var ajaxRequest = new AjaxHeadersSettings(
          "POST",
          "/_api/Web/sitegroups/getbyname('" + groupname + "')/users"
        );
        ajaxRequest.data = JSON.stringify(metadata);
        var ajaxCall = $.ajax(ajaxRequest);
        addMethodsToAjax(ajaxCall);
        return ajaxCall;
      };

      /**
       * Remove userfrom a group in SP
       *
       * @example
       * Rest.user('groupname').removeUser(metadata);
       *
       * @return {Promise} - Return `Promise`
       */
      _groupapp.removeUser = function(metadata) {
        metadata = metadata || {};
        var ajaxRequest = new AjaxHeadersSettings(
          "POST",
          "/_api/Web/sitegroups/getbyname('" +
            groupname +
            "')/users/removeByLoginName"
        );
        ajaxRequest.data = JSON.stringify(metadata);
        var ajaxCall = $.ajax(ajaxRequest);
        addMethodsToAjax(ajaxCall);
        return ajaxCall;
      };

      return _groupapp;
    }; //user methods end

    app.AjaxHeadersSettings = AjaxHeadersSettings;
    return app;
  })();

  /**
   * Module for File Uploading
   *
   * @return {Promise} - Return `Promise`
   */
  var FileUploadModule = (function(rest) {
    /**
     * Just getting the file buffer
     * @param  {file Object} currentFile - the file to be uploaded / single file only
     * @return {promise}            [promise / deffered buffer object]
     */
    function getFileBuffer(currentFile) {
      var deferred = jQuery.Deferred();
      var reader = new FileReader();
      reader.onloadend = function(e) {
        deferred.resolve(e.target.result);
      };
      reader.onerror = function(e) {
        deferred.reject(e.target.error);
      };
      reader.readAsArrayBuffer(currentFile);
      return deferred.promise();
    }
    /**
     * [update the metadata of the uploaded file]
     * @param  {array} option []
     * @example { data: {}, file: theFIle, docLib: "", itemId: "" }
     * @return {promise}
     */
    function updateFileMetaData(option) {
      var ajaxRequest = new rest.AjaxHeadersSettings(
        "POST",
        "/_api/Web/lists/getbytitle('" +
          option.docLib +
          "')/items(" +
          option.itemId +
          ")"
      );
      //add settings to headers of POST request as this is an upload request
      ajaxRequest.headers["X-Http-Method"] = "MERGE";
      //add IF match header so we are sure that we are updating without conflict
      ajaxRequest.headers["IF-MATCH"] =
        option.file.ListItemAllFields.__metadata.etag;
      if (!option.data) {
        console.error("Please fill out data to insert");
        return;
      }
      option.data = option.data || {};
      ajaxRequest.data = JSON.stringify(option.data);
      return $.ajax(ajaxRequest);
    }
    /**
     * [uploadFileToFolder description]
     * @param  {object} option [description]
     * @example of option { url: "", file: "", element: $element}
     * @return {[type]}        [description]
     */
    function uploadFileToFolder(option) {
      //get the file from the buffer
      var getFile = getFileBuffer(option.file);
      return getFile.then(function(arrayBuffer) {
        var ajaxRequest = new rest.AjaxHeadersSettings("POST", "");
        ajaxRequest.url = option.url;
        ajaxRequest.data = arrayBuffer;
        ajaxRequest.processData = false;
        ajaxRequest.contentType = false;
        ajaxRequest.xhr = function() {
          var xhr = new window.XMLHttpRequest();
          xhr.upload.addEventListener(
            "progress",
            function(evt) {
              if (evt.lengthComputable) {
                var percentComplete = evt.loaded / evt.total;
                var loadedInKB = Math.round(evt.loaded / 1024);
                var totalInKB = Math.round(evt.total / 1024);
                percentComplete = parseInt(percentComplete * 100);
                //option.element.text(percentComplete + '%');
                //
                // option.element.text(loadedInKB + ' KB out of ' + totalInKB + ' KB');
                if (
                  option.element
                    .parent()
                    .parent()
                    .find(".fileSizeUploadedProgress").length
                ) {
                  option.element
                    .parent()
                    .parent()
                    .find(".fileSizeUploadedProgress")
                    .text(loadedInKB + " KB out of " + totalInKB + " KB");
                } else {
                  option.element
                    .parent()
                    .parent()
                    .prepend(
                      "<div class='fileSizeUploadedProgress' style='text-align: center; margin-bottom: -1px; background: #424559; padding: 5px 26px; color: #fff; border-top-left-radius: 5px; border-top-right-radius: 5px;'>" +
                        loadedInKB +
                        " KB out of " +
                        totalInKB +
                        " KB" +
                        "</div>"
                    );
                }
                option.element.text(percentComplete + "%");
                option.element.css("width", percentComplete + "%");
                if (percentComplete === 100) {
                  //cheat 500 milliseconds
                  setTimeout(function() {
                    option.element.text("Completing upload process...");
                  }, 500);
                }
              }
            },
            false
          );
          return xhr;
        };
        return $.ajax(ajaxRequest);
      });
    }
    return {
      uploadFileToFolder: uploadFileToFolder,
      updateFileMetaData: updateFileMetaData,
      getFileBuffer: getFileBuffer
    };
  })(Rest); //File Upload ends here
  /**
   * Extending the REST Module
   */
  var Rest = (function(app, FileUploadModule) {
    /**
     * method for library (though app.list crud could be use for doc libs as well, below methods are for other stuffs that is specifically can be done with doc lib only )
     * @param  {[type]} libraryName [description]
     * @return {[type]}             [description]
     */
    app.library = function(libraryName) {
      var _libraryApp = {};
      /**
       * The main method to trigger the fileupload
       * @param  {[type]} option
       *  option {fileName: "", folderPath: "", file: "", element: $(element), metadata: {}, fileUploadedCallback : function}
       * @return {[type]}         [description]
       */
      _libraryApp.fileUpload = function(option) {
        console.group("rest.library(libraryName).fileUpload");
        console.log({
          file: "file to be uploaded || Required",
          fileName: "File name || Required",
          folderPath:
            "Folder Path where you want item to be uploaded || Optional",
          element:
            "Element where the progress bar will show the percentage of file upload || required",
          metadata: "Metadata you are adding with the file || Optional",
          fileUploadedCallback: "Callback function || Optional",
          fileMetadataUpdatedCallBack: "Callback function || Optional"
        });
        console.groupEnd();
        if (option === "info") return;
        option = option || {};
        //validations
        //check if file is not empty
        if (option.file[0].files.length === 0) {
          console.error("Please select a file");
          return;
        }
        //get the very first file
        option.file = option.file[0].files[0];
        option.fileName = option.fileName || option.file.name;
        option.folderPath = option.folderPath || "";
        if (!option.element) {
          alert("Please select loader element");
          return;
        }
        var fileSizeInKB = Math.round(option.file.size / 1024);
        //it seems that REST API only allows file upload upto 100 MB (100 000 KB)
        if (fileSizeInKB > 100000) {
          console.log(
            "File upload size limit reach. Please upload files under 100000 KB / 100 MB"
          );
          option.element.text(
            "File upload size limit reach. Please upload files under 100000 KB / 100 MB"
          );
          return;
        }
        //option.element.text("0 KB out of " + fileSizeInKB + " KB");
        //callback when fileupload is done
        option.fileUploadedCallback =
          option.fileUploadedCallback ||
          function() {
            console.log("File has been uploaded!.. Updating metadata");
            option.element.text(
              "File uploaded! File Metadata is being updated..."
            );
          };
        option.fileMetadataUpdatedCallBack =
          option.fileMetadataUpdatedCallBack ||
          function() {
            console.log("File metadata has been updated");
            option.element.text("File Upload process complete!");
          };
        option.metadata = option.metadata || {};
        var targetUrl =
          _spPageContextInfo.webServerRelativeUrl +
          "/" +
          libraryName +
          "/" +
          option.folderPath;
        url =
          _spPageContextInfo.webAbsoluteUrl +
          "/_api/Web/GetFolderByServerRelativeUrl(@target)/Files/add(overwrite=true, url='" +
          option.fileName +
          "')?$expand=ListItemAllFields&@target='" +
          targetUrl +
          "'";
        return FileUploadModule.uploadFileToFolder({
          url: url,
          file: option.file,
          element: option.element
        }).then(function(data) {
          //we call the file uploaded call back here
          option.fileUploadedCallback();
          var fileData = data.d;
          option.metadata.__metadata = {
            type: fileData.ListItemAllFields.__metadata.type
          };
          return FileUploadModule.updateFileMetaData({
            file: fileData,
            data: option.metadata,
            docLib: libraryName,
            itemId: fileData.ListItemAllFields.Id
          }).then(function(data) {
            option.fileMetadataUpdatedCallBack(data);
          });
        });
      };
      return _libraryApp;
    };
    return app;
  })(Rest, FileUploadModule);
  /**
   * jQuery plugin : Excel to JSON data
   *
   * @return     {object}  excel copied data will be converted to JSON data
   */
  $.fn.excelToJson = function() {
    console.log($(this));
    var data = $(this).val();
    var rows = data.split("\n");
    var jsonData = [];
    var headerCells = rows[0].split("\t");
    for (i = 0; i < rows.length; ++i) {
      var headCell = rows[0].split("\t");
      var cell = rows[i].split("\t");
      var tempObj = {};
      var dontPush = false;
      if (i > 0) {
        for (x = 0; x < headCell.length; ++x) {
          if (cell[x] != undefined) {
            tempObj[headCell[x]] = cell[x];
          } else {
            dontPush = true;
          }
        }
        if (!dontPush) jsonData.push(tempObj);
      }
    }
    return jsonData;
  };
  $.fn.preLoad = function(promise, options, callBack_) {
    var node = this;
    var defaultCss = {
      backgroundImage:
        "url(https://mfc.sharepoint.com/sites/GOPlaybook/eucinventoryassets/images/loader.gif)",
      backgroundSize: "9%",
      backgroundColor: "#fff",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      width: "100%",
      height: "100%",
      position: "absolute",
      top: 0,
      left: 0,
      opacity: 0.88,
      zIndex: 5
    };
    var options = options || {};
    var templateCss = $.extend({}, defaultCss, options);
    //enable multiple calls
    $(node).each(function() {
      var self = $(this);
      $(self)
        .find(".--preloader")
        .remove();
      var template = $("<div class='--preloader'></div>");
      self.css("position", "relative");
      template.css(templateCss).prependTo(self);
      promise = promise || [];
      var promises = Array.isArray(promise) ? promise : [promise];
      console.log("Promises: %o", promises);
      $.when.apply($, promises).then(function() {
        console.log("done");
        var args = promise.length === 1 ? [arguments] : arguments;
        /*var responses = [];
                    $.each(args, function(i, response) {
                        responses.push(response);
                    });*/
        //callback(responses);
        template
          .animate(
            {
              opacity: 0.88
            },
            1200
          )
          .fadeOut("slow", function() {
            $(this).remove();
          });
        if (callBack_) callBack_();
      });
    });
    if (options.returnPromise) {
      return promise;
    }
    //enable chaining of methods
    return node;
  }; // dropss
  return Rest;
});
