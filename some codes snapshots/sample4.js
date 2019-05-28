/*****
  
  SET UP module of notify email 
  Setting up the content of HTML EMAIL
  
*****/
var NotifyManagerEmailMessage = (function($zAjax) {
  var getMessage = function() {
    var listname = "Send_Reminder_Email_Settings";
    var query = "$select=*&$top=1";

    var ajaxSettings = $zAjax.get(listname, query);

    $.ajax(ajaxSettings).done(function(data) {
      //success function

      // console.log(data);

      if (data.d.results.length < 1) return;

      var node = data.d.results[0];

      //console.log(node.EmailContents);
      $("#htmlemail-message-notifyManager").html(node.EmailContent);
    });
  };

  var init = function() {
    getMessage();
  };

  return {
    init: init
  };
})(AjaxSetup); //NotifyManagerEmailMessage

/*
  @@@@@@@@@@@@@END OF A MODULE
*/

/*****
  
 Main Module of Manager Deadlines
  
*****/

//Manager Deadlines Start
var ManagerDeadlines = (function(NME) {
  /*
      CREATION of consctructor / objects
    */

  //constructor
  function admin(name, submissionsCount, image, id) {
    this.name = name;
    this.submissionsCount = submissionsCount;
    this.image = image;
    this.id = id;
  }
  //constructor
  function manager(
    name,
    jobcode,
    jobtitle,
    jobgrade,
    date,
    id,
    image,
    department,
    email,
    pastDueEntry,
    activeTag,
    assignedByEmail,
    managerDeadlineEmailStatus,
    managerId
  ) {
    this.name = name;
    this.jobcode = jobcode;
    this.jobtitle = jobtitle;
    this.jobgrade = jobgrade;
    this.date = date;
    this.id = id;
    this.image = image;
    this.email = email;
    this.pastDueEntry = pastDueEntry;
    this.department = department;
    this.activeTag = activeTag;
    this.assignedByEmail = assignedByEmail;
    this.managerDeadlineEmailStatus = managerDeadlineEmailStatus;
    this.managerId = managerId;
  }

  //an admin constructor prototype
  admin.prototype.BoxExists = function() {
    if ($("#managerDeadlines-notifBox").find("#" + this.id).length !== 0) {
      return true;
    } else {
      return false;
    }
  };

  manager.prototype.BoxExists = function() {
    if (
      $("#managerDeadlines-notifBox").find("#" + this.managerId).length !== 0
    ) {
      return true;
    } else {
      return false;
    }
  };

  //generating the URL of ajaxrequest
  var getManagerDeadlinesURL = function() {
    //how many days should we check to tag it as approaching
    var approachingDays = 5; //1 week

    var todayPlusApproachingDays =
      moment()
        .add(approachingDays, "days")
        .format("YYYY-MM-DD") + "T00:00:00.000";

    todayPlusApproachingDays = moment(todayPlusApproachingDays).toISOString();

    var select_query =
      "$select=*,AssignedBy/Title,AssignedBy/Name,AssignedBy/EMail,AssignedManager/EMail,AssignedManager/Title,AssignedManager/Name,AssignedManager/Department,JDF_ID/Job_Code,JDF_ID/Title,JDF_ID/Job_Grade";
    var expand_query = "$expand=AssignedBy,AssignedManager,JDF_ID";
    var order_query = "$orderby=Submission_Date asc";
    var top_query = "$top=5000";

    var filter_query = addFilterDependsOnAccessType.getQuery();

    filter_query =
      "$filter=" +
      filter_query +
      "(Status eq 'Unopened' or Status eq 'Working') and Submission_Date le '" +
      todayPlusApproachingDays +
      "'&" +
      order_query +
      "&" +
      top_query;

    var url =
      "/_api/Web/Lists/GetByTitle('File_Assignments')/items?" +
      select_query +
      "&" +
      expand_query +
      "&" +
      filter_query;

    return url;
  };

  //just getting the user Sharepoint Photo and returning as an image source
  var getSharepointUserPhoto = function(mfcgd) {
    var photoSrc = mfcgd.substring(18);

    photoSrc = photoSrc.slice(0, -10);

    photoSrc =
      "https://mfc.sharepoint.com/_layouts/15/userphoto.aspx?size=L&username=" +
      photoSrc;

    return photoSrc;
  };

  //AJAX SETTINGS
  var ajaxSettings = {
    type: "GET",
    headers: {
      accept: "application/json;odata=verbose"
    }
  };

  //initialization
  showManagerDeadlines = function(checkForNewUpdate) {
    ajaxSettings.url =
      _spPageContextInfo.webAbsoluteUrl + getManagerDeadlinesURL();

    ajaxSettings.success = function(data) {
      ajaxSuccess(data, checkForNewUpdate);
    };

    ajaxSettings.error = function(error) {
      console.log(error);
    };

    //console.log(ajaxSettings);

    return $.ajax(ajaxSettings);
  };

  //on AJAX SUCCESS
  ajaxSuccess = function(data, checkForNewUpdate) {
    //dom Manipulation

    if (checkForNewUpdate && checkForNewUpdate !== undefined) {
      //console.log("Polling for ManagerDeadlines notification (1 second interval)");
      //just checking for updates , delete or addition to manager deadline
      var oldcount = _spPageContextInfo.__ManagerDeadlineCount;

      _spPageContextInfo.__ManagerDeadlineCount = data.d.results.length;

      //console.log("Update Check : OLD MD Count : " + oldcount + " NEW MD Count" + _spPageContextInfo.__ManagerDeadlineCount);

      var newcount = _spPageContextInfo.__ManagerDeadlineCount;

      if (oldcount !== newcount) {
        ManagerDeadlines.showManagerDeadlines(false);
      }

      return;
    }

    $(".manager-deadlines-box label#past").text("0 Past");
    $(".manager-deadlines-box label#approaching").text("0 Approaching");

    //$(".manager-deadlines-box .notifBox").html(""); //clearing the box

    if (data.d.results.length == 0) {
      $(".manager-deadlines-box label#past").text("0 Past");
      $(".manager-deadlines-box label#approaching").text("0 Approaching");
    }

    var activeTag = "active-" + md5(new Date());

    $(data.d.results).each(function() {
      //  console.log("JDF" + this.JDF_ID.Job_Code);
      var mfcgdid = this.AssignedBy.Name;

      var admin_image = getSharepointUserPhoto(mfcgdid);
      var manager_image = getSharepointUserPhoto(this.AssignedManager.Name);

      var anAdmin = new admin(
        this.AssignedBy.Title,
        1,
        admin_image,
        "box_" + this.AssignedById
      );

      //check if submission date is approaching or past due
      var today = moment()
        .startOf("day")
        .toISOString();

      var submission_date = moment(this.Submission_Date)
        .startOf("day")
        .toISOString();

      var assignedByEmail = this.AssignedBy.EMail;

      var daysDiff = moment(submission_date).diff(today, "days");

      var pastDueEntry = false;

      if (daysDiff < 0) pastDueEntry = true;

      var aManager = new manager(
        this.AssignedManager.Title,
        this.JDF_ID.Job_Code,
        this.JDF_ID.Title,
        this.JDF_ID.Job_Grade,
        moment(this.Submission_Date).format("MMMM D, YYYY"),
        "item_" + this.Id,
        manager_image,
        this.AssignedManager.Department,
        this.AssignedManager.EMail,
        pastDueEntry,
        activeTag,
        assignedByEmail,
        this.managerDeadlineEmailStatus,
        "manager_" + this.AssignedManagerId
      );

      //console.log(anAdmin);
      //console.log(aManager);

      generateNotifBoxItem(anAdmin, aManager);
    });

    $("#managerDeadlines-notifBox ul.itemList > li").each(function() {
      var itemActiveTag = $(this).attr("data-activeTag");

      return;

      if (itemActiveTag !== activeTag) {
        $(this).fadeOut(2000, function() {
          $(this).remove();

          $("#managerDeadlines-notifBox > .notifBox-item").each(function() {
            countItems($(this).attr("id"));
          });
        });
      }
    });
  }; //ajax success

  function updateManagerDeadlineEmailStatus(fileAssignmentID, status) {
    var data = {
      __metadata: {
        type: "SP.Data.File_x005f_AssignmentsListItem"
      },
      managerDeadlineEmailStatus: status
    };

    var ajaxSuccess = function() {
      console.log(
        "managerDeadlineEmailStatus for " + fileAssignmentID + "status updated"
      );

      //change styling
    };

    var ajaxSettings = {
      url:
        _spPageContextInfo.webAbsoluteUrl +
        "/_api/Web/Lists/GetByTitle('File_Assignments')/getItemById('" +
        fileAssignmentID +
        "')",
      type: "PATCH",
      headers: {
        accept: "application/json;odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        "content-Type": "application/json;odata=verbose",
        "X-Http-Method": "PATCH",
        "If-Match": "*"
      },
      data: JSON.stringify(data),
      success: ajaxSuccess()
    };

    return $.ajax(ajaxSettings);
  }

  function countItems(elementId) {
    var itemCount = parseInt($("#" + elementId + " ul.itemList li").length);

    if (itemCount == 0)
      $("#" + elementId).fadeOut(2000, function() {
        $(this).remove();
      });

    $("#" + elementId + " span.notifCount").text(itemCount + " new item(s)");
  }

  //generating the DOm to be added on the page
  generateNotifBoxItem = function(admin, manager) {
    var managerKeys = {
      fileAssignmentId: manager.id.replace(/^\D+/g, ""),
      listItemId: manager.id,
      jobcode: manager.jobcode,
      date: manager.date,
      jobtitle: manager.jobtitle,
      jobgrade: manager.jobgrade,
      imageSrc: manager.image,
      name: fixedEncodeURIComponent(manager.name),
      department: manager.department,
      email: fixedEncodeURIComponent(manager.email),
      activeTag: manager.activeTag,
      assignedByEmail: fixedEncodeURIComponent(manager.assignedByEmail)
    };

    var addClassToPastDueEntries = "";

    if (manager.pastDueEntry) addClassToPastDueEntries = "past";

    btnNotifyHTML = "<i class='fa fa-bell btn-notifyManager'>";

    if (manager.managerDeadlineEmailStatus !== null) {
      var managerDeadlineEmailStatus_JSON = JSON.parse(
        manager.managerDeadlineEmailStatus
      );
      btnNotifyHTML =
        managerDeadlineEmailStatus_JSON.state.toUpperCase() === "SENT"
          ? "<span class='notifSent btn-notifyManager'>Sent (" +
            moment(managerDeadlineEmailStatus_JSON.date).format("MMM Do YY") +
            ")</span>"
          : "<i class='fa fa-bell btn-notifyManager'>";
    }

    var managerItems =
      "<li id='" +
      manager.id +
      "' class='item " +
      addClassToPastDueEntries +
      "' data-activeTag='" +
      manager.activeTag +
      "'>" +
      "<div class='buttons' data-itemID='" +
      manager.id.replace(/\D/g, "") +
      "' data-managerKey='" +
      JSON.stringify(managerKeys) +
      "'>" +
      btnNotifyHTML +
      "</i> <i class='fa fa-check-square btnMarkAsRead' style='display:none'></i>" +
      "</i> <i class='fa fa-times btnRemove' style='display:none'></i>" +
      "</div>" +
      "<a href='#' style='float:left'>" +
      "<span class='userName'>" +
      "</span>" +
      "<span class='number'>" +
      manager.jobcode +
      "</span>" +
      "<span class='date'> (" +
      manager.date +
      ")</span></a>" +
      "<div class='clearfix'></div>" +
      "</li>";

    var managerBox =
      '<li id="' +
      manager.managerId +
      '" class="v2">\
                        <div class="itemListHead"><span>' +
      manager.name +
      '</span>\
                            <div class="itemListHead-subinfo">\
                              <span class="readCount"></span>\
                              <span class="approaching"></span>\
                              <span class="totalCount"></span>\
                            </div>\
                            <i class="fa fa-eye btn-viewer"></i>\
                        </div>\
                        <ul class="subItemList">\
                        ' +
      managerItems +
      "\
                        </ul>\
                      </li>";

    var itemHTML =
      "<div id='" +
      admin.id +
      "' class='notifBox-item'>" +
      "<div class='notifBox-itemHead'>" +
      "<div class='notifBox-itemHead-adminProfile'>" +
      "<img src='" +
      admin.image +
      "' data-themekey='#'>" +
      "<div class='texts'>" +
      "<span class='userName'>" +
      admin.name +
      "</span>" +
      "<span class='notifCount'>" +
      admin.submissionsCount +
      " new item</span>" +
      "</div>" +
      " <i class='dropdownButton pull-right fa fa-chevron-down'></i>" +
      "</div>" +
      "</div>" +
      "<div class='notifBox-itemBody'>" +
      "<ul class='itemList'>" +
      managerBox +
      "</ul>" +
      "</div>" +
      "</div>";

    if (manager.pastDueEntry) {
      var totalPastDue =
        parseInt(
          $(".manager-deadlines-box label#past")
            .text()
            .replace(/\D/g, "")
        ) + 1;

      $(".manager-deadlines-box label#past").text(totalPastDue + " Past");
    } else {
      var totalPastDue =
        parseInt(
          $(".manager-deadlines-box label#approaching")
            .text()
            .replace(/\D/g, "")
        ) + 1;
      $(".manager-deadlines-box label#approaching").text(
        totalPastDue + " Approaching"
      );
    }

    //console.log(manager.BoxExists());

    // console.log(manager.managerId);

    //**
    //Step 1: Add Admin Box First
    //Step 2: Add Manager Box First
    //Step 3: Add li item

    if (admin.BoxExists()) {
      if (manager.BoxExists()) {
        if (
          $(
            "#managerDeadlines-notifBox #" +
              admin.id +
              " .notifBox-itemBody > ul.itemList ul.subItemList li#" +
              manager.id
          ).length !== 0
        ) {
          $(
            "#managerDeadlines-notifBox #" +
              admin.id +
              " .notifBox-itemBody > ul.itemList ul.subItemList li#" +
              manager.id
          ).attr("data-activeTag", manager.activeTag);

          return;
        }

        $(
          "#managerDeadlines-notifBox #" +
            admin.id +
            " .notifBox-itemBody > ul.itemList #" +
            manager.managerId +
            " ul.subItemList"
        ).append(managerItems);
      } else {
        $(
          "#managerDeadlines-notifBox #" +
            admin.id +
            " .notifBox-itemBody > ul.itemList"
        ).append(managerBox);
      } //boxexists

      //check if the manager li exists (in case of recall of this module, the li item won't be added again as duplicate

      //var totalSubmissions = parseInt($("#" + admin.id + " .notifCount").text().replace(/\D/g,'')) + 1;

      //$("#managerDeadlines-notifBox #" + admin.id + " .notifCount").text(totalSubmissions + " new items");
    } else {
      //else if admin doesn't exist
      $("#managerDeadlines-notifBox").append(itemHTML);
    }

    showManagerTotals(manager.managerId);
    showAdminTotals(admin.id);
  }; //generate

  function showManagerTotals(el) {
    var el = $("#" + el);

    var total = el.find("ul.subItemList > li").length;

    var approaching = el.find("ul.subItemList > li:not(.past)").length;

    var past = el.find("ul.subItemList > li.past").length;

    el.find(".itemListHead .readCount").html(
      "<span style='color:#FF5722'>Past " + past + "</span>"
    );

    el.find(".itemListHead .approaching").html(
      "<span style='color:#c5c5c5'>|</span> <span style='color:#FF9800'>Approaching " +
        approaching +
        "</span>"
    );

    el.find(".itemListHead .totalCount").html(
      "<span style='color:#c5c5c5'>|</span> <span style='color:#03A9F4'>Total  " +
        total +
        "</span>"
    );
  }

  function showAdminTotals(el) {
    var el = $("#" + el);

    var total = el.find("ul.subItemList > li").length;
    el.find("span.notifCount").text(total + " new item(s)");
  }

  var bindEvents = function(button_element_id) {
    $("body").on(
      "click",
      "#managerDeadlines-notifBox .btn-notifyManager",
      function() {
        $("#notifyManager-modal").iziModal("open");

        getToBCCdPeoples.init("htmlemail-bccd-select-notifyManager");

        var node = $(this)
          .parent()
          .attr("data-managerKey");

        $("#btn-send-notifyManager").attr("data-managerKey", node);

        node = JSON.parse(node);

        $("#notifyManager-modal .managerProfile > img").attr(
          "src",
          node.imageSrc
        );
        $("#notifyManager-modal .managerProfile > .texts > span.name").text(
          fixedDecodeUri(node.name)
        );
        $(
          "#notifyManager-modal .managerProfile > .texts > span.department"
        ).text(node.department);
        $("#notifyManager-modal .managerProfile > .texts > span.email").text(
          fixedDecodeUri(node.email)
        );

        var tr =
          "<tr> " +
          "<td>" +
          node.jobtitle +
          "</td>" +
          "<td>" +
          node.jobgrade +
          "</td>" +
          "<td>" +
          node.jobcode +
          "</td>" +
          "<td>" +
          node.date +
          "</td>" +
          "</tr>";

        $("#notifyManager-modal table.jobInfo tbody")
          .html("")
          .append(tr);
      }
    );

    $("body").on("click", ".btn-viewer", function() {
      var parentLi = $(this)
        .parent()
        .parent();

      var liToggle = parentLi.parent().find("li.v2.active");

      if (liToggle.attr("id") != parentLi.attr("id")) {
        liToggle.find(".subItemList").slideToggle();
        parentLi
          .parent()
          .find("li.v2.active")
          .removeClass("active");
      }

      parentLi.find(".subItemList").slideToggle();

      parentLi.toggleClass("active");

      if (parentLi.parent().find("> li.v2.active").length > 0) {
        parentLi
          .parent()
          .find("> li:not(.active) > div.itemListHead")
          .css("opacity", ".5");
      } else {
        parentLi
          .parent()
          .find("> li:not(.active) > div.itemListHead")
          .css("opacity", "1");
      }

      parentLi
        .parent()
        .find("> li.active > div.itemListHead")
        .css("opacity", "1");
    });

    $("body").on(
      "click",
      "#managerDeadlines-notifBox > .notifBox-item > .notifBox-itemBody .itemList > li.v2",
      function() {
        if (!$(this).hasClass("active")) {
          $(
            "#managerDeadlines-notifBox > .notifBox-item > .notifBox-itemBody .itemList > li.v2.active ul.subItemList"
          ).slideToggle();
          $(
            "#managerDeadlines-notifBox > .notifBox-item > .notifBox-itemBody .itemList > li.v2.active"
          ).removeClass("active");
          $(
            "#managerDeadlines-notifBox > .notifBox-item > .notifBox-itemBody .itemList > li.v2 > div.itemListHead"
          ).css("opacity", "1");
        }
      }
    );

    $("body").on("click", "#btn-send-notifyManager", function() {
      event.preventDefault
        ? event.preventDefault()
        : (event.returnValue = false);

      var node = $(this).attr("data-managerKey");

      node = JSON.parse(node);

      NME.init();

      $("#htmlemail_link_to_manager_dashboard-notifyManager").attr(
        "href",
        _spPageContextInfo.webAbsoluteUrl + "/Pages/managers-dashboard.aspx"
      );

      var managerSplitName = fixedDecodeUri(node.name).substr(
        0,
        fixedDecodeUri(node.name).indexOf(" ")
      );

      $("#htmlemail-manager_name-notifyManager").text(managerSplitName + ", ");

      var fileAssignmentId = node.fileAssignmentId;

      var statusJson = {
        state: "Sent",
        date: moment()
      };

      updateManagerDeadlineEmailStatus(
        fileAssignmentId,
        JSON.stringify(statusJson)
      ).done(function() {
        //update the notification icon to sent html

        $("#" + node.listItemId)
          .find(".btn-notifyManager")
          .replaceWith(
            "<span class='notifSent btn-notifyManager'>Sent (" +
              moment().format("MMM Do YY") +
              ")</span>"
          );
      });

      /* $("#htmlemail-notifyManager-info .title").text(node.jobtitle);
             $("#htmlemail-notifyManager-info .jobgrade").text(node.jobgrade);
             $("#htmlemail-notifyManager-info .duedate").text(node.date);*/

      var ccd = $("#htmlemail-bccd-select-notifyManager").select2("data");

      notifyManager_outlookPrompt(
        fixedDecodeUri(node.email),
        ccd,
        fixedDecodeUri(node.assignedByEmail)
      );
    });
  };

  var init = function() {
    // console.log("MD INIT");
    bindEvents();
    return showManagerDeadlines();
  };

  return {
    ajaxSettings: ajaxSettings,
    showManagerDeadlines: showManagerDeadlines,
    init: init,
    getManagerDeadlinesURL: getManagerDeadlinesURL
  };
})(NotifyManagerEmailMessage); ////Manager Deadlines end

/*
  ---------------
  END OF A MODULE
*/

/*****
  
ReplaceJobFile
  
*****/

var ReplaceJobFile = (function() {
  var formatFileType = function(filename) {
    var index = 0;
    var filetype = "";

    if (filename.endsWith(".docx")) {
      index = -5;
      filetype = ".docx";
    } else if (filename.endsWith(".doc")) {
      index = -4;
      filetype = ".doc";
    }

    return {
      index: index,
      filetype: filetype
    };
  };

  var copyFileToArchive = function(filename, file) {
    var file = formatFileType(filename);
    var today_datetime = moment().format("MMMM-Do-YYYY--h-mm-ss-a");
    var newfilename =
      "Archive_File--" +
      today_datetime +
      "_" +
      filename.slice(0, file.index) +
      file.filetype;

    copyToArchiveFolder(
      _spPageContextInfo.webAbsoluteUrl,
      "Job_Description_Files",
      filename,
      _spPageContextInfo.webAbsoluteUrl,
      "Job_Description_Files/archive",
      newfilename,
      $("#__REQUESTDIGEST").val(),
      file
    );
  };

  var replaceFile = function() {
    var file = $("#replaceJobFile")[0].files;

    copyFileToArchive(file[0].name, file[0]);
  };

  return {
    replaceFile: replaceFile
  };
})(); //ReplaceJobFile
