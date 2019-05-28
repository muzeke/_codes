var ManagerSubmissions = (function(addFilterDependsOnAccessType) {
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
    managerSubmissionStatus,
    fileName,
    activeTag
  ) {
    this.name = name;
    this.jobcode = jobcode;
    this.jobtitle = jobtitle;
    this.jobgrade = jobgrade;
    this.date = date;
    this.id = id;
    this.image = image;
    this.email = email;
    this.department = department;
    this.managerSubmissionStatus = managerSubmissionStatus;
    this.fileName = fileName;
    this.activeTag = activeTag;
  }

  admin.prototype.BoxExists = function() {
    if ($(".notifBox").find("#" + this.id).length !== 0) {
      return true;
    } else {
      return false;
    }
  };

  function showTotal(el, outputToEl) {
    var el = $("#managerSubmission-notifBox");
    var totalNew = el.find("ul.itemList > li.newMessage").length;
    var total = el.find("ul.itemList > li").length;

    var template =
      totalNew == 0
        ? "Total Items: " + total
        : totalNew +
          " New ! <span style='color:#f0f0f0;'> out of " +
          total +
          "</span>";

    outputToEl.html(template);
  }

  //generating the URL of ajaxrequest
  var generateURL = function() {
    var select_query =
      "$select=*,AssignedBy/Title,AssignedBy/Name,AssignedManager/EMail,AssignedManager/Title,AssignedManager/Name,AssignedManager/Department,JDF_ID/Job_Code,JDF_ID/Title,JDF_ID/Job_Grade";
    var expand_query = "$expand=AssignedBy,AssignedManager,JDF_ID";
    var order_query = "$orderby=Date_Submitted desc&$top=5000";

    var filter_query = addFilterDependsOnAccessType.getQuery();

    filter_query =
      "$filter=" + filter_query + "Status eq 'Submitted'&" + order_query;

    var url =
      "/_api/Web/Lists/GetByTitle('File_Assignments')/items?" +
      select_query +
      "&" +
      expand_query +
      "&" +
      filter_query;

    return url;
  };

  //code to generate an image URL of a user
  var getSharepointUserPhoto = function(mfcgd) {
    var photoSrc = mfcgd.substring(18);

    photoSrc = photoSrc.slice(0, -10);

    photoSrc =
      "https://mfc.sharepoint.com/_layouts/15/userphoto.aspx?size=L&username=" +
      photoSrc;

    return photoSrc;
  };

  var ajaxSettings = {
    type: "GET",
    headers: {
      accept: "application/json;odata=verbose"
    }
  };

  var checkForNewUpdate = false;

  var showManagerSubmissions = function(checkForNewUpdate) {
    ajaxSettings.url = _spPageContextInfo.webAbsoluteUrl + generateURL();

    ajaxSettings.success = function(data) {
      ajaxSuccess(data, checkForNewUpdate);
    };

    return $.ajax(ajaxSettings);
  };

  function ajaxSuccess(data, checkForNewUpdate) {
    if (checkForNewUpdate && checkForNewUpdate !== undefined) {
      // console.log("Polling for ManagerSubmission notification (1 second interval)");

      var oldcount = _spPageContextInfo.__ManagerSubmissionCount;
      _spPageContextInfo.__ManagerSubmissionCount = data.d.results.length;

      var newcount = _spPageContextInfo.__ManagerSubmissionCount;

      if (oldcount !== newcount) {
        /*$('.smartNotifications').notifyMe({
                    class: 'info', 
                    message: 'New Manager Submission received. <br>' + moment().format("LLL")
                });*/
        ManagerSubmissions.showManagerSubmissions(false);
      }

      return;
    } // if checkforNew update is True

    var activeTag = "active-" + md5(new Date());

    $(data.d.results).each(function() {
      var mfcgdid = this.AssignedBy.Name;

      var admin_image = getSharepointUserPhoto(mfcgdid);

      var manager_image = getSharepointUserPhoto(this.AssignedManager.Name);

      var anAdmin = new admin(
        this.AssignedBy.Title,
        1,
        admin_image,
        "managerSubmission_" + this.AssignedById
      );

      var aManager = new manager(
        this.AssignedManager.Title,
        this.JDF_ID.Job_Code,
        this.JDF_ID.Title,
        this.JDF_ID.Job_Grade,
        moment(this.Date_Submitted).format("MMMM D, YYYY"),
        "supportItem_" + this.Id,
        manager_image,
        this.AssignedManager.Department,
        this.AssignedManager.EMail,
        this.managerSubmission_Status,
        this.New_File_Name,
        activeTag
      );

      generateNotifBoxItem(anAdmin, aManager);
    }); //data d results each function

    showTotal($("#managerSubmission-notifBox"), $("label.msg_count-ms"));

    $("#managerSubmission-notifBox ul.itemList > li").each(function() {
      var itemActiveTag = $(this).attr("data-activeTag");

      if (itemActiveTag !== activeTag) {
        $(this).fadeOut(2000, function() {
          $(this).remove();

          $("#managerSubmission-notifBox > .notifBox-item").each(function() {
            countItems($(this).attr("id"));
          });
        });
      }
    });
  } //ajaxSuccess

  /*  function countItems(elementId){

        var itemCount = parseInt($("#" + elementId + " ul.itemList li.newMessage").length);
        
        __log.cli("Item Count: " + itemCount);

        if(itemCount == 0){
             $("#" + elementId).fadeOut(2000, function(){
              $(this).remove();
             }); 
        } 

        $("label.msg_count-ms").text($("#managerSubmission-notifBox ul.itemList li").length + " New!");

        $("#" + elementId + " span.notifCount").text(itemCount + " new item(s)");

      }*/

  function countItems(elementId) {
    var newItemCount = parseInt(
      $("#" + elementId + " ul.itemList li.newMessage").length
    );

    var allItemCount = parseInt($("#" + elementId + " ul.itemList li").length);

    if (allItemCount == 0)
      $("#" + elementId).fadeOut(2000, function() {
        $(this).remove();
      });

    $("#" + elementId + " span.notifCount").text(
      newItemCount + " new item(s) out of " + allItemCount
    );

    var totalNewMessages = $(
      "#managerSubmission-notifBox ul.itemList li.newMessage"
    ).length;

    showTotal($("#managerSubmission-notifBox"), $("label.msg_count-ms"));
  }

  var generateNotifBoxItem = function(admin, manager) {
    var managerKeys = {
      jobcode: manager.jobcode,
      date: manager.date,
      jobtitle: manager.jobtitle,
      jobgrade: manager.jobgrade,
      imageSrc: manager.image,
      name: manager.name,
      department: manager.department,
      email: manager.email,
      managerSubmissionStatus: manager.managerSubmissionStatus,
      fileName: manager.fileName,
      activeTag: manager.activeTag
    };

    var classToAdd =
      manager.managerSubmissionStatus == "new" ||
      manager.managerSubmissionStatus == null
        ? "newMessage"
        : "markedAsRead";
    var envelope_fa =
      manager.managerSubmissionStatus == "new" ||
      manager.managerSubmissionStatus == null
        ? "envelope"
        : "envelope-open";
    var i_title =
      manager.managerSubmissionStatus == "new" ||
      manager.managerSubmissionStatus == null
        ? "Mark as Read"
        : "Mark as Unread";

    var managerItems =
      "<li id='" +
      manager.id +
      "' class='item " +
      classToAdd +
      "' data-activeTag='" +
      manager.activeTag +
      "'>" +
      "<div style='' class='buttons' data-itemID='" +
      manager.id.replace(/\D/g, "") +
      "' data-managerKey='" +
      JSON.stringify(managerKeys) +
      "'>" +
      "<i class='fa fa-" +
      envelope_fa +
      " btnMarkAsRead' data-parentAdminBoxId='" +
      admin.id +
      "' title='" +
      i_title +
      "'></i> " +
      "<i style='display:none' class='fa fa-times btnRemove' data-parentAdminBoxId='" +
      admin.id +
      "'></i>" +
      "</div>" +
      "<a href='ms-word:ofe|u|" +
      _spPageContextInfo.webAbsoluteUrl +
      "/Job_Description_Files/versions/" +
      manager.fileName +
      "' style='float:left'>" +
      "<span class='userName'>" +
      manager.name +
      "</span>" +
      "<span class='number'>" +
      manager.jobcode +
      "</span>" +
      "<span class='date'> (" +
      manager.date +
      ")</span></a>" +
      "<div class='clearfix'></div>" +
      "</li>";

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
      " new item(s)</span>" +
      "</div>" +
      " <i class='dropdownButton pull-right fa fa-chevron-down'></i>" +
      "</div>" +
      "</div>" +
      "<div class='notifBox-itemBody'>" +
      "<ul class='itemList'>" +
      managerItems +
      "</ul>" +
      "</div>" +
      "</div>";

    if (admin.BoxExists()) {
      //check if LI element exists
      if (
        $(
          "#managerSubmission-notifBox #" +
            admin.id +
            " .notifBox-itemBody > ul.itemList li#" +
            manager.id
        ).length !== 0
      ) {
        $(
          "#managerSubmission-notifBox #" +
            admin.id +
            " .notifBox-itemBody > ul.itemList li#" +
            manager.id
        )
          .removeClass()
          .addClass("item " + classToAdd)
          .attr("data-activeTag", manager.activeTag)
          .find(".btnMarkAsRead")
          .removeClass()
          .addClass("fa fa-" + envelope_fa + " btnMarkAsRead")
          .attr("title", i_title);

        return; //stop propagation
      }

      var totalNewMessage = parseInt(
        $("#" + admin.id + " .notifCount")
          .text()
          .replace(/\D/g, "")
      ); //starts from 1

      totalNewMessage = totalNewMessage + 1;

      $(
        "#managerSubmission-notifBox #" +
          admin.id +
          " .notifBox-itemBody > ul.itemList"
      ).append(managerItems);
    } else {
      $("#managerSubmission-notifBox").append(itemHTML);
    }

    countItems(admin.id);
  }; //generateNotifBox Item

  function updateManagerSubmissionStatus(
    fileAssignmentID,
    status,
    envelope_fa
  ) {
    //console.log("#managerSubmission-notifBox #supportItem_" + fileAssignmentID + " .btnMarkAsRead" + envelope_fa);

    var data = {
      __metadata: {
        type: "SP.Data.File_x005f_AssignmentsListItem"
      },
      managerSubmission_Status: status
    };

    var ajaxSuccess = function() {
      console.log("status updated");
      $(
        "#managerSubmission-notifBox #supportItem_" +
          fileAssignmentID +
          " .btnMarkAsRead"
      )
        .removeClass()
        .addClass("fa fa-" + envelope_fa + " btnMarkAsRead");
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

  function bindButtonEvents() {
    $("body").on(
      "click",
      "#managerSubmission-notifBox .notifBox-item ul.itemList li.item > a",
      function() {
        var keys = $(this)
          .parent()
          .find(".buttons")
          .attr("data-managerkey");
        keys = JSON.parse(keys);

        var file_id = $(this)
          .parent()
          .attr("id")
          .replace(/\D/g, "");
      }
    );

    $("body").on(
      "click",
      "#managerSubmission-notifBox .btnMarkAsRead",
      function() {
        //to disable running 2 consecutive request or clicks by user

        //assign current element
        //this is used to avoid running 2 ajax request at the same time for the button clicked
        var btn_element = $(this);

        //this is what stop the propagation if user tries to click the button consecutive times
        //the user won't be able to do another request unless the first request has been received
        if (btn_element.data("requestRunning")) return;

        console.log("click");

        //set the requestRunning data to true
        btn_element.data("requestRunning", true);

        //get the current parent LI
        var parentLi = $(this)
          .parent()
          .parent();

        var parentBoxId = $(this).attr("data-parentadminboxid");

        var status;

        var envelope_fa;

        //if the parent LI tag has class markAsRead
        //add a class of "newMessage"
        //remove markedAsRead Class

        // __log.cli(parentLi.hasClass('markedAsRead'));

        if (parentLi.hasClass("markedAsRead")) {
          status = "new";

          parentLi.addClass("newMessage");

          parentLi.removeClass("markedAsRead");

          envelope_fa = "envelope";

          countItems(parentBoxId);
        } else {
          status = "markasread";

          parentLi.removeClass("newMessage");

          parentLi.addClass("markedAsRead");

          envelope_fa = "envelope-open";

          countItems(parentBoxId);
        }

        var fileAssignmentID = parentLi.attr("id").replace(/\D/g, "");

        var ajaxCall = updateManagerSubmissionStatus(
          fileAssignmentID,
          status,
          envelope_fa
        );

        $(parentLi).preLoad(ajaxCall);

        ajaxCall.done(function() {
          ManagerSubmissions.showManagerSubmissions();
          btn_element.data("requestRunning", false);
        });
      }
    );
  }

  return {
    generateURL: generateURL,
    showManagerSubmissions: showManagerSubmissions,
    init: function() {
      bindButtonEvents();
    }
  };
})(addFilterDependsOnAccessType); //end of var ManagerSubmissions  module

ManagerSubmissions.init();
