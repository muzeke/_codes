var CAMLQuery = (function() {
  var app = {};

  function cleanArray(actual) {
    var newArray = new Array();
    for (var i = 0; i < actual.length; i++) {
      if (actual[i]) {
        newArray.push(actual[i]);
      }
    }
    return newArray;
  }

  app.buildCAMLOperator = function(tempAr, operator) {
    //remove all empty arrays

    tempAr = cleanArray(tempAr);

    console.log(tempAr);

    operator = operator || "And";

    var tempQuery = "";

    if (tempAr.length === 1) {
      tempQuery = tempAr.toString();

      return tempQuery;
    }

    while (tempAr.length > 0) {
      var currentQuery = tempAr.splice(0, 2);

      tempQuery = currentQuery.join("");

      tempQuery = "<" + operator + ">" + tempQuery + "</" + operator + ">";

      if (tempAr.length > 0) {
        //push the array at the very first
        tempAr.unshift(tempQuery);
      }
    }

    return tempQuery;
  };

  app.buildCAMLIn = function(fieldName, values, type, property) {
    type = type || "Text";

    if (values == null) return "";

    values = typeof values === "string" ? [values] : values;

    if (values.length === 0) return "";

    if (property) {
      var temp = [];

      values.forEach(function(v) {
        temp.push(v[property]);
      });

      values = [].concat.apply([], temp);
    }

    var addOns = type.toUpperCase() === "LOOKUP" ? "LookupId='TRUE' " : "";

    //create in query and header query
    var inQuery_header = [
      "<In><FieldRef Name='" + fieldName + "' " + addOns + "/><Values>"
    ];

    var inQuery = inQuery_header;

    //each item query

    if (values.length > 500) {
      var tempAr = [];

      while (values.length > 0) {
        var inQuery_header = [
          "<In><FieldRef Name='" + fieldName + "' " + addOns + "/><Values>"
        ];

        var inQuery = inQuery_header;

        values.splice(0, 500).forEach(function(value) {
          inQuery.push("<Value Type='" + type + "'>" + value + "</Value>");
        });

        inQuery.push("</Values></In>");

        tempAr.push(inQuery.join(""));
      }

      //console.log(app.buildCAMLOperator(tempAr, "OR"));

      return app.buildCAMLOperator(tempAr, "OR");
    } else {
      console.log("minimal here");

      values.forEach(function(value) {
        inQuery.push("<Value Type='" + type + "'>" + value + "</Value>");
      });
    }

    //add footer query

    inQuery.push("</Values></In>");

    return inQuery.join("");
  };

  app.wrap = function(camlQuery) {
    var completeCAML = [
      "<View><Query><Where>",
      camlQuery,
      "</Where></Query></View>"
    ].join("");

    return completeCAML;
  };

  function getIdOnSelectData(elData, property) {
    var tempAr = [];

    elData.forEach(function(i) {
      tempAr.push(i[property]);
    });
    console.log(tempAr);
    tempAr = [].concat.apply([], tempAr);
    return tempAr;
  }

  app.build = function(elementVal, fieldName, type) {
    type = type || "Text";

    if (elementVal === null) {
      return "";
    }

    elementVal =
      typeof elementVal === "string" ? (elementVal = [elementVal]) : elementVal;
  };

  app.test = function(listName, caml) {
    caml = app.wrap(caml);

    console.log(caml);

    /// set request data
    var data = {
      query: {
        __metadata: {
          type: "SP.CamlQuery"
        },
        ViewXml: caml
      }
    };

    /// make an ajax call
    return $.ajax({
      url:
        _spPageContextInfo.siteAbsoluteUrl +
        "/_api/web/lists/GetByTitle('" +
        listName +
        "')/GetItems?$select=*,FileLeafRef",
      method: "POST",
      data: JSON.stringify(data),
      headers: {
        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        "content-type": "application/json;odata=verbose",
        accept: "application/json;odata=verbose"
      },
      success: function(dataObject) {
        $(dataObject.d.results).each(function() {
          var node = this;
          var id = this.ID;
          var jobcode = this.Job_Code;

          node["DT_RowId"] = "row_" + id; //node id

          node["DT_RowAttr"] = {
            "data-job_code_value": jobcode
          };
        });

        $("#jd-datatable").DataTable({
          dom: 'Bf<"#info2"i>tip',
          buttons: ["copy", "csv", "excel", "pdf", "print"],
          destroy: true,
          processing: true,
          lengthMenu: [[50, 150, 500, -1], [50, 150, 500, "All"]],
          data: dataObject.d.results,
          searching: true,
          columns: [
            {
              data: null,
              render: function(data) {
                var __data = "";

                __data = "<span id='" + data.ID + "'>&nbsp;</span>";
                return __data;
              }
            },
            {
              data: null,
              render: function(data) {
                var href =
                  "ms-word:ofe|u|" +
                  _spPageContextInfo.webAbsoluteUrl +
                  "/Job_Description_Files/" +
                  data.FileLeafRef;

                var __data =
                  "<a href='" +
                  href +
                  "'> <img src='https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/icons/microsoft-word.png' style='width:20px;margin-right:5px'/>" +
                  data.Title +
                  "</a>";
                return __data;
              }
            },
            {
              data: "Job_Code"
            },
            {
              data: "Job_Grade"
            },
            {
              data: "Job_Family_Group"
            },
            {
              data: "Job_Family"
            },
            {
              data: "Career_Path"
            },
            {
              data: "Country"
            },
            {
              data: "Assigned_Managers"
            }
          ],
          columnDefs: [
            {
              width: "10px",
              visible: false,
              targets: 0
            },
            {
              width: "20%",
              targets: 1
            },
            {
              width: "8%",
              targets: 2
            },
            {
              width: "2%",
              targets: 3
            },
            {
              width: "18%",
              targets: 4
            },
            {
              width: "15%",
              targets: 5
            },
            {
              width: "15%",
              targets: 6
            },
            {
              width: "15%",
              targets: 7
            },
            {
              width: "5%",
              targets: 8
            }
          ],
          aaSorting: []
        }); //datatable end

        $("#filter-clear").prop("disabled", false);
        $("#filter-datatable").prop("disabled", false);
      }
    });
  };

  return app;
})();

var FilterDatatable = (function($, rest, _underscore, camlQ) {
  var APP = {};

  APP.defaults = {
    queryTopLimit: 10000
  };

  function load($element, query, listname, columns, placeholder) {
    destroySelect2Instance($element);

    $element.empty();

    return rest.get(listname, query).done(function(x) {
      var arr = [];
      //split column name if expanded column

      columns = columns.split("/").length > 1 ? columns.split("/") : columns;

      $(x.d.results).each(function() {
        //check if col === array
        var itemInArr = Array.isArray(columns)
          ? this[columns[0]][columns[1]]
          : this[columns];

        if (itemInArr !== null) {
          arr.push("<option>" + itemInArr + "</option>");
        }
      }); //end of loop

      //get unique items
      arr = _underscore.uniq(arr);

      $element.empty().append(arr.join(""));

      $element.select2({
        placeholder: placeholder,
        allowClear: true
      });
    }); //rest call end
  }

  var loadComplex = function() {
    $("#select_filter-assignedby").empty();
    $("#select_filter-assignedto").empty();
    destroySelect2Instance($("#select_filter-assignedby"));
    destroySelect2Instance($("#select_filter-assignedto"));

    var query =
      "$select=*,AssignedBy/Title&$expand=AssignedBy&$orderby=AssignedById asc&$top=5000";

    var p = [];

    p.push(
      rest.get("File_Assignments", query).done(function(x) {
        var assignedBy_names = [];
        var select2Data = [];
        var job_codes = [];
        $(x.d.results).each(function() {
          var node = this;
          var assignedby = this.AssignedBy.Title;
          var assignedby_id = this.AssignedById;
          var job_code = this.Job_Code;
          var obj = {};

          var _index = assignedBy_names.indexOf(assignedby);

          if (!(_index > -1)) {
            //$("#select_filter-assignedby").append("<option data-assignedby_id='"+ assignedby_id +"'>"+ assignedby +"</option>");

            obj.id = assignedby_id;
            obj.text = assignedby;
            obj.job_codes = [];
            obj.job_codes.push(job_code);

            select2Data.push(obj);

            assignedBy_names.push(assignedby);
          } else {
            //console.log("TTTTTTTTTTT => " + select2Data[_index].job_codes.indexOf(job_code) > -1);

            if (!(select2Data[_index].job_codes.indexOf(job_code) > -1)) {
              select2Data[_index].job_codes.push(job_code);
            }
          }
        });

        $("#select_filter-assignedby").select2({
          placeholder: "by Assigned By",
          data: select2Data
        });
      })
    );

    var query =
      "$select=*,AssignedManager/Title&$expand=AssignedManager&$orderby=AssignedManagerId asc&$top=5000";

    p.push(
      rest.get("File_Assignments", query).done(function(x) {
        var assignedTo_names = [];

        var select2Data = [];
        var job_codes = [];

        $(x.d.results).each(function() {
          var node = this;
          var assignedto = this.AssignedManager.Title;
          var assignedto_id = this.AssignedManagerId;
          var job_code = this.Job_Code;

          //create a new obj
          var obj = {};
          //just getting the index
          var _index = assignedTo_names.indexOf(assignedto);
          if (!(_index > -1)) {
            obj.id = assignedto_id;
            obj.text = assignedto;
            obj.job_codes = [];
            obj.job_codes.push(job_code);

            select2Data.push(obj);

            assignedTo_names.push(assignedto);
          } else {
            if (!(select2Data[_index].job_codes.indexOf(job_code) > -1)) {
              select2Data[_index].job_codes.push(job_code);
            }
          }
        }); //each function

        $("#select_filter-assignedto").select2({
          placeholder: "by Assigned Manager",
          data: select2Data
        });
      })
    );

    var query =
      "$select=*,Author/Title&$expand=Author&$orderby=Author/Title asc&$top=5000&$filter=Entry_Type eq '1'";

    p.push(
      rest.get("Job_Description_Files", query).done(function(x) {
        var authorsId = [];

        var select2Data = [];

        $(x.d.results).each(function() {
          var node = this;

          var authorId = this.AuthorId;
          var authorTitle = this.Author.Title;
          //create a new obj
          var obj = {};

          //just getting the index
          var _index = authorsId.indexOf(authorId);

          if (!(_index > -1)) {
            obj.id = authorId;
            obj.text = authorTitle;

            select2Data.push(obj);

            authorsId.push(authorId);
          }
        }); //each function

        $("#select_filter-uploadedby").select2({
          placeholder: "by Uploaded By",
          data: select2Data
        });
      })
    );

    return p;
  };

  APP.load = load;
  //initialize all onLoad functions

  APP.init = function() {
    var filterDtCalls = [];

    $("#select_filter-country").s2WithLoad({
      queryFilter: "$select=Country&$top=5000&$filter=Entry_Type eq '1'",
      listname: "Job_Description_Files",
      columns: "Country",
      placeholder: "by Country",
      promiseArray: filterDtCalls
    });

    $("#select_filter-grade").s2WithLoad({
      queryFilter: "$select=Job_Grade&$top=5000&$filter=Entry_Type eq '1'",
      listname: "Job_Description_Files",
      columns: "Job_Grade",
      placeholder: "by Grade",
      promiseArray: filterDtCalls
    });

    $("#select_filter-job_family_group").s2WithLoad({
      queryFilter:
        "$select=Job_Family_Group&$top=5000&$filter=Entry_Type eq '1'",
      listname: "Job_Description_Files",
      columns: "Job_Family_Group",
      placeholder: "by Job Family Group",
      promiseArray: filterDtCalls
    });

    $("#select_filter-job_family").s2WithLoad({
      queryFilter: "$select=Job_Family&$top=5000&$filter=Entry_Type eq '1'",
      listname: "Job_Description_Files",
      columns: "Job_Family",
      placeholder: "by Job Family",
      promiseArray: filterDtCalls
    });

    /*$("#select_filter-uploadedby").s2WithLoad({
            queryFilter: "$select=Author/Title&$expand=Author&$top=5000&$filter=Entry_Type eq '1'",
            listname: "Job_Description_Files",
            columns: "Author/Title",
            placeholder: "by Uploaded By",
            promiseArray: filterDtCalls
        });*/

    $("#select_filter-career_family").s2WithLoad({
      queryFilter: "$select=Career_Path&$top=5000&$filter=Entry_Type eq '1'",
      listname: "Job_Description_Files",
      columns: "Career_Path",
      placeholder: "by Career Family",
      promiseArray: filterDtCalls
    });

    destroySelect2Instance($("#select_filter-filetype"));
    destroySelect2Instance($("#select_filter-finalversion"));
    destroySelect2Instance($("#select_filter-exemption"));
    destroySelect2Instance($("#select_filter-career_family"));

    $("#select_filter-filetype").select2({
      placeholder: "by File Type",
      allowClear: true
    });

    $("#select_filter-finalversion").select2({
      placeholder: "by Final Version",
      allowClear: true
    });

    $("#select_filter-exemption").select2({
      placeholder: "by Exemption",
      allowClear: true
    });

    var p = loadComplex();

    filterDtCalls = filterDtCalls.concat(p);

    console.log(filterDtCalls);

    $("#date_filter-uploaddate_from").datepicker({
      dateFormat: "MM dd, yy"
    });

    $("#date_filter-uploaddate_to").datepicker({
      dateFormat: "MM dd, yy"
    });

    $("#duedate-assign").datepicker({
      dateFormat: "MM dd, yy",
      minDate: 0
    });

    $("#duedate-assign").val(
      moment()
        .add(14, "days")
        .format("LL")
    ); //set default duedate

    APP.bindEvents();

    $("#filter-jd-box")
      .parent()
      .preLoad(filterDtCalls);

    return $.when.apply($, filterDtCalls).then(function() {
      console.log("Filter Datatables Select2 options appending completed");
    });
  };

  function getValuesFromSelect2(data, property) {
    var tempArr = [];
    for (var k = 0; k < data.length; k++) {
      tempArr.push(data[k][property]);
    }

    return [].concat.apply([], tempArr); //mereged all arrays
  }

  APP.bindEvents = function() {
    //declare table
    DatatableCustomSearchable.table = $("#jd-datatable").DataTable();

    $("#date_filter-uploaddate_from").bind(
      "propertychange change click keyup input paste",
      function(event) {
        var fromDate = $(this).val();

        if (fromDate == "") {
          fromDate = moment().format("MMMM Do YYYY");
        }

        var toDate = moment().format("MMMM Do YYYY");

        if ($("#date_filter-uploaddate_to").val() != "") {
          toDate = $("#date_filter-uploaddate_to").val();
        }

        $("#select_filter-monthdayyear").text(fromDate + " - " + toDate);
      }
    );

    $("#date_filter-uploaddate_to").bind(
      "propertychange change click keyup input paste",
      function(event) {
        var toDate = $(this).val();

        if (toDate == "") {
          toDate = moment().format("MMMM Do YYYY");
        }
        var fromDate = moment().format("MMMM Do YYYY");

        if ($("#date_filter-uploaddate_from").val() != "") {
          fromDate = $("#date_filter-uploaddate_from").val();
        }

        $("#select_filter-monthdayyear").text(fromDate + " - " + toDate);
      }
    );

    $("body").on("click", "#filter-clear", function() {
      event.preventDefault
        ? event.preventDefault()
        : (event.returnValue = false);

      //$("#select_filter-job_family").prop("disabled",true);
      $("#text_filter-grade").val("");

      $("#filter-jd-box select")
        .val("")
        .trigger("change");
      $("#filter-jd-box input").val("");

      $("button#select_filter-monthdayyear").text("Filter by Date");

      //$("#jd-datatable tbody").html("<tr><td  align='center' colspan='10'>"+
      //"<img src='https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/preloaders/preloader_spinner.gif' data-themekey='#' style='text-align: center;'></td></tr>");

      DatatableCustomSearchable.search({});
    });

    $("body").on("click", "#filter-datatable", function() {
      event.preventDefault
        ? event.preventDefault()
        : (event.returnValue = false);

      //disable buttons

      //$("#filter-clear").prop("disabled", true);
      //$("#filter-datatable").prop("disabled", true);

      //utility function

      //create search object
      var searchObject = {};

      searchObject.Country = $("#select_filter-country").val();
      searchObject.Job_Grade = $("#select_filter-grade").val();
      searchObject.Job_Family_Group = $(
        "#select_filter-job_family_group"
      ).val();
      searchObject.Job_Family = $("#select_filter-job_family").val();
      searchObject.Final_Version =
        $("#select_filter-finalversion").val() === null
          ? []
          : [$("#select_filter-finalversion").val()];
      searchObject.File_Type =
        $("#select_filter-filetype").val() === null
          ? []
          : [$("#select_filter-filetype").val()];
      searchObject.Exemption_Status =
        $("#select_filter-exemption").val() === null
          ? []
          : [$("#select_filter-exemption").val()];
      searchObject.Career_Path = $("#select_filter-career_family").val();
      searchObject.AuthorId = getValuesFromSelect2(
        $("#select_filter-uploadedby").select2("data"),
        "id"
      );
      searchObject.Job_Code1 = getValuesFromSelect2(
        $("#select_filter-assignedby").select2("data"),
        "job_codes"
      );
      searchObject.Job_Code2 = getValuesFromSelect2(
        $("#select_filter-assignedto").select2("data"),
        "job_codes"
      );

      DatatableCustomSearchable.search(searchObject);

      //below are legacy ways used to filter
      return;

      $("#filter-jd-box select").each(function() {
        if ($(this).val() != "") {
          $(this)
            .parent()
            .find("span.select2-selection.select2-selection--multiple")
            .css("border", "2px solid #4cae4c");
        }
      });

      $("#jd-datatable tbody").html(
        "<tr><td  align='center' colspan='10'>" +
          "<img src='https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/preloaders/preloader_spinner.gif' data-themekey='#' style='text-align: center;'></td></tr>"
      );
      $(".preloader_ajax").remove();

      var preloader_ajax =
        "" +
        "<div class='preloader_ajax' style='text-align:center'>" +
        "<p style=' color: #34a3da; background: #fbfeff; border: 1px solid #b6e8ff; padding: 10px; border-radius: 3px; '>Select a row in the Job File Table</p>" +
        "</div>";

      $(".jd-assignedmanager-tabs").prepend(preloader_ajax);
      $("#assignedmanager-list").html("");
      $("#assignedmanager-list-history").html("");

      var entry_type = camlQ.buildCAMLIn("Entry_Type", "1", "Number");
      var country = camlQ.buildCAMLIn(
        "Country",
        $("#select_filter-country").val(),
        "Text"
      );
      var grade = camlQ.buildCAMLIn(
        "Job_Grade",
        $("#select_filter-grade").val(),
        "Text"
      );
      var job_family_group = camlQ.buildCAMLIn(
        "Job_Family_Group",
        $("#select_filter-job_family_group").val(),
        "Text"
      );
      var job_family = camlQ.buildCAMLIn(
        "Job_Family",
        $("#select_filter-job_family").val(),
        "Text"
      );
      var final_version = camlQ.buildCAMLIn(
        "Final_Version",
        $("#select_filter-finalversion").val(),
        "Text"
      );
      var file_type = camlQ.buildCAMLIn(
        "File_Type",
        $("#select_filter-filetype").val(),
        "Text"
      );
      var exemption = camlQ.buildCAMLIn(
        "Exemption_Status",
        $("#select_filter-exemption").val(),
        "Text"
      );
      var career = camlQ.buildCAMLIn(
        "Career_Path",
        $("#select_filter-career_family").val(),
        "Text"
      );
      var uploaded_by = camlQ.buildCAMLIn(
        "Author",
        $("#select_filter-uploadedby").select2("data"),
        "Lookup",
        "id"
      );
      var assigned_to = camlQ.buildCAMLIn(
        "Job_Code",
        $("#select_filter-assignedto").select2("data"),
        "Text",
        "job_codes"
      );
      var assigned_by = camlQ.buildCAMLIn(
        "Job_Code",
        $("#select_filter-assignedby").select2("data"),
        "Text",
        "job_codes"
      );

      var camlBody = camlQ.buildCAMLOperator([
        entry_type,
        country,
        grade,
        job_family_group,
        job_family,
        final_version,
        file_type,
        exemption,
        career,
        uploaded_by,
        assigned_to,
        assigned_by
      ]);

      camlQ.test("Job_Description_Files", camlBody);
    });
  }; //bind Events

  function destroySelect2Instance(el) {
    if (el.hasClass("select2-hidden-accessible")) {
      el.select2("destroy");
    }

    el.val("");
  }

  APP.loadComplex = loadComplex;

  return APP;
})(jQuery, AjaxSetup, _, CAMLQuery);

const DatatableCustomSearchable = (function() {
  var app = {};

  function getValuesFromSelect2(data, property) {
    var tempArr = [];
    for (var k = 0; k < data.length; k++) {
      tempArr.push(data[k][property]);
    }

    return [].concat.apply([], tempArr); //mereged all arrays
  }

  function getIDs(arrayObject) {
    var keys = Object.keys(arrayObject);

    var results = [];

    var filteredData = [];

    //loop of all the keys
    for (var k = 0; k < keys.length; k++) {
      //assign the data to be used from datatable
      var __tableData = k === 0 ? app.table.data() : filteredData;

      var currentKey = keys[k]; // current key
      console.log(currentKey);
      filteredData = [];

      //loop for all the current key array  [1,2,4,5]
      for (var i = 0; i < arrayObject[currentKey].length; i++) {
        //
        var temp = __tableData.filter(function(obj) {
          //example checking obj['Job_Code'] == arrayObject['Job_Code'][0]
          return (
            obj[currentKey.replace(/[0-9]/g, "")] == arrayObject[currentKey][i]
          );
        });

        filteredData = $.merge(filteredData, temp);
      }

      if (k === keys.length - 1) {
        filteredData.map(function(obj) {
          results.push(obj["ID"]);
        });
      }
    }

    return results;
  }

  function search(arrayFilters) {
    //if filterBC does not exists
    !$(".filterBreadcrumb").length &&
      $("#jd-datatable_filter").append(
        '<div class="filterBreadcrumb"><span class="title"></span><span class="texts"></span></div>'
      );
    //1
    !Object.keys(arrayFilters).length && $(".filterBreadcrumb").remove();

    var c = $(".filterBreadcrumb span.texts");

    c.html("");

    //for loop to remove all empty properties
    for (var propertyName in arrayFilters) {
      //if the object property is empty then remove it
      if (!arrayFilters[propertyName].length) {
        delete arrayFilters[propertyName];
      } else {
        //codes to show filter html
        var propLabel, arrayLabel;

        if (propertyName == "Job_Code1") {
          arrayLabel = getValuesFromSelect2(
            $("#select_filter-assignedby").select2("data"),
            "text"
          );
          propLabel = "Assigned To";
        } else if (propertyName == "Job_Code2") {
          arrayLabel = getValuesFromSelect2(
            $("#select_filter-assignedto").select2("data"),
            "text"
          );
          propLabel = "Assigned By";
        } else {
          propLabel = propertyName;
          arrayLabel = arrayFilters[propertyName];
        }

        c.html(
          c.html() +
            "<span><b>" +
            propLabel.replace(/[0-9]/g, "") +
            "</b> : `" +
            arrayLabel.join("` or `") +
            "`</span>"
        );
      }
    }

    if (Object.keys(arrayFilters).length === 0) {
      c.html("No Filter selected ! ");

      $.fn.dataTable.ext.search = [];
      app.table.draw();
      return;
    }

    var arrayOfId = getIDs(arrayFilters);

    //clear the plugin again so that it won't mess the future searches
    $.fn.dataTable.ext.search = [];

    //adding plugin in datatable search
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
      var isFound = false;

      for (var i = 0; i < arrayOfId.length; i++) {
        //data[0] is the ID
        if (data[0] == arrayOfId[i] || arrayOfId[i] == "") {
          isFound = true;
        }
      }
      return isFound;
    });

    //searching the table
    app.table.draw();
  }

  app.search = search;

  //set the table
  app.table = "";

  return app;
})();

/*
var searchObj = {
    Job_Grade: ['17'],
    Job_Code: ['1234567', '028499']
}

 function getIDs(arrayObject){
        
        console.log(arrayObject);

        var keys = Object.keys(arrayObject);

        var results = [];
    
        var filteredData;

        //loop of all the keys
        for( var k = 0; k < keys.length ; k++){
            
            var __tableData = (k === 0) ? table.data() : filteredData;
            console.log(__tableData);
            var currentKey = keys[k]; // current key
            
            for( var i = 0; i < arrayObject[currentKey].length; i++){

                 filteredData = __tableData.filter(function(obj){

                   return obj[currentKey] == arrayObject[currentKey][i];

                });

                filteredData.map(function(obj){

                   results.push(obj['ID']);

                }); 
            }
        }

        return results;
}

*/

//DatatableCustomSearchable.search(['028520'],'Job_Code');

/*
var entry_type = CAMLQuery.buildCAMLIn("Entry_Type", "1", "Number");
var country = CAMLQuery.buildCAMLIn("Country", $("#select_filter-country").val(), "Text");
var grade = CAMLQuery.buildCAMLIn("Job_Grade", $("#select_filter-grade").val(), "Text");
var job_family_group = CAMLQuery.buildCAMLIn("Job_Family_Group", $("#select_filter-job_family_group").val(), "Text");
var job_family = CAMLQuery.buildCAMLIn("Job_Family", $("#select_filter-job_family").val(), "Text");
var final_version = CAMLQuery.buildCAMLIn("Final_Version", $("#select_filter-finalversion").val(), "Text");
var file_type = CAMLQuery.buildCAMLIn("File_Type", $("#select_filter-filetype").val(), "Text");
var exemption = CAMLQuery.buildCAMLIn("Exemption_Status", $("#select_filter-exemption").val(), "Text");
var career = CAMLQuery.buildCAMLIn("Career_Path", $("#select_filter-career_family").val(), "Text");

var camlBody = CAMLQuery.buildCAMLOperator([entry_type,country, grade, job_family_group, job_family, final_version, file_type, exemption, career]);

CAMLQuery.test("Job_Description_Files", camlBody);

*/
/*
Use Case 
var grade = BuildCamlQuery.create($("#select_filter-grade").val(), "Job_Grade");
var country = BuildCamlQuery.create($("#select_filter-country").val(), "Country");

var tempAr = [grade, country];

var z = BuildCamlQuery.BuildCamlAll(tempAr, "And");

var caml = BuildCamlQuery.wrapCaml(z);
BuildCamlQuery.testCAML("Job_Description_Files", caml);*/
