var FileAssignmentOption = (function() {
  var App = {};

  var updateAssignment = function(id, updatedData) {
    var url =
      "/_api/Web/Lists/GetByTitle('File_Assignments')/items(" + id + ")";

    var ajaxSettings = {
      url: _spPageContextInfo.webAbsoluteUrl + url,
      type: "PATCH",
      headers: {
        accept: "application/json;odata=verbose",
        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
        "content-Type": "application/json;odata=verbose",
        "X-Http-Method": "PATCH",
        "If-Match": "*"
      },
      data: JSON.stringify(updatedData)
    };

    ajaxSettings.success = function(data) {
      $(".littleModal-statusShower")
        .show()
        .addClass("animated rubberBand");

      var job_code = $(
        "#modifyAssignment-modal .modifyAssignmentLabel-jobCode"
      ).text();

      load_assigned_managers(job_code);
      load_assigned_managers_history(job_code);
    };

    $.ajax(ajaxSettings);
  };

  function bindEvents() {
    $("body").on("click", "#btn-changed_deadline", function() {
      $("#modifyAssignment-dueDate").removeClass();

      $("#modifyAssignment-dueDate").datepicker({
        dateFormat: "MM dd, yy",
        minDate: 0
      });

      $("#modifyAssignment-dueDate").addClass("form-control");

      document.getElementById("modifyAssignment-modal").style.display = "block";

      var userKeys = JSON.parse(this.getAttribute("data-userkeys"));

      if (userKeys.status == "In-Progress") {
        userKeys.status = "Working";
      }

      $("#modifyAssignment-modal .modifyAssignmentLabel-assignedTo").text(
        fixedDecodeUri(userKeys.displayName)
      );
      $("#modifyAssignment-modal .modifyAssignmentLabel-dueDate").text(
        moment(userKeys.submission_date_literal).format("MMMM DD, YYYY")
      );
      $("#modifyAssignment-modal .modifyAssignmentLabel-jobCode").text(
        userKeys.job_code
      );
      $("#modifyAssignment-modal .modifyAssignmentLabel-status").text(
        userKeys.status
      );
      $("#modifyAssignment-status").val(userKeys.status);
      $("#modifyAssignment-modal .littleModal-footer .btn-save").data(
        "id",
        userKeys.id
      );

      $("#modifyAssignment-dueDate").val(
        moment(userKeys.submission_date_literal).format("MMMM DD, YYYY")
      );
    });

    $("body").on("click", "#modifyAssignment-modal .btn-cancel", function() {
      event.preventDefault
        ? event.preventDefault()
        : (event.returnValue = false);
      $(".littleModal-statusShower").hide();

      $("#modifyAssignment-modal").fadeOut();
    });

    $("body").on(
      "click",
      "#modifyAssignment-modal .littleModal-footer .btn-save",
      function() {
        event.preventDefault
          ? event.preventDefault()
          : (event.returnValue = false);

        var updatedData = {
          __metadata: {
            type: "SP.Data.File_x005f_AssignmentsListItem"
          },
          Status: $("#modifyAssignment-status").val(),
          Submission_Date: $("#modifyAssignment-dueDate").val()
        };

        var id = $(
          "#modifyAssignment-modal .littleModal-footer .btn-save"
        ).data("id");

        updateAssignment(id, updatedData);
      }
    );

    $("body").on("click", ".btn-viewChanger", function() {
      $(".assignedmanager-list-body").slideToggle();
      $(".assignedmanager-list-footer").slideToggle();
    });
  }

  App.bindEvents = bindEvents;

  return App;
})();

FileAssignmentOption.bindEvents();

function load_assigned_managers(job_code) {
  //$(".jd-box-right").append($(".chatbox-wrapper"));

  $("#assignedmanager-list").html("");

  var url =
    "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*,AssignedManager/Name, AssignedManager/Id,AssignedManager/Title,AssignedManager/EMail,AssignedBy/Title, AssignedBy/Name, AssignedBy/EMail&$expand=AssignedManager/Id,AssignedBy/Id&" +
    "$filter=Job_Code eq '" +
    job_code +
    "' and (Status eq 'Unopened' or Status eq 'Working' or Status eq 'Submitted' or Status eq 'Opened')";

  $.ajax({
    url: _spPageContextInfo.webAbsoluteUrl + url,
    type: "GET",
    headers: {
      accept: "application/json;odata=verbose"
    },
    success: function(data) {
      $(".preloader_ajax").remove();

      $("#current_assigned_managers-count").text(
        "(" + data.d.results.length + ")"
      );
      $(data.d.results).each(function() {
        var id = this.ID;

        var new_file_name = this.New_File_Name;

        var assigned_manager_title = this.AssignedManager.Title;

        var mfcgd = this.AssignedManager.Name;

        var assigned_manager_id = this.AssignedManager.Id;

        var assginedby_mfcgd = this.AssignedBy.Name;

        var status = this.Status;

        var email_address = this.AssignedManager.EMail;
        var assigner_email = this.AssignedBy.EMail;

        var job_code = this.Job_Code;

        if (status.toUpperCase() == "Working".toUpperCase()) {
          status = "In-Progress";
        }

        var assignedManager_info = {
          id: id,
          userID: assigned_manager_id,
          displayName: fixedEncodeURIComponent(assigned_manager_title),
          emailAddress: fixedEncodeURIComponent(email_address),
          fileName: new_file_name,
          assigner_email: fixedEncodeURIComponent(assigner_email),
          submission_date: moment(this.Submission_Date).format("MMMM Do"),
          submission_date_literal: this.Submission_Date,
          status: status,
          job_code: job_code
        };

        var view_edit_html =
          "<div class='link-edit-with-choice'>" +
          "<div class='link-edit-with-head'><i class='fa fa-edit' style='float: left; font-size: 25px; margin-top: 5px; margin-right: 6px; margin-left: 3px;'></i>" +
          "<span> View/Edit File</span>" +
          "<span class='subtitle'>" +
          assigned_manager_title +
          "</span>" +
          "</div>" +
          "<ul>" +
          "<li>" +
          "<a target='_blank' href='ms-word:ofe|u|https://mfc.sharepoint.com/sites/JobLibrary/Job_Description_Files/versions/" +
          new_file_name +
          "'>" +
          "<span class='link-edit-header UIfontbold'>Open in Word</span>" +
          "<span>Use the full functionality of Microsoft Word</span></li>" +
          "</a>" +
          "<li>" +
          "<a target='_blank' href='https://mfc.sharepoint.com/sites/JobLibrary/Job_Description_Files/versions/" +
          new_file_name +
          "?web=1'>" +
          "<span class='link-edit-header UIfontbold'>Open in browser</span>" +
          "<span>Make quick changes right here using Word Online</span>" +
          "</a>" +
          "</li>" +
          "</ul>" +
          "</div>";

        var li_html =
          "<li  data-filename='" +
          new_file_name +
          "'>" +
          "<div class='assignedmanager-list-head' >" +
          "<i class='fa fa-bars am-action-btns current' data-userKeys='" +
          JSON.stringify(assignedManager_info) +
          "' data-assigned_manager_id='" +
          assigned_manager_id +
          "' data-file_assignment_status='" +
          status +
          "' data-file_assignment_id='" +
          id +
          "' ></i>" +
          "<span style='margin-left:5px;display:block'>" +
          this.AssignedManager.Title +
          "</span>" +
          "<span style='margin-left:5px;display:block;font-size:11px;color:#656'>" +
          this.Department +
          "</span>" +
          "</div>" +
          "<div class='assignedmanager-list-body' style='line-height: 21px;'>" +
          "Assigned by: <strong>" +
          this.AssignedBy.Title +
          "</strong><br>" +
          "Date Assigned: <strong>" +
          moment(this.Created).format("LLLL") +
          "</strong><br>" +
          "Due Date: <strong>" +
          moment(this.Submission_Date).format("LLLL") +
          "</strong><br>" +
          "Status: <strong class='am-status_label'>" +
          status +
          "</strong><br>" +
          "</div>" +
          "<div class='assignedmanager-list-footer'>" +
          "<ul id='" +
          id +
          "'>" +
          "<li  class='' style='display:none' > <i data-assignedto-name='" +
          assigned_manager_title +
          "' data-mfcgd='" +
          mfcgd +
          "' data-title='" +
          this.Title +
          "' data-newfilename='" +
          new_file_name +
          "' class='fa fa-edit link-edit-file-with'></i>" +
          "</li>" +
          "<li data-assignedto-name='" +
          assigned_manager_title +
          "' class='show-comments-btn' data-assignedby-mfcgdid='" +
          assginedby_mfcgd +
          "' data-mfcgdid='" +
          mfcgd +
          "' data-filename='" +
          new_file_name +
          "' data-title='" +
          this.Title +
          "' ><i class='fa fa-comments' ></i></li>" +
          "<li class='' style='float:right;display:none'><i class='fa fa-times-circle' ></i></li>" +
          "</ul>" +
          "</div>" +
          "</li>";

        $("#assignedmanager-list").append(li_html);

        $("#assignedmanager-list strong").each(function() {
          if ($(this).text() == "Closed") $(this).css("color", "red");
          if ($(this).text() == "In-Progress") $(this).css("color", "#03A9F4");
          if ($(this).text() == "Unopened") $(this).css("color", "#b841b9");
          if ($(this).text() == "Submitted") {
            $(this)
              .parent()
              .parent()
              .find(".assignedmanager-list-footer > ul > li:nth-child(1)")
              .show();

            var popup_html =
              "<span class='link-edit-file-with'  style='color:#24b330'>Submitted </span>";

            $(this).html(popup_html);
          }
        });
      });

      if (data.d.results.length == 0) {
        var li_html =
          "<li style='padding:7px'>" +
          "<span style='color:#34a3da'><i style='font-size: 29px; float: left; margin-right: 10px; margin-left: 4px; margin-top: 3px;' class='fa fa-info-circle'></i>" +
          "There are no currently assigned manager to the selected file.</span><div style='clear:both'></div></li>";
        $("#assignedmanager-list").append(li_html);
      }
    },
    error: function(error) {
      $(".global-error-notification span").html(error);
      $(".global-error-notification")
        .fadeIn("slow")
        .animate(
          {
            opacity: 1.0
          },
          13500
        )
        .fadeOut("slow", function() {
          $(this).remove();
        });
    }
  });
} //load_assigned_managers

function load_assigned_managers_history(job_code) {
  $("#assignedmanager-list-history").html("");

  //var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*,AssignedManager/Title,AssignedBy/Title&$expand=AssignedManager/Id,AssignedBy/Id&$filter=Job_Code eq '" + job_code + "' and (Status eq 'Closed' or Status eq 'Deleted')";
  var url =
    "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*,AssignedManager/Name, AssignedManager/Id,AssignedManager/Title,AssignedManager/EMail,AssignedBy/Title, AssignedBy/Name, AssignedBy/EMail&$expand=AssignedManager/Id,AssignedBy/Id&" +
    "$filter=Job_Code eq '" +
    job_code +
    "' and (Status eq 'Closed' or Status eq 'Deleted')";
  $.ajax({
    url: _spPageContextInfo.webAbsoluteUrl + url,
    type: "GET",
    headers: {
      accept: "application/json;odata=verbose"
    },
    success: function(data) {
      $(".preloader_ajax").remove();

      $("#history_assigned_managers-count").text(
        "(" + data.d.results.length + ")"
      );

      $(data.d.results).each(function() {
        var id = this.ID;
        var new_file_name = this.New_File_Name;
        var assigned_manager_title = this.AssignedManager.Title;

        var mfcgd = this.AssignedManager.Name;

        var assigned_manager_id = this.AssignedManager.Id;

        var assginedby_mfcgd = this.AssignedBy.Name;

        var status = this.Status;

        var email_address = this.AssignedManager.EMail;
        var assigner_email = this.AssignedBy.EMail;

        var assignedManager_info = {
          id: id,
          userID: assigned_manager_id,
          displayName: fixedEncodeURIComponent(assigned_manager_title),
          emailAddress: fixedEncodeURIComponent(email_address),
          fileName: new_file_name,
          assigner_email: fixedEncodeURIComponent(assigner_email),
          submission_date: moment(this.Submission_Date).format("MMMM Do"),
          submission_date_literal: this.Submission_Date,
          status: status,
          job_code: job_code
        };

        var view_edit_html =
          "<div class='link-edit-with-choice'>" +
          "<div class='link-edit-with-head'><i class='fa fa-edit' style='float: left; font-size: 25px; margin-top: 5px; margin-right: 6px; margin-left: 3px;'></i>" +
          "<span> View/Edit File</span>" +
          "<span class='subtitle'>" +
          assigned_manager_title +
          "</span>" +
          "</div>" +
          "<ul>" +
          "<li>" +
          "<a target='_blank' href='ms-word:ofe|u|https://mfc.sharepoint.com/sites/JobLibrary/Job_Description_Files/versions/" +
          new_file_name +
          "'>" +
          "<span class='link-edit-header UIfontbold'>Open in Word</span>" +
          "<span>Use the full functionality of Microsoft Word</span></li>" +
          "</a>" +
          "<li>" +
          "<a target='_blank' href='https://mfc.sharepoint.com/sites/JobLibrary/Job_Description_Files/versions/" +
          new_file_name +
          "?web=1'>" +
          "<span class='link-edit-header UIfontbold'>Open in browser</span>" +
          "<span>Make quick changes right here using Word Online</span>" +
          "</a>" +
          "</li>" +
          "</ul>" +
          "</div>";

        var li_html =
          "<li  data-filename='" +
          new_file_name +
          "'>" +
          "<div class='assignedmanager-list-head' >" +
          "<i class='fa fa-bars am-action-btns history' data-userKeys='" +
          JSON.stringify(assignedManager_info) +
          "' data-assigned_manager_id='" +
          assigned_manager_id +
          "' data-file_assignment_status='" +
          status +
          "' data-file_assignment_id='" +
          id +
          "' ></i>" +
          "<i class='fa fa-user-circle'></i> " +
          this.AssignedManager.Title +
          "</div>" +
          "<div class='assignedmanager-list-body' style='line-height: 21px;'>" +
          "Assigned by: <strong>" +
          this.AssignedBy.Title +
          "</strong><br>" +
          "Date Assigned: <strong>" +
          moment(this.Created).format("LLLL") +
          "</strong><br>" +
          "Due Date: <strong>" +
          moment(this.Submission_Date).format("LLLL") +
          "</strong><br>" +
          "Status: <strong class='am-status_label'>" +
          status +
          "</strong><br>" +
          "</div>" +
          "<div class='assignedmanager-list-footer'>" +
          "<ul id='" +
          id +
          "'>" +
          "<li > <i data-assignedto-name='" +
          assigned_manager_title +
          "' data-mfcgd='" +
          mfcgd +
          "' data-title='" +
          this.Title +
          "' data-newfilename='" +
          new_file_name +
          "' class='fa fa-edit link-edit-file-with'></i>" +
          "</li>" +
          "<li data-assignedto-name='" +
          assigned_manager_title +
          "' class='show-comments-btn' data-assignedby-mfcgdid='" +
          assginedby_mfcgd +
          "' data-mfcgdid='" +
          mfcgd +
          "' data-filename='" +
          new_file_name +
          "' data-title='" +
          this.Title +
          "' ><i class='fa fa-comments' ></i></li>" +
          "<li class='' style='float:right;display:none'><i class='fa fa-times-circle' ></i></li>" +
          "</ul>" +
          "</div>" +
          "</li>";

        var li_html =
          "<li  data-filename='" +
          new_file_name +
          "'>" +
          "<div class='assignedmanager-list-head' >" +
          "<i class='fa fa-bars am-action-btns history' data-userKeys='" +
          JSON.stringify(assignedManager_info) +
          "' data-assigned_manager_id='" +
          assigned_manager_id +
          "' data-file_assignment_status='" +
          status +
          "' data-file_assignment_id='" +
          id +
          "' ></i>" +
          "<span style='margin-left:5px;display:block'>" +
          this.AssignedManager.Title +
          "</span>" +
          "<span style='margin-left:5px;display:block;font-size:11px;color:#656'>" +
          this.Department +
          "</span>" +
          "</div>" +
          "<div class='assignedmanager-list-body' style='line-height: 21px;'>" +
          "Assigned by: <strong>" +
          this.AssignedBy.Title +
          "</strong><br>" +
          "Date Assigned: <strong>" +
          moment(this.Created).format("LLLL") +
          "</strong><br>" +
          "Due Date: <strong>" +
          moment(this.Submission_Date).format("LLLL") +
          "</strong><br>" +
          "Status: <strong class='am-status_label'>" +
          status +
          "</strong><br>" +
          "</div>" +
          "<div class='assignedmanager-list-footer'>" +
          "<ul id='" +
          id +
          "'>" +
          "<li > <i data-assignedto-name='" +
          assigned_manager_title +
          "' data-mfcgd='" +
          mfcgd +
          "' data-title='" +
          this.Title +
          "' data-newfilename='" +
          new_file_name +
          "' class='fa fa-edit link-edit-file-with'></i>" +
          "</li>" +
          "<li data-assignedto-name='" +
          assigned_manager_title +
          "' class='show-comments-btn' data-assignedby-mfcgdid='" +
          assginedby_mfcgd +
          "' data-mfcgdid='" +
          mfcgd +
          "' data-filename='" +
          new_file_name +
          "' data-title='" +
          this.Title +
          "' ><i class='fa fa-comments' ></i></li>" +
          "<li class='' style='float:right;display:none'><i class='fa fa-times-circle' ></i></li>" +
          "</ul>" +
          "</div>" +
          "</li>";

        $("#assignedmanager-list-history").append(li_html);

        $("#assignedmanager-list-history strong").each(function() {
          if ($(this).text() == "Closed") $(this).css("color", "red");
          if ($(this).text() == "Unopened") $(this).css("color", "#b841b9");
        });
      });

      if (data.d.results.length == 0) {
        var li_html =
          "<li style='padding:7px'>" +
          "<span style='color:#34a3da'><i style='font-size: 29px; float: left; margin-right: 10px; margin-left: 4px; margin-top: 3px;' class='fa fa-info-circle'></i>" +
          "There are no currently assigned manager to the selected file.</span><div style='clear:both'></div></li>";
        $("#assignedmanager-list-history").append(li_html);
      }
    },
    error: function(error) {
      $(".global-error-notification span").html(error);
      $(".global-error-notification")
        .fadeIn("slow")
        .animate(
          {
            opacity: 1.0
          },
          13500
        )
        .fadeOut("slow", function() {
          $(this).remove();
        });
    }
  });
} //load_assigned_managers_history
