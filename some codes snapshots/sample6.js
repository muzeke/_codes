//GLobal Variables
//
var consoleCSS_success =
  "font-size:18px; color:#00693c; font-family:Candara;width:100%;background:rgba(0,255,0,.2);border-radius:5px;padding:3px 4px;margin:3px;";
var consoleCSS_error =
  "font-size:18px; color:#f00; font-family:Calibri;width:100%;background:rgba(255,0,0,.2);border-radius:5px;padding:3px 4px;margin:3px;";

//**REST Module
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
     * Create/Insert a new item into SP List/Library
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

    _listapp.getItems = function(options) {
      //
      options = options || {};

      var ajaxRequest = new AjaxHeadersSettings(
        "GET",
        "/_api/web/lists/getbytitle('" + listname + "')/Items?"
      );

      if (options.columns) {
        options.columns = options.columns || [];

        var selectQ =
          options.filter || options.expands
            ? "$select=" + options.columns.join(",") + "&"
            : "$select=" + options.columns.join(",");

        ajaxRequest.url = ajaxRequest.url + selectQ;
      }

      if (options.expands) {
        options.expands = options.expands || [];

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

        return app
          .list(listname)
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

      ajaxRequest.data = JSON.stringify(data);

      return $.ajax(ajaxRequest);
    };

    return _listapp;
  };

  app.user = function(loginName) {
    var _userApp = {};

    _userApp.profile = function() {
      var ajaxRequest = new AjaxHeadersSettings(
        "POST",
        "/_api/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v='" +
          encodeURIComponent(loginName) +
          "'"
      );
      console.log(ajaxRequest);
      var xhr = $.ajax(ajaxRequest);

      xhr.logDepartment = function() {
        xhr.then(function(d) {
          var Department = d.d.UserProfileProperties.results.filter(function(
            props
          ) {
            return props.Key == "Department";
          });

          console.log(Department[0].Value);
        });
      };

      return xhr;
    };

    return _userApp;
  };

  app._ajaxSet = AjaxHeadersSettings;

  return app;
})();

/**
 * NotifyMe - notification boxes on the right
 */
var NotifyMe = (function() {
  var app = {};

  function template(option) {
    option.message = option.message || "";
    option.class = option.class || "";

    var templateHTML = [
      '<div class="notifyMe ' + option.class + '">',
      '<div class="notifyMe-icon">',
      '<i class="fa fa-bell"></i>',
      "</div>",
      '<div class="notifyMe-message">',
      "<p>" + option.message + "</p>",
      "</div>",
      '<label class="notifyMe-close">x</label>',
      "</div>"
    ];

    return templateHTML.join("");
  }

  app.bindEvent = function() {
    $("body").on("click", ".notifyMe-close", function() {
      console.log("a");
      $(this)
        .parent()
        .animate(
          {
            opacity: 0
          },
          1200,
          function() {
            $(this).remove();
          }
        );
    });
  };

  app.template = template;

  return app;
})();

NotifyMe.bindEvent();

$.fn.notifyMe = function(option) {
  $(this).prepend(NotifyMe.template(option));

  $(this)
    .find(":first-child")
    .animate(
      {
        opacity: 1
      },
      2000,
      function() {
        $(this).fadeOut("4000");
      }
    );

  return this;
};

/*****
    
  PROCESS Loader for ajax loading GIF
  
*****/
var ProcessingLoader = (function() {
  var preLoaderHtml = [
    '<div class="processingLoader" style="text-align:center">',
    '<img src="https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/preloaders/preloader_spinner.gif" style="text-align: center;">',
    "</div>"
  ].join("");

  var showPreloader = function(element) {
    element.html(preLoaderHtml);
  };

  return {
    showPreloader: showPreloader
  };
})();

function loader() {}
/*
  @@@@@@@@@@@@@END OF A MODULE
*/

$.fn.preLoad = function(promise, options) {
  var node = this;

  var defaultCss = {
    backgroundImage:
      "url(https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/preloaders/preloader_spinner.gif)",
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
    });
  });

  if (options.returnPromise) {
    return promise;
  }
  //enable chaining of methods
  return node;
}; // dropss

/*****
  
  getting the accestype of user on the SPO Access_List list
  
*****/
var getAccessType = (function() {
  var ajaxSettings = {
    url:
      _spPageContextInfo.webAbsoluteUrl +
      "/_api/Web/Lists/GetByTitle('Access_List')/Items?$select=*,Admin_Name/Name&$expand=Admin_Name&$filter=Admin_NameId eq " +
      _spPageContextInfo.userId,
    type: "GET",
    async: false,
    headers: {
      accept: "application/json;odata=verbose"
    }
  };

  var ajaxSuccess = function(data) {
    if (data.d.results.length == 0) {
      $(".container-fluid").html("");
      $(".jd-box").remove();
      $(".jd-menuButtons").remove();
      var noaccesserror_html =
        "<div class='no-access-wrapper'>" +
        "<article class='article-error-msg' style='width: 50%;margin: 0px auto;'>" +
        "<h1><strong>Oops</strong></h1>" +
        "<p>It seems that you don't have permission to access this page. Please contact the site administrator of this page if you want to request access.</p>" +
        "</article>" +
        "</div>";
      $(".container-fluid").html(noaccesserror_html);

      return;
    }

    var node = data.d.results[0];
    var access_type = node.Access_Type;

    console.log(access_type);

    _spPageContextInfo.JD_CurrentAdmin_Access_type = access_type;
  };

  var init = function() {
    ajaxSettings.success = function(data) {
      ajaxSuccess(data);
    };

    setGlobalVariables();

    return $.ajax(ajaxSettings);
  };

  var setGlobalVariables = function() {
    _spPageContextInfo.__ManagerDeadlineCount = 0;
    _spPageContextInfo.__SupportNotificationCount = 0;
    _spPageContextInfo.__ManagerSubmissionCount = 0;
  };

  return {
    init: init
  };
})();

/*
  @@@@@@@@@@@@@END OF A MODULE
*/

/*****
  
  AJAX Default Setups
  
*****/
var AjaxSetup = (function() {
  var get = function(listname, query) {
    var _settings = {
      url:
        _spPageContextInfo.webAbsoluteUrl +
        "/_api/Web/Lists/GetByTitle('" +
        listname +
        "')/Items?" +
        query,
      type: "GET",
      headers: {
        accept: "application/json;odata=verbose"
      }
    };

    return $.ajax(_settings);
  };

  return {
    get: get
  };
})();

/*
  @@@@@@@@@@@@@END OF A MODULE
*/

/*****
  
  Creating / Concatenating a query the filters if the user is an admin full access (from Access_List Sharepoint list)
  
*****/

var addFilterDependsOnAccessType = (function() {
  //note the query should be always added at the very first
  var getQuery = function() {
    var query = "";

    if (
      _spPageContextInfo.JD_CurrentAdmin_Access_type == "Admin Default Access"
    ) {
      query = "AssignedById eq " + _spPageContextInfo.userId + "  and  ";
    }

    return query;
  };

  return {
    getQuery: getQuery
  };
})();

/*
  @@@@@@@@@@@@@END OF A MODULE
*/

var getSharepointUserPhoto = function(mfcgd) {
  var photoSrc = mfcgd.substring(18);

  photoSrc = photoSrc.slice(0, -10);

  photoSrc =
    "https://mfc.sharepoint.com/_layouts/15/userphoto.aspx?size=L&username=" +
    photoSrc;

  return photoSrc;
};

function fixedEncodeURIComponent(src) {
  return encodeURIComponent(src).replace(/[']/g, function(c) {
    return (
      "%" + c.charCodeAt(0).toString(16) + "%" + c.charCodeAt(0).toString(16)
    );
  });
}

function fixedDecodeUri(src) {
  return decodeURIComponent(src).replace("'", "");
}

var PermissionModificationModule = (function() {
  var App = {};

  var siteUrl = _spPageContextInfo.webAbsoluteUrl;

  var webRelUrl = _spPageContextInfo.webServerRelativeUrl;

  _spPageContextInfo.counter__ = 0;

  _spPageContextInfo.counter___ = 0;

  function generateFileUrl(filename) {
    var url =
      siteUrl +
      "/_api/web/GetFileByServerRelativeUrl('" +
      webRelUrl +
      "/" +
      App.libraryName +
      "/" +
      filename +
      "')";

    return url;
  }

  function breakInheritanceOfFile(filename) {
    var ajaxSettings = {
      url:
        generateFileUrl(filename) +
        "/ListItemAllFields/breakroleinheritance(true)",
      type: "POST",
      headers: {
        accept: "application/json;odata=verbose",
        "content-type": "application/json;odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val()
      }
    };

    ajaxSettings.success = function(data) {
      // _spPageContextInfo.counter__++;
      //console.log(_spPageContextInfo.counter__);
    };

    return $.ajax(ajaxSettings);
  }

  function removeRoleAssignment(filename, groupId) {
    var ajaxSettings = {
      url:
        generateFileUrl(filename) +
        "/ListItemAllFields/roleassignments/getbyprincipalid(" +
        groupId +
        ")",
      type: "POST",
      headers: {
        accept: "application/json;odata=verbose",
        "content-type": "application/json;odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        "X-HTTP-Method": "DELETE"
      }
    };

    ajaxSettings.success = function(data) {
      _spPageContextInfo.counter___++;
      //console.log(_spPageContextInfo.counter___);
    };

    return $.ajax(ajaxSettings);
  }

  function ProcessAddingOfRoleAssignment(
    filename,
    groupId,
    targetRoleDefinitionId
  ) {
    var ajaxSettings = {
      url:
        generateFileUrl(filename) +
        "/ListItemAllFields/roleassignments/addroleassignment(principalid=" +
        groupId +
        ",roledefid=" +
        targetRoleDefinitionId +
        ")",
      type: "POST",
      headers: {
        accept: "application/json;odata=verbose",
        "content-type": "application/json;odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val()
      }
    };

    ajaxSettings.success = function(data) {
      console.log("%c Success adding role assignment", consoleCSS_success);
    };

    return $.ajax(ajaxSettings);
  }

  function addRoleAssignment(filename, groupId, targetRoleDefinitionName) {
    getTargetRoleDefinitionId(filename, groupId, targetRoleDefinitionName);
  }

  function getTargetRoleDefinitionId(
    filename,
    groupId,
    targetRoleDefinitionName
  ) {
    $.ajax({
      url:
        _spPageContextInfo.webAbsoluteUrl +
        "/_api/web/roledefinitions/getbyname('" +
        targetRoleDefinitionName +
        "')/id",
      type: "GET",
      headers: {
        accept: "application/json;odata=verbose"
      },
      success: function(responseData) {
        console.log(responseData.d.Id);

        var targetRoleDefinitionId = responseData.d.Id;

        ProcessAddingOfRoleAssignment(
          filename,
          groupId,
          targetRoleDefinitionId
        );
      },
      error: function(error) {
        console.log(error);
      }
    });
  }

  function getTargetGroupId(groupName) {
    $.ajax({
      url: siteUrl + "/_api/web/sitegroups/getbyname('" + groupName + "')/id",
      type: "GET",
      headers: {
        accept: "application/json;odata=verbose"
      },
      success: function(responseData) {
        var groupId = responseData.d.Id;
        console.log(groupId);
      },
      error: function(data) {
        console.log(data);
      }
    });
  }

  App.libraryName = "Job_Description_Files/versions";
  App.brkInhrt = breakInheritanceOfFile;
  App.rmvAsgn = removeRoleAssignment;
  App.addAsgn = addRoleAssignment;
  App.getGrpId = getTargetGroupId;

  return App;
})();

var GetAllFiles = (function(PM, GAI) {
  var App = {};

  function removeAGroupPermission(libraryName, groupId) {
    PM.libraryName = "Job_Description_Files/versions";

    var ajaxSettings = {
      url:
        _spPageContextInfo.webAbsoluteUrl +
        "/_api/Web/Lists/GetByTitle('" +
        libraryName +
        "')/Items?$select=*,FileLeafRef&$top=5000&$filter=Entry_Type eq '0'",
      type: "GET",
      headers: {
        accept: "application/json;odata=verbose"
      }
    };

    ajaxSettings.success = function(data) {
      console.log(data.d.results.length);

      $(data.d.results).each(function() {
        console.log("Removing Group Access for  : " + this.FileLeafRef);
        //remove every permission with Group Id = x , in a file
        var filename = this.FileLeafRef;
        var id = this.ID;

        PM.brkInhrt(filename)
          .done(function() {
            console.log("Break Inheritance Success for : " + filename);

            PM.rmvAsgn(filename, groupId)
              .done(function() {
                console.log(
                  "Remove Access Group : " +
                    groupId +
                    " Success for : " +
                    filename
                );
              })
              .fail(function() {
                console.log(
                  "Remove Access Group : " + groupId + " Fail for : " + filename
                );
              });
          })
          .fail(function() {
            console.log(
              "Break Inheritance Fail for : " + filename + " ID :" + id
            );
          });
      });
    };

    $.ajax(ajaxSettings);
  }

  function addUserPermission(libraryName) {
    var ajaxSettings = {
      url:
        _spPageContextInfo.webAbsoluteUrl +
        "/_api/Web/Lists/GetByTitle('" +
        libraryName +
        "')/Items?$select=*,FileLeafRef&$top=5000&$filter=Entry_Type eq '0'",
      type: "GET",
      headers: {
        accept: "application/json;odata=verbose"
      }
    };

    ajaxSettings.success = function(data) {
      console.log(data.d.results.length);

      $(data.d.results).each(function() {
        //remove every permission with Group Id = x , in a file

        var filename = this.FileLeafRef;
        PM.brkInhrt(filename).done(function() {
          console.log("Break inheritance for file : " + filename);

          GAI.getUserID(filename).done(function(data) {
            var node = data.d.results[0];

            console.log(
              node.AssignedManagerId + " = " + node.AssignedManager.Title
            );
            console.log(
              "Assigning role: File: " +
                filename +
                " user ID: " +
                node.AssignedManagerId
            );

            PM.addAsgn(filename, node.AssignedManagerId, "Contribute");
          });
        });
      });
    };

    $.ajax(ajaxSettings);
  }

  App.removeAGroupPermission = removeAGroupPermission;
  App.addUserPermission = addUserPermission;

  return App;
})(PermissionModificationModule, GetAnId);

var GetAnId = (function() {
  var App = {};

  var getUserIdByFileName = function(filename) {
    var url =
      "/_api/Web/Lists/GetByTitle('File_Assignments')/Items?$select=*,AssignedManager/Title,FileLeafRef&$expand=AssignedManager&$filter=New_File_Name eq '" +
      filename +
      "'&$top=1";

    var ajaxSettings = {
      url: _spPageContextInfo.webAbsoluteUrl + url,
      type: "GET",
      headers: {
        accept: "application/json;odata=verbose"
      }
    };

    ajaxSettings.success = function(data) {
      console.log(data.d.results.length);

      var node = data.d.results[0];

      //console.log(node.AssignedManagerId);
      //console.log(node.AssignedManager.Title);
    };

    return $.ajax(ajaxSettings);
  };

  App.getUserID = getUserIdByFileName;

  return App;
})();

function getFailedJDF_permission() {
  var fileIDs = [];
  var fileNames = [];
  var ajaxSettings = {
    url:
      _spPageContextInfo.webAbsoluteUrl +
      "/_api/Web/Lists/GetByTitle('Job_Description_Files')/Items?$select=ID,FileLeafRef&$top=5000&$filter=Entry_Type eq '0'&$expand=RoleAssignments",
    type: "GET",
    headers: {
      accept: "application/json;odata=verbose"
    }
  };

  ajaxSettings.success = function(data) {
    console.log(data.d.results);

    $(data.d.results).each(function(data) {
      //console.log(this.RoleAssignments.results.length);
      if (this.RoleAssignments.results.length < 3) {
        console.log(
          "ID " + this.ID + " - Count: " + this.RoleAssignments.results.length
        );
        fileIDs.push(this.ID);
        fileNames.push(this.FileLeafRef);
      }
    });
    console.log(fileIDs.length);
    console.log(
      "++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
    );

    $(fileNames).each(function() {
      var filename = this;

      GetAnId.getUserID(filename).done(function(data) {
        var node = data.d.results[0];

        console.log(
          node.AssignedManagerId + " = " + node.AssignedManager.Title
        );
        console.log(
          "Assigning role: File: " +
            filename +
            " user ID: " +
            node.AssignedManagerId
        );

        PermissionModificationModule.addAsgn(
          filename,
          node.AssignedManagerId,
          "Contribute"
        );
      });
    });
  };

  return $.ajax(ajaxSettings);
}

var __log = (function() {
  var App = {};

  var cli = function(text, style) {
    if (style == "consoleCSS_success") {
      style =
        "font-size:14px; color:#00693c; font-family:Calibri;width:100%;background:rgba(0,255,0,.2);border-radius:5px;padding:3px 4px;margin:3px;padding-right:7px";
    } else if (style == "consoleCSS_info") {
      style =
        "font-size:14px; color:#157ed2; font-family:Calibri;width:100%;background:#d8f2ff;border-radius:5px;padding:5px 7px;margin:3px;padding-right:7px";
    } else if (style == "consoleCSS_error") {
      style =
        "font-size:14px; color:#f00; font-family:Calibri;width:100%;background:rgba(255,0,0,.1);border-radius:5px;padding:3px 4px;margin:3px;padding-right:7px";
    } else if (style == undefined) {
      style =
        "font-size:13px; color:#444; font-family:Calibri;width:100%;background:rgba(0,110,0,.05);border-radius:5px;padding:4px 7px;margin:3px;";
    }

    return console.log("%c " + text, style);
  };

  App.cli = cli;

  return App;
})();

//*PLUGINS
//
//
$.fn.s2WithLoad = function(options) {
  options = options || {};

  if (typeof options === "object") {
    options.promiseArray = options.promiseArray || [];

    return options.promiseArray.push(
      FilterDatatable.load(
        this,
        options.queryFilter,
        options.listname,
        options.columns,
        options.placeholder
      )
    );
  }
};
