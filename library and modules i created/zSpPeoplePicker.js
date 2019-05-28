(function(global, factory) {
  if (typeof define !== "undefined") {
    define(["jquery"], function($) {
      return factory();
    });
  } else {
    global.PeoplePicker = factory();
  }
})(window, function() {
  var PeoplePicker = (function($, global) {
    //just a custom script to load scripts
    $.getMultiScripts = function(arr, path) {
      var _arr = $.map(arr, function(scr) {
        return $.getScript((path || "") + scr);
      });

      _arr.push(
        $.Deferred(function(deferred) {
          $(deferred.resolve);
        })
      );

      return $.when.apply($, _arr);
    };

    var peoplePickerSpanWrapper = "_TopSpan";

    var customPeoplePickerSettings = {
      singlePeoplePicker: true
    };

    //scripts dependency of SP People Picker
    var peoplePickerDependecySCRIPTS = [
      _spPageContextInfo.webAbsoluteUrl + "/_layouts/15/sp.core.js",
      _spPageContextInfo.webAbsoluteUrl + "/_layouts/15/clienttemplates.js",
      _spPageContextInfo.webAbsoluteUrl + "/_layouts/15/clientforms.js",
      _spPageContextInfo.webAbsoluteUrl + "/_layouts/15/clientpeoplepicker.js",
      _spPageContextInfo.webAbsoluteUrl + "/_layouts/15/autofill.js",
      _spPageContextInfo.webAbsoluteUrl + "/_layouts/15/1033/sts_strings.js"
    ];

    //binding defaults events
    function bindDefaultEvents(currentPeoplePicker) {
      //set onchange event function
      currentPeoplePicker.OnValueChangedClientScript = function() {
        //hides the input whenever we have a user selected
        /*if(currentPeoplePicker.TotalUserCount > 0) {
					$("#" + currentPeoplePicker.EditorElementId).hide();
	            }else{
					$("#" + currentPeoplePicker.EditorElementId).show();
	            }*/

        //custom change events added here
        currentPeoplePicker.onChange();
      };

      //bind get user ID event ajax call
      currentPeoplePicker.getUserId = ensureUser;
    }

    function ensureUser(email_address) {
      var payload = {
        logonName: "i:0#.f|membership|" + email_address
      };
      return $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/ensureuser",
        type: "POST",
        contentType: "application/json;odata=verbose",
        data: JSON.stringify(payload),
        headers: {
          "X-RequestDigest": $("#__REQUESTDIGEST").val(),
          accept: "application/json;odata=verbose"
        }
      });
    }

    //function to initialize the people picker
    function initializePeoplePicker(
      peoplePickerElementId,
      scriptsLoadedCallBack
    ) {
      // Create a schema to store picker properties, and set the properties.
      var schema = {};
      schema["PrincipalAccountType"] = "User,DL,SecGroup,SPGroup";
      schema["SearchPrincipalSource"] = 15;
      schema["ResolvePrincipalSource"] = 15;
      schema["AllowMultipleValues"] = true;
      schema["AllowMultipleUsers"] = true;
      schema["MaximumEntitySuggestions"] = 50;
      schema["Width"] = "100%";

      //if dependecy scripts has been loaded then don't load it anymore
      if (global.PeoplePickerScriptsLoaded) peoplePickerDependecySCRIPTS = [];

      //load dependency scripts before calling
      $.getMultiScripts(peoplePickerDependecySCRIPTS, "").done(function() {
        //setting to true
        global.PeoplePickerScriptsLoaded = true;

        // Render and initialize the picker.
        // Pass the ID of the DOM element that contains the picker, an array of initial
        // PickerEntity objects to set the picker value, and a schema that defines
        // picker properties.
        global.SPClientPeoplePicker_InitStandaloneControlWrapper(
          peoplePickerElementId,
          null,
          schema
        );

        //Get the Current PeoplePicker
        var currentPeoplePicker =
          global.SPClientPeoplePicker.SPClientPeoplePickerDict[
            peoplePickerElementId + peoplePickerSpanWrapper
          ];

        currentPeoplePicker.onChange = function() {};

        //bind data to check that the field has been transformed to PeoplePicker
        $("#" + peoplePickerElementId).data("transformedToPeoplePicker", true);
        //bind default events
        bindDefaultEvents(currentPeoplePicker);

        scriptsLoadedCallBack(currentPeoplePicker);
      });
    }

    return {
      initPP: initializePeoplePicker,
      bind: bindDefaultEvents,
      getUserId: ensureUser
    };
  })(jQuery, window);

  //jQuery plugin
  $.fn.peoplePicker = function(options) {
    //ensure that we are only getting one element which here is the first element
    var node = this[0];

    var elementId = node.id;

    //API object to return
    var __methods = {};

    __methods.load = function(cb) {
      var peoplePickerSpanWrapper = "_TopSpan";

      cb = cb || function() {};

      return PeoplePicker.initPP(elementId, cb);
    };

    __methods.get = function() {
      if (!$("#" + elementId).data("transformedToPeoplePicker")) {
        console.log("Element is not transformed to People Picker");

        return;
      }

      var id = Object.keys(SPClientPeoplePicker.SPClientPeoplePickerDict).map(
        function(c) {
          if (c.indexOf(elementId) != -1) {
            return c;
          } else {
            return "error";
          }
        }
      );

      var currentPeoplePicker =
        SPClientPeoplePicker.SPClientPeoplePickerDict[id];

      return currentPeoplePicker;
    };

    __methods.attachOnChangeEvent = function(event) {
      if (!$("#" + elementId).data("transformedToPeoplePicker")) {
        console.log("Element is not transformed to People Picker");

        return;
      }

      var id = Object.keys(SPClientPeoplePicker.SPClientPeoplePickerDict).map(
        function(c) {
          if (c.indexOf(elementId) != -1) {
            return c;
          } else {
            return "error";
          }
        }
      );

      var currentPeoplePicker =
        SPClientPeoplePicker.SPClientPeoplePickerDict[id];

      currentPeoplePicker.onChange = function() {
        event(currentPeoplePicker);
      };
    };

    return __methods;
  };

  return PeoplePicker;
});
