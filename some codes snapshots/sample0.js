var SupportNotificationBox = (function(addFilterDependsOnAccessType) {
  var APP_SETTINGS = {
    parentElementId: $("#supportChat-notifBox")
  };
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
    supportChatStatus,
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
    this.supportChatStatus = supportChatStatus;
    this.activeTag = activeTag;
  }

  //an admin constructor prototype
  admin.prototype.BoxExists = function() {
    if ($(".notifBox").find("#" + this.id).length !== 0) {
      return true;
    } else {
      return false;
    }
  };

  //generating the URL of ajaxrequest
  var generateURL = function() {
    var select_query =
      "$select=*,AssignedBy/Title,AssignedBy/Name,AssignedManager/EMail,AssignedManager/Title,AssignedManager/Name,AssignedManager/Department,JDF_ID/Job_Code,JDF_ID/Title,JDF_ID/Job_Grade";
    var expand_query = "$expand=AssignedBy,AssignedManager,JDF_ID";
    var order_query = "$orderby=Submission_Date asc";

    var filter_query = addFilterDependsOnAccessType.getQuery();

    filter_query =
      "$filter=" +
      filter_query +
      "(supportChat_Status eq 'new' or supportChat_Status eq 'markasread')&" +
      order_query;

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

  var showSupportNotificationBoxes = function(checkForNewUpdate) {
    ajaxSettings.url = _spPageContextInfo.webAbsoluteUrl + generateURL();

    ajaxSettings.success = function(data) {
      ajaxSuccess(data, checkForNewUpdate);
    };

    return $.ajax(ajaxSettings);
  };

  function ajaxSuccess(data, checkForNewUpdate) {
    if (checkForNewUpdate && checkForNewUpdate !== undefined) {
      //check for new message here
      var oldcount = _spPageContextInfo.__SupportNotificationCount;

      var newMessageCount = 0;
      $(data.d.results).each(function() {
        if (this.supportChat_Status == "new") newMessageCount++;
      });

      _spPageContextInfo.__SupportNotificationCount = newMessageCount;

      //console.log("Polling for Support Chat notificatoin (1 second interval)");

      var newcount = _spPageContextInfo.__SupportNotificationCount;

      if (oldcount !== newcount) {
        SupportNotificationBox.showSupportNotificationBoxes(false);
        // console.log("support Box has been updated !");
      }

      return; //stop PROCESSINg HERE
    }

    var totalNumberOfItems = 0;

    //use to remove items that are no longer active
    var activeTag = "active-" + md5(new Date());

    $(data.d.results).each(function() {
      var mfcgdid = this.AssignedBy.Name;

      var admin_image = getSharepointUserPhoto(mfcgdid);

      var manager_image = getSharepointUserPhoto(this.AssignedManager.Name);

      var anAdmin = new admin(
        this.AssignedBy.Title,
        1,
        admin_image,
        "supportChatBox_" + this.AssignedById
      );

      var aManager = new manager(
        this.AssignedManager.Title,
        this.JDF_ID.Job_Code,
        this.JDF_ID.Title,
        this.JDF_ID.Job_Grade,
        moment(this.Submission_Date).format("MMMM D, YYYY"),
        "supportItem_" + this.Id,
        manager_image,
        this.AssignedManager.Department,
        this.AssignedManager.EMail,
        this.supportChat_Status,
        activeTag
      );

      generateNotifBoxItem(anAdmin, aManager);

      if (this.supportChat_Status == "new") totalNumberOfItems++;

      $(".msg_count-onsupport").text(totalNumberOfItems + " New!");
    });

    //removes all inactive items
    $("#supportChat-notifBox ul.itemList > li").each(function() {
      var itemActiveTag = $(this).attr("data-activeTag");

      if (itemActiveTag !== activeTag) {
        $(this).fadeOut(2000, function() {
          $(this).remove();

          $("#supportChat-notifBox > .notifBox-item").each(function() {
            countItems($(this).attr("id"));
          });
        });
      }
    });

    $("#supportChat-notifBox > .notifBox-item").each(function() {
      countItems($(this).attr("id"));
    });
  }

  var generateNotifBoxItem = function(admin, manager) {
    var managerKeys = {
      jobcode: manager.jobcode,
      date: manager.date,
      jobtitle: manager.jobtitle,
      jobgrade: manager.jobgrade,
      imageSrc: manager.image,
      name: fixedEncodeURIComponent(manager.name),
      department: manager.department,
      email: manager.email,
      supportChatStatus: manager.supportChatStatus,
      activeTag: manager.activeTag
    };

    var classToAdd =
      manager.supportChatStatus == "new" ? "newMessage" : "markedAsRead";
    var envelope_fa =
      manager.supportChatStatus == "new" ? "envelope" : "envelope-open";
    var i_title =
      manager.supportChatStatus == "new" ? "Mark as Read" : "Mark as Unread";

    var managerItems =
      "<li id='" +
      manager.id +
      "' class='item " +
      classToAdd +
      "' data-activeTag='" +
      manager.activeTag +
      "'>" +
      "<div class='buttons' data-itemID='" +
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
      "<i class='fa fa-times btnRemove' data-parentAdminBoxId='" +
      admin.id +
      "'></i>" +
      "</div>" +
      "<a href='#' style='float:left'>" +
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

    //if box exists don't add it anymore

    if (admin.BoxExists()) {
      if (
        $(
          "#supportChat-notifBox #" +
            admin.id +
            " .notifBox-itemBody > ul.itemList li#" +
            manager.id
        ).length !== 0
      ) {
        $(
          "#supportChat-notifBox #" +
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

      //console.log(manager.supportChatStatus == "new");

      if (manager.supportChatStatus == "new") {
        totalNewMessage = totalNewMessage + 1;
      }

      $(
        "#supportChat-notifBox #" +
          admin.id +
          " .notifBox-itemBody > ul.itemList"
      ).append(managerItems);

      $("#supportChat-notifBox #" + admin.id + " .notifCount").text(
        totalNewMessage + " new item(s)"
      );
    } else {
      $("#supportChat-notifBox").append(itemHTML);

      if (manager.supportChatStatus == "markasread") {
        $("#supportChat-notifBox #" + admin.id + " .notifCount").text(
          "0 new item(s)"
        );
      }
    }
  };

  function updateSupportChatStatus(fileAssignmentID, status, envelope_fa) {
    $(
      "#supportChat-notifBox #supportItem_" +
        fileAssignmentID +
        " .btnMarkAsRead"
    )
      .removeClass()
      .addClass("fa fa-" + envelope_fa + " btnMarkAsRead");
    var data = {
      __metadata: {
        type: "SP.Data.File_x005f_AssignmentsListItem"
      },
      supportChat_Status: status
    };

    var ajaxSuccess = function() {
      console.log("%c status updated", consoleCSS_success);
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
    var itemCount = parseInt(
      $("#" + elementId + " ul.itemList li.newMessage").length
    );

    var allItemCount = parseInt($("#" + elementId + " ul.itemList li").length);

    if (allItemCount == 0)
      $("#" + elementId).fadeOut(2000, function() {
        $(this).remove();
      });

    $("#" + elementId + " span.notifCount").text(
      itemCount + " new item(s) out of " + allItemCount
    );

    var totalNewMessages = $("#supportChat-notifBox ul.itemList li.newMessage")
      .length;
    $(".msg_count-onsupport").text(totalNewMessages + " New !");
  }

  function bindButtonEvents() {
    $("body").on("click", "#supportChat-notifBox .btnMarkAsRead", function() {
      //to disable running 2 consecutive request or clicks by user
      var btn_element = $(this);
      if (btn_element.data("requestRunning")) return;
      btn_element.data("requestRunning", true);

      var parentLi = $(this)
        .parent()
        .parent();

      var parentBoxId = $(this).attr("data-parentadminboxid");

      var status;
      var envelope_fa;

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

      var ajaxCall = updateSupportChatStatus(
        fileAssignmentID,
        status,
        envelope_fa
      );

      $(parentLi).preLoad(ajaxCall);

      ajaxCall.done(function() {
        SupportNotificationBox.showSupportNotificationBoxes();
        btn_element.data("requestRunning", false);
      });
    });

    $("body").on("click", "#supportChat-notifBox .btnRemove", function() {
      var parentLi = $(this)
        .parent()
        .parent();
      parentLi.fadeOut("slow", function() {
        $(this).remove();
      });

      var parentBoxId = $(this).attr("data-parentadminboxid");

      var totalNewMessage = parseInt(
        $("#" + parentBoxId + " .notifCount")
          .text()
          .replace(/\D/g, "")
      ); //starts from 1

      var node = $(this)
        .parent()
        .attr("data-managerKey");

      node = JSON.parse(node);

      // console.log(node.supportChatStatus == "new" + " VS " + totalNewMessage);

      countItems(parentBoxId);

      if ($("#" + parentBoxId + " ul.itemList li.newMessage").length == 0) {
        $("#" + parentBoxId).fadeOut("2000", function() {
          $(this).remove();
        });
      }

      var fileAssignmentID = parentLi.attr("id").replace(/\D/g, "");

      updateSupportChatStatus(fileAssignmentID, "closed");
    });

    $("body").on(
      "click",
      "#supportChat-notifBox .notifBox-item ul.itemList li.item > a",
      function(e) {
        var keys = $(this)
          .parent()
          .find(".buttons")
          .attr("data-managerkey");

        var data_item_id = $(this)
          .parent()
          .find(".buttons")
          .attr("data-itemid");

        keys = JSON.parse(keys);

        var file_id = $(this)
          .parent()
          .attr("id")
          .replace(/\D/g, "");

        //showing the preolader
        ProcessingLoader.showPreloader($("#chatSupport-listbox"));

        $(".chatbox-wrapper").show();

        var chat_header_html =
          "<img src='" +
          keys.imageSrc +
          "' style='width: 35px; height: 35px; border: 2px solid #f7f7f7; border-radius: 50%; margin-top: 3px; margin-right: 5px; position: absolute; zoom: 1.9; box-shadow: 0px 3px 2px -2px #00693c; top: 2px;' />" + //image
          "<span style='font-size:12px;color:#defd60;margin-left:73px'>" +
          keys.jobtitle +
          "</span><br><span style='font-size:11px;color:#f3f3f3;margin-left:73px'>" +
          fixedDecodeUri(keys.name) +
          "</span>";

        $(".chatbox-header").html(chat_header_html);
        $(".chatbox-header").attr("data-current_itemid", data_item_id);

        var $textarea = $("#enterNewChat-textarea");

        $textarea.attr("data-fid", file_id);

        SupportChat.init();

        SupportChat.loadChats(file_id);

        SupportChatPolling.pollForNewMessage(file_id, 1000, "jd-datatable");

        if ($(window).width() < 840) {
          $(".chatbox-wrapper").css(
            "top",
            e.pageY + $("#s4-workspace").scrollTop() + 75
          );
          $(".chatbox-wrapper").css("left", "488px");
        } else {
          $(".chatbox-wrapper").css(
            "top",
            e.pageY + $("#s4-workspace").scrollTop() + 25
          );
          $(".chatbox-wrapper").css("left", e.pageX - 10);
        }
      }
    );
  } //end of bind btn eventss

  return {
    showSupportNotificationBoxes: showSupportNotificationBoxes,
    getUrl: generateURL,
    bindButtonEvents: bindButtonEvents
  };
})(addFilterDependsOnAccessType);

var SupportChat = (function() {
  //cached data
  var $textarea = $("#enterNewChat-textarea");

  moment.fn.fromNowOrNow = function(a) {
    if (Math.abs(moment().diff(this)) < 1000) {
      // 1000 milliseconds
      return "just now";
    }
    return this.fromNow(a);
  };

  //DOM Manipulation
  var newMessageOnDom = function(messageBody) {
    $(".noConvoMsg").remove(); //if

    var timestamp = moment().fromNowOrNow();

    var newChat = [
      '<li id="message_temporary">',
      '<div class="chat-msg-admin support-chat-box">',
      "<p>" + messageBody + "</p>",
      "</div>",
      '<div class="chat-msg-timestamp right-timestamp">',
      "<p>" + timestamp + "</p>",
      "</div>",
      "</li>"
    ].join("");

    $("#chatSupport-listbox").append(newChat);
    $("#chatSupport-listbox").scrollTop(
      $("#chatSupport-listbox")[0].scrollHeight
    );

    $("#chatSupport-listbox li div p").each(function() {
      var a = $(this).html();

      a = a.replace(/&nbsp;/g, " ");

      $(this).html(a);
    });
  };

  var newMessage = function(
    userType,
    messageBody,
    timestamp,
    messageId,
    messagedBy
  ) {
    var ts_locationClass = userType == "user" ? "left" : "right"; //condition ternary

    timestamp = moment(timestamp).fromNowOrNow();

    var newChatFromAdmin = [
      '<li id="message_' + messageId + '">',
      '<div class="chat-msg-' + userType + ' support-chat-box">',
      "<p>" + messageBody + "</p>",
      "</div>",
      '<div class="chat-msg-timestamp ' + ts_locationClass + '-timestamp">',
      "<p>" + timestamp + "</p>",
      "</div>",
      "</li>"
    ].join("");

    if ($("#chatSupport-listbox li#message_temporary").length) {
      $("#chatSupport-listbox li#message_temporary").remove();
    }

    if ($("#chatSupport-listbox li#message_" + messageId).length !== 0) {
      var $currentElement = $("#chatSupport-listbox li#message_" + messageId);

      $currentElement.find(".chat-msg-timestamp > p").text(timestamp);

      //stop the appending
      return;
    }

    //check if message is already attached

    var parentWidth = parseInt(
      $(".support-chat-box")
        .parent()
        .outerWidth()
    );

    var pixels = parentWidth * (85 / 100);

    $(".chat-msg-text > p").css("max-width", pixels);

    //append

    $("#chatSupport-listbox").append(newChatFromAdmin);
    $("#chatSupport-listbox li div p").each(function() {
      var a = $(this).html();

      a = a.replace(/&nbsp;/g, " ");

      $(this).html(a);
    });

    //$("#chatSupport-listbox").scrollTop($("#chatSupport-listbox")[0].scrollHeight);
  }; //newMessage

  function checkMessageIfFileAttachment(messageBody) {
    if (messageBody.startsWith('{"isLink":"::true::"')) {
      var messageObj = JSON.parse(messageBody);

      var imgsrc = "";

      if (messageObj.filetype == "docx" || messageObj.filetype == "doc") {
        imgsrc =
          "https://spoprod-a.akamaihd.net/files/odsp-next-prod_2018-06-01-sts_20180606.002/odsp-media/images/itemtypes/20/docx.png";
      } else if (messageObj.filetype.toUpperCase() == "pdf".toUpperCase()) {
        imgsrc =
          "https://spoprod-a.akamaihd.net/files/odsp-next-prod_2018-06-01-sts_20180606.002/odsp-media/images/itemtypes/20/pdf.png";
      } else if (
        messageObj.filetype.toUpperCase() == "pptx".toUpperCase() ||
        messageObj.filetype.toUpperCase() == "ppt".toUpperCase()
      ) {
        imgsrc =
          "https://spoprod-a.akamaihd.net/files/odsp-next-prod_2018-06-01-sts_20180606.002/odsp-media/images/itemtypes/20/pptx.png";
      } else if (messageObj.filetype.toUpperCase() == "html".toUpperCase()) {
        imgsrc =
          "https://spoprod-a.akamaihd.net/files/odsp-next-prod_2018-06-01-sts_20180606.002/odsp-media/images/itemtypes/20/html.png";
      } else if (messageObj.filetype.toUpperCase() == "zip".toUpperCase()) {
        imgsrc =
          "https://spoprod-a.akamaihd.net/files/odsp-next-prod_2018-06-01-sts_20180606.002/odsp-media/images/itemtypes/20/zip.png";
      } else if (
        messageObj.filetype.toUpperCase() == "xls".toUpperCase() ||
        messageObj.filetype.toUpperCase() == "xlsx".toUpperCase()
      ) {
        imgsrc =
          "https://spoprod-a.akamaihd.net/files/odsp-next-prod_2018-06-01-sts_20180606.002/odsp-media/images/itemtypes/20/xlsx.png";
      } else if (
        messageObj.filetype.toUpperCase() == "gif".toUpperCase() ||
        messageObj.filetype.toUpperCase() == "png".toUpperCase() ||
        messageObj.filetype.toUpperCase() == "jpeg".toUpperCase() ||
        messageObj.filetype.toUpperCase() == "jpg".toUpperCase()
      ) {
        imgsrc =
          "https://spoprod-a.akamaihd.net/files/odsp-next-prod_2018-06-01-sts_20180606.002/odsp-media/images/itemtypes/20/photo.png";
      } else {
        imgsrc = "";
      }

      messageBody =
        "<a class='msg-attachmentFile " +
        messageObj.filetype +
        "' href='" +
        messageObj.link +
        "'>" +
        "<img src='" +
        imgsrc +
        "' /> " +
        messageObj.filename +
        "</a> <label style='min-height:2px;display:block'></label>" +
        messageObj.message;
    }

    return messageBody;
  }

  var storeComment = function(fileAssignmentID, messageBody) {
    var tempMessageBody = replaceSmileys(messageBody);
    tempMessageBody = checkMessageIfFileAttachment(tempMessageBody);

    newMessageOnDom(tempMessageBody);

    var data = {
      __metadata: {
        type: "SP.Data.File_x005f_commentsListItem"
      },
      Title: "Default",
      File_Assignment_ID: fileAssignmentID,
      Messaged_By: 1,
      Message_Body: messageBody,
      AssignedManagerId: _spPageContextInfo.userId,
      timestamp: new Date().getTime().toString()
    };

    var ajaxSuccess = function(result) {
      var messagesId = JSON.parse($textarea.attr("data-chatMessagesId"));
      messagesId.push(result.d.Id);

      //console.log(messagesId);

      updateFileAssignmentCommentIDs(fileAssignmentID, messagesId); //with ajax call

      //newMessage("user", messageBody, moment(), result.d.Id); //dom Manipulation

      // console.log("Comment has been saved! @ " + moment().format("MMMM Do YYYY hh:mm:ss"));
    };

    var ajaxSettings = {
      url:
        _spPageContextInfo.webAbsoluteUrl +
        "/_api/Web/Lists/GetByTitle('File_comments')/Items",
      type: "POST",
      headers: {
        accept: "application/json;odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        "content-Type": "application/json;odata=verbose"
      },
      data: JSON.stringify(data)
    };

    return $.ajax(ajaxSettings).done(function(data) {
      ajaxSuccess(data);
    });
  };

  var updateFileAssignmentCommentIDs = function(fileAssignmentID, messagesId) {
    //console.log("1");
    //console.log(messagesId);
    var data = {
      __metadata: {
        type: "SP.Data.File_x005f_AssignmentsListItem"
      },
      MessagesId: {
        results: messagesId
      }
    };

    var ajaxSuccess = function(data) {
      console.log(
        "%c File Assignment : " +
          fileAssignmentID +
          " messages has been updated",
        consoleCSS_success
      );
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
  };

  var loadChats = function(fileAssignmentID, updateFromPolling) {
    //$("#chatSupport-listbox").html(""); //clear chats'
    var generateURL = function() {
      var select_query = "$select=*,Messages";
      var expand_query = "$expand=Messages";
      var top = "$top=1";
      var filter_query = "$filter=Id eq " + fileAssignmentID + "&" + top;

      var url =
        "/_vti_bin/listdata.svc/File_Assignments?" +
        select_query +
        "&" +
        expand_query +
        "&" +
        filter_query;

      console.log(url);

      return url;
    };

    var ajaxSettings = {
      url: _spPageContextInfo.webAbsoluteUrl + generateURL(),
      type: "GET",
      headers: {
        accept: "application/json;odata=verbose"
      }
    };

    var ajaxSuccess = function(data) {
      //console.log("ZEKE is troubleshoooooooooooooooooooooooooootig bugs !");
      // console.log(data);

      var messages_id = [];

      if (data.Messages.results.length == 0) {
        $("#chatSupport-listbox").html(
          "<li class='noConvoMsg' style='color:#3fa287;'>No Conversation recorded on this file.</li>"
        );
      }

      $(".processingLoader").remove();

      // console.log("BBBBBBBBBBB*********AAA "  + data.Id);
      if ($(".chatbox-header").attr("data-current_itemid") != data.Id) {
        // console.log("AAAA**************************AAA "  + data.Id);
        return;
      }

      $(data.Messages.results).each(function(i) {
        // console.log(this);
        //
        messages_id.push(this.Id);

        var messagedBy = this.Messaged_By;

        var userType = this.Messaged_By == 0 ? "user" : "admin";
        var messageBody = this.Message_Body;

        var chatTimestamp = this.Timestamp;

        // console.log(chatTimestamp  + " AND " + moment(parseInt(chatTimestamp)).format("LLL"));

        chatTimestamp = moment(parseInt(chatTimestamp));

        messageBody = replaceSmileys(messageBody);

        messageBody = checkMessageIfFileAttachment(messageBody);

        newMessage(userType, messageBody, chatTimestamp, this.Id, messagedBy);

        if (i == data.Messages.results.length - 1) {
          $textarea.attr("data-lastmessageid", this.Id); //end of loop

          $(".chatSupport-notif").remove();

          if (messagedBy === 0) {
            var newMsgFrmAdmin =
              "<div class='chatSupport-notif'> New message from user </div>";

            $(newMsgFrmAdmin).prependTo(".chatSupport-wrapper");
          }
        }
      });

      $textarea.attr("data-chatMessagesId", JSON.stringify(messages_id));

      if (updateFromPolling && updateFromPolling !== undefined) {
      } else {
        $("#chatSupport-listbox").scrollTop(
          $("#chatSupport-listbox")[0].scrollHeight
        );
      }
    };

    return $.ajax(ajaxSettings).done(function(data) {
      ajaxSuccess(data.d.results[0]);
    });
  };

  var bindEvents = function() {
    $textarea.keyup(function(e) {
      var node = $(this);
      var code = e.keyCode ? e.keyCode : e.which;
      if (e.keyCode == 13 && !e.shiftKey) {
        // Enter keycode

        //check if text area has nothing
        if (node.val() !== "") {
          //get id

          var fileAssignmentID = node.attr("data-fid");

          var message = node.val();
          message = message.replace(/ /g, "\u00a0");
          message = message.replace(/\n/g, "<br />");

          $(node).css("height", "45px");
          //   console.log(message);

          storeComment(fileAssignmentID, message);

          $textarea.val("");
          //$(".support-chat-wrapper > ul").animate({scrollTop:$(".support-chat-wrapper > ul")[0].scrollHeight}, 500);
        }
      }
    });

    $textarea.on("keypress", function(e) {
      if (e.keyCode == 13 && !e.shiftKey) {
        e.preventDefault();
      }
    });

    $("body").on("click", ".chatSupport-notif", function() {
      $("#chatSupport-listbox").scrollTop(
        $("#chatSupport-listbox")[0].scrollHeight
      );
      //$(this).remove();
    });
  };

  var smileys = {
    ":)":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/smile.gif" border="0" alt="" />',
    ":(":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/sad.gif" border="0" alt="" />',
    "-_-":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/shivering.gif" border="0" alt="" />',
    ";)":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/wink.gif" border="0" alt="" />',
    "<3":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/inlove.gif" border="0" alt="" />',
    ":kevin:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/monkey.gif" border="0" alt="" />',
    ":muscle:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/muscle.gif" border="0" alt="" />',
    ":rock:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/rock.gif" border="0" alt="" />',
    ":rofl:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/rofl.gif" border="0" alt="" />',
    ":punch:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/punch.gif" border="0" alt="" />',
    ":angry:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/angry.gif" border="0" alt="" />',
    ":blue:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/bollylove.gif" border="0" alt="" />',
    ":mhari:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/ladyvampire.gif" border="0" alt="" />',
    ":romnick:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/emo.gif" border="0" alt="" />',
    ":stephen:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/oliver.gif" border="0" alt="" />',
    ":jansen:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/skull.gif" border="0" alt="" />',
    ":jon:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/sturridge15.gif" border="0" alt="" />',
    ":mmm:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/heart.gif" border="0" alt="" />',
    ":heart:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/mmm.gif" border="0" alt="" />',
    ":lalala:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/lalala.gif" border="0" alt="" />',
    ":melix:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/heart.gif" border="0" alt="" />',
    ":giggle:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/giggle.gif" border="0" alt="" />',
    ":sleepy:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/sleepy.gif" border="0" alt="" />',
    ":P":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/tongueout.gif" border="0" alt="" />',
    ":p":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/tongueout.gif" border="0" alt="" />',
    ":zeke:":
      '<img src="' +
      _spPageContextInfo.webAbsoluteUrl +
      '/joblibraryassets/images/emoticons/shielddeflect.gif" border="0" alt="" />'
  };

  function replaceSmileys(msg) {
    var __regExpression;
    for (keys in smileys) {
      var newKey = escapeRegExp(keys);
      if (__regExpression == undefined) {
        __regExpression = newKey + "|";
      } else {
        __regExpression = __regExpression + newKey + "|";
      }
    }
    var finalRegExpression = "/(" + __regExpression + ")/g";
    //console.log(eval(finalRegExpression));

    return msg.replace(eval(finalRegExpression), function(all) {
      return smileys[all] || all;
    });

    function escapeRegExp(text) {
      return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    }
  }

  var init = function() {
    expandTextarea("enterNewChat-textarea");
    bindEvents();
  };

  return {
    init: init,
    newMessage: newMessage,
    storeComment: storeComment,
    loadChats: loadChats,
    newMessageOnDom: newMessageOnDom
  };
})();

var SupportChatPolling = (function(SupChat) {
  var pollCall = null;

  var $textarea = $("#enterNewChat-textarea");

  var checkForNewMessage = function(fileAssignmentID, interval, tableId) {
    var ajaxSettings = {
      url:
        _spPageContextInfo.webAbsoluteUrl +
        "/_api/Web/Lists/GetByTitle('File_comments')/Items?$select=*&$filter=File_Assignment_ID eq '" +
        fileAssignmentID +
        "'&$orderby=Created desc&$top=1",
      type: "GET",
      headers: {
        accept: "application/json;odata=verbose"
      },
      complete: function(data) {
        //  console.log(data.responseJSON.d.results.length);
        if (data.responseJSON.d.results.length > 0) {
          ajaxSuccess(data.responseJSON.d.results[0]);
        }

        pollForNewMessage(fileAssignmentID, interval, tableId);
      }
    };

    var ajaxSuccess = function(lastMessage) {
      var lastIDmismatch =
        lastMessage.Id != $textarea.attr("data-lastmessageid");
      // console.log(lastMessage.Id  + " == " + $textarea.attr("data-lastmessageid"));
      //if there is a new message loadChats
      if (lastIDmismatch) {
        // console.log(lastIDmismatch);

        //new message
        SupChat.loadChats(fileAssignmentID, true);
      }
    };

    $.ajax(ajaxSettings);
  };

  var pollForNewMessage = function(fileAssignmentID, interval, tableId) {
    if (pollCall != null) clearTimeout(pollCall);

    var tableIsActive = $("#" + tableId + " tr").hasClass("active-row");

    if (!tableIsActive) return;

    pollCall = setTimeout(function() {
      //  console.log("polling for new Message for : " + tableId + " file id of "+ fileAssignmentID);

      checkForNewMessage(fileAssignmentID, interval, tableId);
    }, interval);
  };

  var stopPoll = function() {
    clearTimeout(pollCall);
  };

  var init = function() {};

  return {
    pollForNewMessage: pollForNewMessage,
    stopPoll: stopPoll
  };
})(SupportChat);

//delete later

function checkAccessSetting(access_check_promises) {
  var url =
    "/_api/Web/Lists/GetByTitle('Access_List')/Items?$select=*,Admin_Name/Name&$expand=Admin_Name&$filter=Admin_NameId eq " +
    _spPageContextInfo.userId;

  var access_check_promise = $.ajax({
    url: _spPageContextInfo.webAbsoluteUrl + url,
    type: "GET",
    headers: {
      accept: "application/json;odata=verbose"
    },
    success: function(data) {},
    error: function(error) {
      console.log(" checkAccessSetting : " + JSON.stringify(error));
    }
  }); //ajax call done

  access_check_promises.push(access_check_promise);
} //

function __loadSupportNotifs(url) {
  var getDistinctAssigners = $.ajax({
    url: _spPageContextInfo.webAbsoluteUrl + url,
    type: "GET",
    headers: {
      accept: "application/json;odata=verbose"
    },
    error: function(error) {
      console.log(JSON.stringify(error));
    }
  }); // get distinct

  getDistinctAssigners.done(function(data) {
    $(".support-boxes").html("");
    $("#jd_card-support-panel")
      .find("label.msg_count-onsupport")
      .text("");

    var __assigner_object = {};
    var __assigners = [];

    var assigned_by_ids = [];
    //var assigned_by_names = [];

    var assigned_manager_names = [];

    var job_codes = [];

    $(data.d.results).each(function() {
      var assigner_id = this.AssignedById;

      assigned_manager_names.push(this.AssignedManager.Title);
      job_codes.push(this.Job_Code);

      if (!(assigned_by_ids.indexOf(assigner_id) > -1)) {
        //assigned_manager_name.push(this.AssignedManager.Title);
        assigned_by_ids.push(assigner_id);
        //assigned_by_names.push(this.AssignedBy.Title);
      }
    }); //data .each end

    var deffered_GetJDF_file_IDs = [];

    var comments_All = [];

    $(assigned_by_ids).each(function(x) {
      var __assigner_ID = this;
      var new_message_from = "z";
      var job_code_on_iteration = job_codes[x];

      var url =
        "/_api/Web/Lists/GetByTitle('Job_Description_Files')/Items?$select=*,Editor/Title,Editor/Name,FileLeafRef&$expand=Editor&$filter=Editor/Id eq " +
        __assigner_ID +
        " and Entry_Type eq 0";

      var deffered = $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
          accept: "application/json;odata=verbose"
        },
        success: function(data) {
          $(data.d.results).each(function() {
            var id = this.ID;

            var assigned_by_name = this.Editor.Title;
            var assigned_by_photo = this.Editor.Name;

            assigned_by_photo = assigned_by_photo.substring(18);
            assigned_by_photo = assigned_by_photo.slice(0, -10);
            assigned_by_photo =
              "https://mfc.sharepoint.com/_layouts/15/userphoto.aspx?size=L&username=" +
              assigned_by_photo;

            var jobcode_data = this.Job_Code;

            var comments_Object = {};

            //query to check if there are new messages
            var url =
              "/_api/Web/Lists/GetByTitle('File_comments')/Items?$select=*,AssignedManager/Name,AssignedManager/Title&$expand=AssignedManager&$filter=File_Assignment_ID eq '" +
              id +
              "'&$orderby=Created desc&$top=1";

            var deffered_2 = $.ajax({
              url: _spPageContextInfo.webAbsoluteUrl + url,
              type: "GET",
              headers: {
                accept: "application/json;odata=verbose"
              },
              success: function(data) {
                if (data.d.results.length == 0) return;

                var node = data.d.results[0];
                console.log(data);
                var mfcgdid = node.AssignedManager.Name;

                var assigned_manager_photo = mfcgdid.substring(18);
                assigned_manager_photo = assigned_manager_photo.slice(0, -10);
                assigned_manager_photo =
                  "https://mfc.sharepoint.com/_layouts/15/userphoto.aspx?size=L&username=" +
                  assigned_manager_photo;

                //means the last chat was from user

                if (node.Messaged_By == "0") {
                  console.log(node.ID);

                  //console.log("ADMIN");

                  /*comments_Object.AssignedById = __assigner_ID + "";
                                    comments_Object.AssignedManager = node.AssignedManager.Title;

                                    comments_All.push(comments_Object);*/
                  //console.log("#"+"assigner-" + __assigner_ID);

                  var total_msgs_count_on_support = $("#jd_card-support-panel")
                    .find("label.msg_count-onsupport")
                    .text();

                  if (total_msgs_count_on_support == "") {
                    total_msgs_count_on_support = 0;
                  }

                  total_msgs_count_on_support = parseInt(
                    total_msgs_count_on_support
                  );

                  console.log(
                    "total : ********* " + total_msgs_count_on_support
                  );

                  total_msgs_count_on_support = total_msgs_count_on_support + 1;

                  $("#jd_card-support-panel")
                    .find("label.msg_count-onsupport")
                    .text(total_msgs_count_on_support + " New !");

                  var __current_item = $("#" + "assigner-" + __assigner_ID);

                  if ($(__current_item).length != 0) {
                    var managernew_html =
                      "<li>" +
                      "<a data-assignedto-name='" +
                      node.AssignedManager.Title +
                      "' data-jdfid='" +
                      node.File_Assignment_ID +
                      "' href='' data-mfcgd='" +
                      mfcgdid +
                      "'>" +
                      "<img style='display:none;width:24px;height:24px' src='" +
                      assigned_manager_photo +
                      "' class='support-boxes-admin-pic' data-themekey='#'>" +
                      "<span style='color:#00693c;font-weight:bold;'>" +
                      node.AssignedManager.Title +
                      "</span> @ " +
                      "<strong class='jc-holder'>" +
                      jobcode_data +
                      "</strong> " +
                      " (" +
                      moment(node.Created).fromNow() +
                      ")" +
                      "</a>" +
                      "</li>";

                    $(__current_item)
                      .find("ul.managernew-msgs")
                      .append(managernew_html);

                    var msg_count = parseInt(
                      $(__current_item)
                        .find("label.msg-count")
                        .text()
                    );

                    msg_count = msg_count + 1;
                    msg_count = msg_count + " new message(s)";

                    $(__current_item)
                      .find("label.msg-count")
                      .text(msg_count);
                    console.log("yahoo");
                  } else {
                    var msg_count = 1;

                    msg_count = msg_count + " new message(s)";
                    var support_boxes_html =
                      "<li id='assigner-" +
                      __assigner_ID +
                      "'>" +
                      "<div class='support-boxes-wrapper'>" +
                      "<div class='support-boxes-head'>" +
                      "<i class='pull-right fa fa-chevron-down' style=' font-size: 20px; color: #004b4f; cursor: pointer; opacity: 0.6;margin-top:8px; '></i>" +
                      "<div class='support-boxes-img-container'>" +
                      "<img src='" +
                      assigned_by_photo +
                      "' class='support-boxes-admin-pic' data-themekey='#'>" +
                      "</div>" +
                      "<div class='support-boxes-container-right'>" +
                      "<span class='support-boxes-admin-name'>" +
                      assigned_by_name +
                      "</span>" +
                      "<br>" +
                      "<span class='support-boxes-notif-count'><label class='msg-count'>" +
                      msg_count +
                      "</label></span>" +
                      "</div>" +
                      "<div style='clear:both'>" +
                      "</div>" +
                      "</div>" +
                      "<div class='support-boxes-body' style='display:none'>" +
                      "<ul class='managernew-msgs'>" +
                      "<li style='border-top:none'>" +
                      "<a data-assignedto-name='" +
                      node.AssignedManager.Title +
                      "' data-jdfid='" +
                      node.File_Assignment_ID +
                      "' href='' data-mfcgd='" +
                      mfcgdid +
                      "'>" +
                      "<img style='display:none;width:24px;height:24px' src='" +
                      assigned_manager_photo +
                      "' class='support-boxes-admin-pic' data-themekey='#'>" +
                      "<span style='color:#00693c;font-weight:bold;'>" +
                      node.AssignedManager.Title +
                      "</span> @ " +
                      "<strong class='jc-holder'>" +
                      jobcode_data +
                      "</strong> " +
                      " (" +
                      moment(node.Created).fromNow() +
                      ")" +
                      "</a>" +
                      "</li>";
                    "</ul>" + "</div>" + "</div>" + "</li>";

                    $("ul.support-boxes").append(support_boxes_html);
                  }

                  /*$("ul.support-boxes li").each(function(){
                                    	if(this.id == "assigner-" + __assigner_ID){
                                    			
                                    	}
                                    });*/
                } //if(node.Messaged_By == '0'){
              }
            }); //inside ajax call

            deffered_GetJDF_file_IDs.push(deffered_2);

            console.log(comments_Object);
          }); //data.each
        }
      }); //ajax call end
    }); //$(assigned_by_ids).each(function(){

    /*$.when.apply($, deffered_GetJDF_file_IDs).done(function(data){
        	//console.log(deffered_GetJDF_file_IDs);
        	
        	

        

        	$(deffered_GetJDF_file_IDs).each(function(){
        		//console.log(this.responseJSON.d.results)
        	});
        }); //$.when.apply($, deffered_GetJDF_file_IDs).done(function(){*/
  }); // get distinct done

  var timer;

  $("body").on("click", ".managernew-msgs > li > a", function(e) {
    event.preventDefault ? event.preventDefault() : (event.returnValue = false);

    //var jobcode_number = $(this).find(".jc-holder").text();

    //var mfcgdid = $(this).attr("data-mfcgd");

    // $("div#jd-datatable_filter input[type='search']").val(jobcode_number).keyup();
    //console.log(jobcode_number);

    //$("#jd-datatable").find("tr[data-job_code_value='"+ jobcode_number +"']").find("td:nth-child(3)").click();
    //_datatable_Scroll($("#jd-datatable").find("tr[data-job_code_value='"+ jobcode_number +"']"));

    // setTimeout(function(){

    //$("li.show-comments-btn[data-mfcgdid='"+ mfcgdid +"']").click();

    //},1550);
    //

    var parent_ul = $(this)
      .parent()
      .parent();

    if (parent_ul.data("ajax_requestRunning")) return; //stop propagation if there is a request running in the background

    parent_ul.data("ajax_requestRunning", true);

    var btn_element = $(this);

    $(".chatbox-list").html("");
    $(".hide_comments").hide();

    $(".preloader_ajax").remove();

    var preloader_ajax =
      "" +
      "<div class='preloader_ajax' style='text-align:center'>" +
      "<img src='https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/preloaders/preloader_spinner.gif' data-themekey='#' style='text-align: center;'>" +
      "</div>";

    $(".chatbox-list").prepend(preloader_ajax);

    var id = $(this).attr("data-jdfid");

    //$(".chatbox-wrapper").css("top", margin_top);
    //$(this).parent().append($(".chatbox-wrapper"));

    if ($(window).width() < 840) {
      $(".chatbox-wrapper").css(
        "top",
        e.pageY + $("#s4-workspace").scrollTop() + 75
      );
      $(".chatbox-wrapper").css("left", "488px");
    } else {
      $(".chatbox-wrapper").css(
        "top",
        e.pageY + $("#s4-workspace").scrollTop() + 25
      );
      $(".chatbox-wrapper").css("left", e.pageX - 10);
    }

    var ajax_call = $.ajax({
      url:
        _spPageContextInfo.webAbsoluteUrl +
        "/_api/Web/Lists/GetByTitle('Job_Description_Files')/Items?$select=*,FileLeafRef&$filter=ID eq '" +
        id +
        "'",
      type: "GET",
      headers: {
        accept: "application/json;odata=verbose"
      },
      success: function(data) {},
      error: function(error) {}
    });

    ajax_call.done(function(data) {
      var node = data.d.results[0];

      var id = node.ID;
      var title = node.Title;

      var chat_header_html =
        "<img src='" +
        getSharepointUserPhoto($(btn_element).attr("data-mfcgd")) +
        "' style='width: 35px; height: 35px; border: 2px solid #f7f7f7; border-radius: 50%; margin-top: 3px; margin-right: 5px; position: absolute; zoom: 1.9; box-shadow: 0px 3px 2px -2px #00693c; top: 2px;' />" + //image
        "<span style='font-size:12px;color:#defd60;margin-left:73px'>" +
        $(btn_element).attr("data-assignedto-name") +
        "</span><br><span style='font-size:11px;color:#f3f3f3;margin-left:73px'>" +
        title +
        "</span>";

      $(".chatbox-header").html(chat_header_html);
      // $(".chatbox-header span").append(chat_header_html);

      $("#textarea-newmessage").attr("data-message-id", id);

      $(".chatbox-wrapper").show();

      polling__($("#textarea-newmessage").attr("data-message-id"));

      load_comments_of_selected_file(id, parent_ul);
    });
  }); //on click  ".managernew-msgs >
} //__loadSupportNotifs

function _distinctArray(array) {
  $(data.d.results).each(function() {
    var grade = this.Grade;

    //alert(authorNames.indexOf(author) > -1);
    //

    if (!(grades.indexOf(grade) > -1)) {
      $("#select_filter-grade").append("<option>" + grade + "</option>");
    }

    grades.push(grade);
  }); //data .each end
}

function _datatable_Scroll(element) {
  var ctr = 0;
  if ($("#s4-workspace").scrollTop() > 0) {
    ctr = 102;
  }

  var addworkspaceScrollTop =
    element.offset().top + $("#s4-workspace").scrollTop() + ctr;
  addworkspaceScrollTop -= 280;
  // alert(element.offset().top + " AND SCROLLTOP " + $('#s4-workspace').scrollTop() + " and " + addworkspaceScrollTop);

  $("#s4-workspace").animate(
    {
      scrollTop: addworkspaceScrollTop
    },
    700
  );
}

function runWhen_checkAccessSettingDone(access_check_promises) {
  $.when.apply($, access_check_promises).done(function(data) {
    if (data.d.results.length == 0) {
      $(".container-fluid").html("");
      $(".jd-box").remove();

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
    var loadSupportNotifsUrl = "";

    if (
      access_type.trim().toUpperCase() ==
      "Admin Full Access".trim().toUpperCase()
    ) {
      loadSupportNotifsUrl =
        "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*,AssignedById,AssignedBy/Title,AssignedManager/Title,AssignedBy/Title" +
        "&$expand=AssignedBy, AssignedManager&$filter=Status eq 'Unopened'";
    } else if (
      access_type.trim().toUpperCase() ==
      "Admin Default Access".trim().toUpperCase()
    ) {
      loadSupportNotifsUrl =
        "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*,AssignedById,AssignedBy/Title,AssignedManager/Title,AssignedBy/Title" +
        "&$expand=AssignedBy, AssignedManager&$filter=Status eq 'Unopened' and AssignedById eq " +
        _spPageContextInfo.userId;
    }

    __loadSupportNotifs(loadSupportNotifsUrl);
  });
}

function runWhen_checkAccessSettingDone_ManagerSubmission(
  access_check_promises
) {
  $.when.apply($, access_check_promises).done(function(data) {
    if (data.d.results.length == 0) {
      $(".container-fluid").html("");
      $(".jd-box").remove();

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
    var managerSubmission_url = "";
    if (
      access_type.trim().toUpperCase() ==
      "Admin Full Access".trim().toUpperCase()
    ) {
      managerSubmission_url =
        "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*,AssignedById,AssignedBy/Title,AssignedBy/Name,AssignedManager/Name,AssignedManager/Title,AssignedBy/Title" +
        "&$expand=AssignedBy, AssignedManager&$filter=Status eq 'Submitted'&$orderby=Submission_Date asc";
    } else if (
      access_type.trim().toUpperCase() ==
      "Admin Default Access".trim().toUpperCase()
    ) {
      managerSubmission_url =
        "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*,AssignedById,AssignedBy/Title,AssignedBy/Name,AssignedManager/Name,AssignedManager/Title,AssignedBy/Title" +
        "&$expand=AssignedBy, AssignedManager&$orderby=Submission_Date asc&$filter=Status eq 'Submitted' and AssignedById eq " +
        _spPageContextInfo.userId;
    }

    __loadManagerSubmissions_Notification(managerSubmission_url);
  }); //when
} // runWhen_checkAccessSettingDone_ManagerSubmission

function getCurrentUserDisplayName() {
  $.ajax({
    url:
      _spPageContextInfo.webAbsoluteUrl +
      "/_api/SP.UserProfiles.PeopleManager/GetMyProperties/DisplayName",
    type: "GET",
    headers: {
      accept: "application/json;odata=verbose"
    },
    success: function(data) {
      $(".banner-template").attr("data-userdisplayname", data.d.DisplayName);
    },
    error: function(error) {
      console.log("getCurrentUserDisplayName : " + JSON.stringify(error));
    }
  });
}

function __loadManagerMessages_Notifications() {
  //NOT IN USED:
  //
  return;
  var url =
    "/_api/Web/Lists/GetByTitle('File_comments')/" +
    "Items?$select=*,AssignedManager/Name,AssignedManager/Title&" +
    "$expand=AssignedManager&$orderby=File_Assignment_ID asc"; //query get all entries that has Messaged_By = 0

  $.ajax({
    url: _spPageContextInfo.webAbsoluteUrl + url,
    type: "GET",
    headers: {
      accept: "application/json;odata=verbose"
    },
    success: function(data) {
      if (data.d.results.length == 0) return;

      var old_file_id = "";
      var last_message_array = [];

      var __counter = 0;

      $(data.d.results).each(function() {
        var node = this;
        var new_file_id = this.File_Assignment_ID;

        if (old_file_id != "") {
          //console.log(old_file_id + "==" + new_file_id);
          if (old_file_id == new_file_id) {
            // console.log(old_file_id + "==" + new_file_id);

            //console.log(__counter);
            last_message_array[__counter] = node;
          } else {
            last_message_array[__counter] = node;
            // console.log("sss " + __counter);
            __counter++;
          }

          old_file_id = new_file_id;
        } else {
          old_file_id = this.File_Assignment_ID;
        }
      }); // data d results

      //console.log(last_message_array);

      $(last_message_array).each(function() {
        if (this.Messaged_By == undefined) return;

        if (this.Messaged_By == "0") {
          console.log(this.ID);
        }
      });

      /*var mfcgdid = node.AssignedManager.Name;

            var assigned_manager_photo = mfcgdid.substring(18);
            assigned_manager_photo = assigned_manager_photo.slice(0,-10);
            assigned_manager_photo = "https://mfc.sharepoint.com/_layouts/15/userphoto.aspx?size=L&username=" + assigned_manager_photo;*/

      // console.log(this.AssignedManager.Name);
    },
    error: function(error) {
      console.log(JSON.stringify(error));
    }
  }); //ajax call ends
} //__loadManagerMessages_Notifications

(function() {
  var original = document.title;
  var timeout;

  window.flashTitle = function(newMsg, howManyTimes) {
    function step() {
      document.title = document.title == original ? newMsg : original;

      if (--howManyTimes > 0) {
        timeout = setTimeout(step, 1000);
      }
    }

    howManyTimes = parseInt(howManyTimes);

    if (isNaN(howManyTimes)) {
      howManyTimes = 5;
    }

    cancelFlashTitle(timeout);
    step();
  };

  window.cancelFlashTitle = function() {
    clearTimeout(timeout);
    document.title = original;
  };
})();
