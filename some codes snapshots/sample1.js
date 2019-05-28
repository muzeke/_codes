//initializing synchoronous get access type of user
getAccessType.init();


var runManagerSubmissions_data = true;
var runSupport_data = true;



var getToBCCdPeoples = {
    ajaxSettings: {
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/Web/Lists/GetByTitle('Email_Notification_People')/Items?$select=*,Name/EMail, Name/Title&$expand=Name&$top=5000",
        headers: {
            "accept": "application/json;odata=verbose"
        }
    },
    init: function(elementName) {
        getToBCCdPeoples.ajaxSettings.success = function(data) {
            getToBCCdPeoples.processData(data.d.results, elementName);
        }
        return $.ajax(getToBCCdPeoples.ajaxSettings);
    },
    processData: function(items, elementName) {
        var data = [];
        var counter = [];
        $(items).each(function(i) {

            counter.push(i + 1);

            var obj = {};
            obj.id = this.Id;
            obj.text = this.Name.Title;
            obj.emailAddress = this.Name.EMail;

            data.push(obj);
        });

        $("#" + elementName).select2({
            placeholder: "Email Notification CC'd Peoples",
            data: data
        });

        //$("#htmlemail-bccd-select").val(counter).trigger('change');
    }
};



var AssignManagerSelection = (function() {


    var ajaxSettings = {
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/Web/Lists/GetByTitle('Access_List')/Items?$select=*,Admin_Name/Title,Admin_Name/EMail&$expand=Admin_Name",
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {
            ajaxSuccess(data);
        }
    }

    var loadAdmins = function() {
        return $.ajax(ajaxSettings);
    }

    function ajaxSuccess(data) {
        var select2Data = [];

        var selectedManagerDefaultId = _spPageContextInfo.userId;

        $(data.d.results).each(function() {
            //console.log(this.Admin_Name.Title + " - " + this.Id);
            var selectObj = {};
            selectObj.id = this.Admin_NameId;
            selectObj.text = this.Admin_Name.Title;
            selectObj.email = this.Admin_Name.EMail;
            select2Data.push(selectObj);

        });

        $('#select-assignmanagerName').empty();

        $('#select-assignmanagerName').select2({
            placeholder: "by Assigned Manager",
            data: select2Data
        });

        $('#select-assignmanagerName').val(selectedManagerDefaultId).trigger("change");

    }

    var load = function() {
        /* if (_spPageContextInfo.JD_CurrentAdmin_Access_type == "Admin Full Access") {
             $("#assignManager-div").show();

         } else {
             $("#assignManager-div").remove();
             return;
         }*/

        $("#assignManager-div").show();

        loadAdmins();

    }

    return {
        load: load
    }

})();




function ajaxFailureError(error) {

    var url = "/_api/Web/Lists/GetByTitle('Error_Log_History')/Items";

    var data = {
        __metadata: {
            'type': 'SP.Data.Error_x005f_Log_x005f_HistoryListItem'
        },
        Title: 'Error Log',
        Error_Short_Value: error.responseJSON.error.message.value,
        Error_Description: JSON.stringify(error),
        Date_Occured: moment(),
        Triggered_By_UserId: _spPageContextInfo.userId
    };

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "POST",
        headers: {
            "accept": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            "content-Type": "application/json;odata=verbose"
        },
        data: JSON.stringify(data),
        success: function(data) {
            //console.log("An error has occured, saved on error logs");
        },
        error: function(error) {
            alert(JSON.stringify(error));
        }
    });

} //

function deleteJDF(job_code) {

    //DELETE on JDF DL
    //get all to delete items file name

    var call = $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/Web/Lists/GetByTitle('Job_Description_Files')/Items?$select=*,FileLeafRef&$filter=Job_Code eq '" + job_code + "'",
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        }
    });

    call.done(function(data) {

        var promises = [];

        $(data.d.results).each(function() {

            var filename = this.FileLeafRef;

            var siteUrl = _spPageContextInfo.webAbsoluteUrl;

            var webRelUrl = _spPageContextInfo.webServerRelativeUrl;

            if (this.Entry_Type == 0) {
                var fullUrl = siteUrl + "/_api/web/GetFileByServerRelativeUrl('" + webRelUrl + "/Job_Description_Files/versions/" + filename + "')";
            } else {
                var fullUrl = siteUrl + "/_api/web/GetFileByServerRelativeUrl('" + webRelUrl + "/Job_Description_Files/" + filename + "')";
            }


            var promise = deleteFileFromJDF(fullUrl, filename);

            promises.push(promise);
        });

        $.when.apply($, promises).done(function() {
            //deleting of jdf's done 
            // console.log("DELETING from JDF done");

            var c = $.ajax({
                url: _spPageContextInfo.webAbsoluteUrl + "/_api/Web/Lists/GetByTitle('File_Assignments')/Items?$select=*&$filter=Job_Code eq '" + job_code + "'",
                type: "GET",
                headers: {
                    "accept": "application/json;odata=verbose",
                }
            });

            c.done(function(data) {

                var promises = [];

                $(data.d.results).each(function() {
                    //  console.log(this.Id);
                    var promise = deleteRowsFromFileAssignments(this.Id);

                    promises.push(promise);
                });


                $.when.apply($, promises).done(function() {
                    alert("DELETE of FIle Assignments Done");
                });

            });
        }); //when apply


    }); //call.done

    function deleteFileFromJDF(url, filename) {

        return $.ajax({
            url: url,
            type: "POST",
            headers: {
                "accept": "application/json;odata=verbose",
                "content-type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "X-HTTP-Method": "DELETE",
                "IF-MATCH": "*"
            },
            success: function(data) {
                //   console.log("A FILE HAS BEEN DELETED !!!!!!! => " + filename + " URI : " + url);
            },
            error: function(error) {
                ajaxFailureError(error);
            }

        });
    }

    function deleteRowsFromFileAssignments(id) {

        return $.ajax({
            url: _spPageContextInfo.webAbsoluteUrl + "/_api/Web/Lists/GetByTitle('File_Assignments')/getItemById('" + id + "')",
            type: "DELETE",
            headers: {
                "accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "If-Match": "*"
            },
            success: function(data) {
                // console.log("A ROW HAS BEEN DELETED !!!!!!! => " + id);
            },
            error: function(error) {
                ajaxFailureError(error);
            }
        }); //ajax call
    };

} //



$(document).ready(function() {


    //if(_spPageContextInfo.userId  == 26) $("#chatSupportBox").show();




    //
    //;
    //  
    //



    //load Datatable first

    /**
     * Loading of Ajax Data, section by section
     *  Step 1: Load Datatable   
     *  Step 2: Load Filters
     *  Step 3: Load Manager Submissions
     *  Step 4: Load Manager Deadlines
     *  Step 5: Load Support Box
     */

    //STEP 1
    function progressAdd(num) {

        var $progressBar = document.getElementById("zProgress");
        if ($progressBar.style.width == "") $progressBar.style.width = "0%";
        console.log($progressBar.style.width);

        $progressBar.style.width = parseInt(parseInt($progressBar.style.width) + num) + "%";
        console.log($progressBar.style.width);

        /*$("#zProgress").animate({
      width:parseInt(parseInt($progressBar.style.width) + num) + "%",
   }, 500);
*/
    }


    //load all contents
    recursive_load_datatable("", "", []).then(function() {

        progressAdd(20);
        //STEP 2 -> Also Loads all require javascripts using require js
        require(['https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/javascripts/home-filterdatatable.js',
            'https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/javascripts/home-managersubmission.js',
            'https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/javascripts/home-managerdeadlines.js',
            'https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/javascripts/home-supportcodes.js'
        ], function() {


            FilterDatatable.init().then(function() {

                progressAdd(20);
                //STEP 3
                return $("#managerSubmission-notifBox").parent().parent().preLoad(ManagerSubmissions.showManagerSubmissions(), {
                    returnPromise: true
                });

            }).then(function() {
                progressAdd(20);
                //STEP 4
                return $("#managerDeadlines-notifBox").parent().parent().preLoad(ManagerDeadlines.init(), {
                    returnPromise: true
                });

            }).then(function() {
                progressAdd(20);
                //STEP 5
                SupportNotificationBox.bindButtonEvents();

                pollForNewUpdatesInJDBoxes.SNB_poll();
                pollForNewUpdatesInJDBoxes.MD_poll();
                pollForNewUpdatesInJDBoxes.MS_poll();

                $(".job-card-body").slideToggle();
                $("i.fa.fa-chevron-circle-up").fadeIn();

                return $("#supportChat-notifBox").parent().parent().preLoad(SupportNotificationBox.showSupportNotificationBoxes(), {
                    returnPromise: true
                });
            }).then(function() {

                progressAdd(20);

                $("#zProgress").animate({
                    opacity: 100
                }, 3000, function() {
                    $(this).fadeOut("1000");
                });

            });

        });

    });



    var themer = '<select id="pageTheme">' +
        '<option value="light" selected="">Light</option>' +
        '<option value="dark">Dark</option>' +
        '<option value="manulife">Manulife</option>' +
        '<option value="random">Random</option>' +
        '</select>';

    $("#s4-ribboncont .ms-cui-topBar1").append(themer);

    $("body").on("change", "#pageTheme", function() {

        $("#s4-bodyContainer").removeClass();

        var theme = $(this).val();

        if (theme == "random") {
            $("#s4-bodyContainer").css("background", getRandomColor());
        } else {
            $("#s4-bodyContainer").addClass(theme + "Theme");
        }



    });

    //console.log("TH " + addFilterDependsOnAccessType.getQuery());



    $("body").on("click", ".dropdownButton", function() {
        $(this).parent().parent().parent().find(".notifBox-itemBody").slideToggle();
    });

    /*runManagerSubmissions_data = false;
    runSupport_data = false;*/



    //Update form digest 

    /*__autoRunAtFirst_updatesAllAssignedManagers_column();

    return true;*/

    setInterval(function() {
        UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval);
    }, 5 * 60000);


    $(".dt-buttons").css("display", "none");

    $("body").on("click", "#btn-toggleResourceLinks", function() {

        $(".jd-resourceLinks").slideToggle();
        load_ResourcesDatatable(); //LATER CALL
    });




    //filter_datatable();

    $("title").text("Job Library");

    __body_mouseupevent();

    $("body").on("click", "#btn-advancedfilter", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);


        var _icon = $(this).find("i");


        if (_icon.hasClass("fa-chevron-up")) {
            _icon.removeClass();
            _icon.addClass("fa fa-chevron-down");
        } else {
            _icon.removeClass();
            _icon.addClass("fa fa-chevron-up");
        }

        $("#filter-jd-advanced").slideToggle();

        //console.log($("#select_filter-job_family").val());
    });




    //__load_datatable();



    assignmanager_init(); //NO ajax call on LOAD

    scroll_then_fixed();


    $("body").on("click", "#btn-toggleAllCards", function() {



        var current_element = $(this);
        var ctr = 0;

        $(".job-card-body").each(function() {



            if ($(this).is(":visible")) {
                ctr++;

            }
        });


        if (ctr >= 2) {
            $(".job-card-body:visible").slideToggle();
        } else {
            $(".job-card-body:not(:visible)").slideToggle();
        }



    });


    $("body").on("click", ".card-dropdown", function() {

        $(this).parent().parent().find(".job-card-body").slideToggle();

        var __class = "fa-chevron-circle-down";

        if ($(this).find("i").hasClass("fa-chevron-circle-down")) {
            __class = "fa-chevron-circle-up";
        }

        $(this).find('i').removeClass();

        $(this).find('i').addClass("fa");
        $(this).find('i').addClass(__class);
    });

    $("body").on("click", "ul.jd-box-tabs li", function() {

        var _selector = $(this).attr("id");

        $("ul.jd-box-tabs li").removeClass("active");

        $(this).addClass("active");

        $(".jd-box-tabcontrol").hide();

        $(this).parent().parent().find("[data-tab='" + _selector + "']").show();
        //$(".jd-box-tabcontrol [data-tab='"+ _selector +"']").show();

    });

    $("body").on("click", ".jd-box-left .jd-box-header", function() {
        $(this).parent().find(".jd-box-body").slideToggle();
    });


    $("body").on("click", "#jd-btn-upload", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        $(this).find(".jd-dropdown-wrapper").toggle();


    });

    $("body").on("click", "#btn-excel-export", function() {
        $(".buttons-excel").click();
    });

    $("body").on("change", "#select_final_version-edit", function() {

        var final_version = $("#select_final_version-edit").val();

        if (final_version == "Yes") {
            $("#last_evaluated-edit").prop("disabled", false);

        } else {

            $("#last_evaluated-edit").val("");
            $("#last_evaluated-edit").prop("disabled", true);

        }

    });


    $("body").on("click", "#jd-btn-action", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        $(this).find(".jd-dropdown-wrapper").toggle();
    });

    $("body").on("click", "#btn-upload-single", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        $(".options-removable").remove();

        __loadUploadSelections("Job_Family_Group", "select_job_family_group");

        __loadUploadSelections("Country", "select_country");
        __loadUploadSelections("File_Type", "select_file_type");
        __loadUploadSelections("Final_Version", "select_final_version");
        __loadUploadSelections("Exemption_Status", "select_exemption_status");
        __loadUploadSelections("Career_Path", "select_career_path");

        $("#upload-new-modal").iziModal("open");
    });

    $("body").on("click", "#btn-upload-multiple", function() {
        event.preventDefault ? event.preventDefault() : (event.returnValue = false);
        $("#uploadmultiple-new-modal").iziModal("open");
    });



    $("body").on("click", "#btn-delete-jd", function() {
        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        var deleteItem = confirm("Are you sure you want to delete this file?" + '\n' + "NOTE: You cannot undo this operation.")

        if (deleteItem) {
            var job_code = $("#jd-datatable tr.active-row").attr("data-job_code_value");
            deleteJDF(job_code);
        }

    }); //btn delete jd


    $("body").on("click", "#btn-edit-jd", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);


        $("#last_evaluated-edit").datepicker({
            dateFormat: 'MM dd, yy'
        });


        $("#edit-jd-modal-content").show();

        $("#update-success-edit-jd").remove();

        $("#btn-update-edit").prop("disabled", false);

        $("#select_job_family_group-edit").html("");

        $("#select_job_family-edit").html("");

        $("#select_career_path-edit").html("");

        $("#select_country-edit").html("");

        $("#select_file_type-edit").html("");

        $("#select_exemption_status-edit").html("");

        $("#select_final_version-edit").html("");

        $("#last_evaluated-edit").val("");

        var id = $(this).attr("data-ID");

        var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/Items?$select=*,FileLeafRef&$filter=ID eq " + id;

        $.ajax({
            url: _spPageContextInfo.webAbsoluteUrl + url,
            type: "GET",
            headers: {
                "accept": "application/json;odata=verbose",
            },
            success: function(data) {
                //  console.log(data.d.results);

                var node = data.d.results[0];
                /*alert(node.Job_Title);*/
                $("#text_job_title-edit").val(node.Title);

                $("#text_job_code-edit").val(node.Job_Code);

                $("#text_job_grade-edit").val(node.Job_Grade);

                $("#selectedJobfilename-edit").text(node.FileLeafRef);


                var last_evaluated = node.Last_Evaluated;
                if (last_evaluated == "" || last_evaluated == null) {
                    last_evaluated = "";
                } else {
                    last_evaluated = moment(node.Last_Evaluated).format('LL')
                }




                $("#last_evaluated-edit").val(last_evaluated);

                //$("#select_job_family-edit").append("<option value='"+ node.Job_Family +"' selected>"+ node.Job_Family +"</option>");
                var _promises = [];
                loadSelectedJobFamily(node.Job_Family_Group, _promises);
                $.when.apply($, _promises)
                    .done(function(data) {
                        $("#select_job_family-edit option").each(function() {


                            if ($(this).val() == node.Job_Family) {
                                $(this).prop("selected", true);
                                $("#select_job_family-edit").select2({
                                    width: '100%'
                                });
                            }
                        })

                    });

                $("#select_exemption_status-edit").append("<option disabled selected></option>");

                __loadUploadSelections("Job_Family_Group", "select_job_family_group-edit", node.Job_Family_Group);
                __loadUploadSelections("Country", "select_country-edit", node.Country);
                __loadUploadSelections("File_Type", "select_file_type-edit", node.File_Type);

                var promises = [];
                __loadUploadSelections("Final_Version", "select_final_version-edit", node.Final_Version, promises);

                $.when.apply($, promises).done(function() {
                    var final_version = $("#select_final_version-edit").val();
                    if (final_version == "Yes") {
                        $("#last_evaluated-edit").prop("disabled", false);

                    } else {
                        $("#last_evaluated-edit").prop("disabled", true);

                    }
                });

                __loadUploadSelections("Exemption_Status", "select_exemption_status-edit", node.Exemption_Status);
                __loadUploadSelections("Career_Path", "select_career_path-edit", node.Career_Path);




            },
            error: function(error) {
                $(".global-error-notification span").html(error);
                $(".global-error-notification").fadeIn('slow')
                    .animate({
                        opacity: 1.0
                    }, 13500)
                    .fadeOut('slow', function() {
                        $(this).remove();
                    });
            }
        });

        $("#select_job_family_group-edit").select2({
            width: '100%'
        });

        $("#select_career_path-edit").select2({
            width: '100%'
        });

        $("#select_country-edit").select2({
            width: '100%'
        });

        $("#select_file_type-edit").select2({
            width: '100%'
        });

        $("#select_exemption_status-edit").select2({
            width: '100%'
        });

        $("#select_final_version-edit").select2({
            width: '100%'
        });


        $("#edit-jd-modal").iziModal("open");
    });
    //modal init
    $("#upload-new-modal").iziModal({
        title: 'SharePoint Online Job Description Library - File Upload',
        subtitle: 'Upload a file',
        width: '65%',
        top: null,
        fullscreen: true,
        closeOnEscape: true
    });

    $("#uploadmultiple-new-modal").iziModal({
        title: 'SharePoint Online Job Description Library - Multiple File Upload',
        subtitle: 'Upload files',
        width: '65%',
        top: null,
        fullscreen: true,
        closeOnEscape: true
    });

    $("#edit-jd-modal").iziModal({
        title: 'SharePoint Online Job Description Libray - Edit',
        subtitle: 'Edit File Selected',
        width: '65%',
        top: null,
        fullscreen: true,
        closeButton: true,
        overlayClose: false
    });


    $("#notifyManager-modal").iziModal({
        title: 'Notify Manager',
        subtitle: 'Send Email Notification to Manager',
        width: '65%',
        top: null,
        fullscreen: true,
        closeOnEscape: true
    });




    /*$("#modal-assign-newmanager").iziModal({
         title: 'Assign New Manager',
         subtitle: 'Assign a manager in the document selected',
         width: '65%',
         top: null,
         fullscreen: true,
         closeOnEscape: true
      });*/




    var timer;

    $("input#text_job_code").on('keyup', function() {

        var jobcode = $(this).val();
        var element = $(this);

        $("#btn-upload").prop("disabled", true);

        clearTimeout(timer); //clear any running timeout on key up

        timer = setTimeout(function() {
            var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/Items?$filter=Entry_Type eq '1' and Job_Code eq '" + jobcode + "'";

            __check_if_typed_jobcode_exists(jobcode, element, url);

            check_job_code_autofill(jobcode, "");

        }, 400);
    });

    $("input#text_job_code-edit").on('keyup', function() {

        var jobcode = $(this).val();
        var element = $(this);
        var job_code_viewed = $("#job_details-code").text();

        $("#btn-update-edit").prop("disabled", true);

        clearTimeout(timer); //clear any running timeout on key up
        timer = setTimeout(function() {

            var jobcodeexists = job_code_viewed.trim().toUpperCase() == jobcode.trim().toUpperCase();

            if (jobcodeexists) {
                $(element).css("border", "1px solid #ababab");
                $(element).attr("data-validation-state", "true");
                $(".error-msg2").remove();
                return;
            }

            var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/Items?$filter=Job_Code eq '" + jobcode + "'";

            __check_if_typed_jobcode_exists(jobcode, element, url);

            //check_job_code_autofill(jobcode,"-edit");

        }, 400);
    });



    $("body").on("click", "#btn-clear-uploadfields", function() {
        __clear_uploadfile_fields();
    });

    $("body").on("click", "#btn-upload", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        var __validationdone = true;
        var file_type = $("#select_file_type").val();

        if (file_type == "Job Family Matrix") {
            $("#text_job_grade").attr("data-validation", "unrequired");
            $("#text_job_code").attr("data-validation", "required");
            $("#text_job_title").attr("data-validation", "required");
            $("#select_job_family_group").attr("data-validation", "unrequired");
            $("#select_job_family").attr("data-validation", "unrequired");
            $("#select_career_path").attr("data-validation", "unrequired");
            $("#select_country").attr("data-validation", "required");
            $("#select_final_version").attr("data-validation", "required");

        } else {
            $("#text_job_grade").attr("data-validation", "required");
            $("#text_job_code").attr("data-validation", "required");
            $("#text_job_title").attr("data-validation", "required");
            $("#select_job_family_group").attr("data-validation", "required");
            $("#select_job_family").attr("data-validation", "required");
            $("#select_career_path").attr("data-validation", "unrequired");
            $("#select_country").attr("data-validation", "required");
            $("#select_final_version").attr("data-validation", "required");


        }

        $(".jd-upload-box-wrapper").find("input[type='text']").each(function() {
            if ($(this).val().trim() == "" && $(this).attr("data-validation") != "unrequired") {

                $(this).css("border", "1px solid #f00");
                __validationdone = false;
            } else {
                $(this).css("border", "1px solid #ababab");
            }
        });

        $(".jd-upload-box-wrapper").find("select").each(function() {
            if ($(this).val() == null && $(this).attr("data-validation") != "unrequired") {
                //   console.log($(this));
                __validationdone = false;

                $(this).parent().find("span.select2-container--default .select2-selection--single").css("border", "1px solid #f00");

            } else {
                $(this).parent().find("span.select2-container--default .select2-selection--single").css("border", "1px solid #ababab");
            }
        });


        if (!__validationdone || $("#text_job_code").attr("data-validation-state") == "false" || $("#text_job_code").attr("data-validation-state") == "false") {
            return true;
        }


        $("#btn-upload").prop("disabled", true);
        $("#btn-upload").text("Uploading File and Saving metadata..");

        var files = $(".input-ghost")[0].files;


        uploadFiles(files[0]); // uploading singe file


    });


    //edit job description save button 
    $("body").on("click", "#btn-update-edit", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        var __validationdone = true;
        var file_type = $("#select_file_type-edit").val();

        if (file_type == "Job Family Matrix") {
            $("#text_job_grade-edit").attr("data-validation", "unrequired");
            $("#text_job_code-edit").attr("data-validation", "required");
            $("#text_job_title-edit").attr("data-validation", "required");
            $("#select_job_family_group-edit").attr("data-validation", "unrequired");
            $("#select_job_family-edit").attr("data-validation", "unrequired");
            $("#select_career_path-edit").attr("data-validation", "unrequired");
            $("#select_country-edit").attr("data-validation", "required");
            $("#select_final_version-edit").attr("data-validation", "required");


        } else {
            $("#text_job_grade-edit").attr("data-validation", "required");
            $("#text_job_code-edit").attr("data-validation", "required");
            $("#text_job_title-edit").attr("data-validation", "required");
            $("#select_job_family_group-edit").attr("data-validation", "required");
            $("#select_job_family-edit").attr("data-validation", "required");
            $("#select_career_path-edit").attr("data-validation", "required");
            $("#select_country-edit").attr("data-validation", "required");
            $("#select_final_version-edit").attr("data-validation", "required");
            $("#last_evaluated-edit").attr("data-validation", "unrequired");

        }

        $("#edit-jd-modal").find("input[type='text']").each(function() {
            if ($(this).val().trim() == "" && $(this).attr("data-validation") != "unrequired") {

                $(this).css("border", "1px solid #f00");
                __validationdone = false;
            } else {
                $(this).css("border", "1px solid #ababab");
            }
        });

        $("#edit-jd-modal").find("select").each(function() {
            if ($(this).val() == null && $(this).attr("data-validation") != "unrequired") {
                //console.log($(this));
                __validationdone = false;

                $(this).parent().find("span.select2-container--default .select2-selection--single").css("border", "1px solid #f00");

            } else {
                $(this).parent().find("span.select2-container--default .select2-selection--single").css("border", "1px solid #ababab");
            }
        });


        if (!__validationdone || $("#text_job_code-edit").attr("data-validation-state") == "false" || $("#text_job_code-edit").attr("data-validation-state") == "false") {
            return true;
        }

        var result = confirm("Are you sure you want to update this entry?" + '\n' + "NOTE: You cannot undo this operation.");

        if (result) {


            var old_job_code = $("#jd-datatable tr.active-row").attr("data-job_code_value");

            var isJobCodeChanged = old_job_code.trim().toUpperCase() !== $("#text_job_code-edit").val().trim().toUpperCase();


            var job_title = $("#text_job_title-edit").val();
            var job_code = $("#text_job_code-edit").val();
            var job_grade = $("#text_job_grade-edit").val();
            var job_family_group = $("#select_job_family_group-edit").val();
            var job_family = $("#select_job_family-edit").val();
            var career_path = $("#select_career_path-edit").val();
            var country = $("#select_country-edit").val();
            var file_type = $("#select_file_type-edit").val();
            var exemption_status = $("#select_exemption_status-edit").val();
            var final_version = $("#select_final_version-edit").val();
            var last_evaluated = $("#last_evaluated-edit").val();

            var Updated_data = {
                __metadata: {
                    "type": "SP.Data.Job_x005f_Description_x005f_FilesItem"
                },
                Title: job_title,
                Job_Grade: job_grade,
                Job_Code: job_code,
                Job_Family_Group: job_family_group,
                Job_Family: job_family,
                Career_Path: career_path,
                Country: country,
                File_Type: file_type,
                Exemption_Status: exemption_status,
                Final_Version: final_version
            }

            if (last_evaluated.trim() == "") {
                last_evaluated = null;
            }
            Updated_data.Last_Evaluated = last_evaluated;


            var jdf_assigned_manager_status = $("#jd-datatable tr.active-row td:nth-child(8)").text();

            var table = $("#jd-datatable").DataTable();
            var currentrow = $("#jd-datatable tr.active-row");

            if (jdf_assigned_manager_status != "Open") {

                if (final_version == "Yes") {



                    if (last_evaluated == null) {
                        Updated_data.Assigned_Managers = "Final Version";
                        table.row(currentrow).data().Assigned_Managers = "Final Version";
                    } else {
                        Updated_data.Assigned_Managers = "Evaluated";
                        table.row(currentrow).data().Assigned_Managers = "Evaluated";
                    }

                    table.row(currentrow).invalidate();
                    table.draw();

                } else {


                    var currentItems_count = parseInt($("#current_assigned_managers-count").text().replace(/\D/g, ''));
                    var historyItems_count = parseInt($("#history_assigned_managers-count").text().replace(/\D/g, ''));

                    if (historyItems_count > 0) {
                        Updated_data.Assigned_Managers = "Closed";
                        table.row(currentrow).data().Assigned_Managers = "Closed";
                    } else {
                        Updated_data.Assigned_Managers = "";
                        table.row(currentrow).data().Assigned_Managers = "";
                    }

                    table.row(currentrow).invalidate();
                    table.draw();

                }

            }

            /*   console.log('Job_Title = '+job_title+ '\n' + 
              'Job_Grade = '+job_code+  '\n' + 
              'Job_Code = '+job_grade+ '\n' +  
              'Job_Family_Group = '+job_family_group+ '\n' +  
              'Job_Family = '+job_family+ '\n' +  
              'Career_Path = '+career_path+ '\n' +  
              'Country = '+country+ '\n' +  
              'File_Type = '+file_type+ '\n' +  
              'Exemption_Status = '+exemption_status+ '\n' +  
              'Final_Version = '+final_version);*/

            var promises = [];

            update_jobdescription_selected(old_job_code, Updated_data, promises);


            if (isJobCodeChanged) {

                //update job description selected
                //updated data to pass
                var promises2 = [];

                var Updated_data = {
                    __metadata: {
                        'type': 'SP.Data.File_x005f_AssignmentsListItem'
                    },
                    Job_Code: job_code
                }

                update_file_assignments_with_job_code(old_job_code, Updated_data, promises2);

            }

            //if jc change 2 ajax calls other wise , 1 ajax call only


            $("#btn-update-edit").prop("disabled", true);
        }



    }); // $("body").on("click", "#btn-upload"

    bs_input_file();


    datatable_init_buttons();

    $("#select_job_family_group").select2({
        width: '100%'
    });

    $("#select_career_path").select2({
        width: '100%'
    });

    $("#select_country").select2({
        width: '100%'
    });

    $("#select_file_type").select2({
        width: '100%'
    });

    $("#select_exemption_status").select2({
        width: '100%'
    });

    $("#select_final_version").select2({
        width: '100%'
    });


    $('#select_file_type').on('change', function() {
        if ($(this).val() == "Job Family Matrix") {
            $("#text_job_title").parent().find("label").text("Family Title*")
            $("#select_career_path").parent().hide();
            $("#select_exemption_status").parent().hide();

        } else {


            $("#text_job_title").parent().find("label").text("Job Title*")
            $("#select_career_path").parent().show();
            $("#select_exemption_status").parent().show();


        }


    });

    $('#select_country').on('change', function() {

        if ($(this).val() == null) return;

        var country = $(this).val();
        if (country.trim().toUpperCase() == "UNITED STATES OF AMERICA") {

            $("#select_exemption_status").attr("data-validation", "required");

        } else {

            $("#select_exemption_status").attr("data-validation", "unrequired");
        }
    });

    $('#select_country-edit').on('change', function() {

        if ($(this).val() == null) return;

        var country = $(this).val();
        if (country.trim().toUpperCase() == "UNITED STATES OF AMERICA") {

            $("#select_exemption_status-edit").attr("data-validation", "required");

        } else {

            $("#select_exemption_status-edit").attr("data-validation", "unrequired");
        }
    });



    $('#select_job_family_group').on('change', function() {

        var selectedJobFamilyGroup = this.value;

        var _promises = [];
        loadSelectedJobFamily(selectedJobFamilyGroup, _promises);
    });

    $('#select_job_family_group-edit').on('change', function() {
        var selectedJobFamilyGroup = this.value;

        var _promises = [];
        loadSelectedJobFamily(selectedJobFamilyGroup, _promises);
    });


    $("body").on("click", ".link-edit-file-with", function(e) {
        event.preventDefault ? event.preventDefault() : (event.returnValue = false);



        $(".link-edit-with-choice").css("top", (e.pageY + $('#s4-workspace').scrollTop()) - 75);
        $(".link-edit-with-choice").css("left", e.pageX - 10);

        $("#link_edit-inword").attr("href", "ms-word:ofe|u|https://mfc.sharepoint.com/sites/JobLibrary/Job_Description_Files/versions/" + $(this).attr("data-newfilename"));
        $("#link_edit-inbrowser").attr("href", "https://mfc.sharepoint.com/sites/JobLibrary/Job_Description_Files/versions/" + $(this).attr("data-newfilename") + "?web=1");

        var mfcgd = $(this).attr("data-mfcgd");

        $(".link-edit-with-head > img").attr("src", getSharepointUserPhoto(mfcgd));
        $(".link-edit-with-head > #link_edit-title").text($(this).attr("data-title"));
        $(".link-edit-with-head > #link_edit-assignedto").text($(this).attr("data-assignedto-name"));

        $(".link-edit-with-choice").fadeIn();



    });




    $("body").on("click", ".link-close-file", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);
        var result = confirm("Are you sure you want to closed this entry?" + '\n' + "NOTE: You cannot undo this operation.");
        if (result) {

            var id = $(this).attr("data-id");
            var status = $(this).attr("data-status");
            var filename = $(this).attr("data-filename");

            var updatedStatus = "Closed";

            var currentItems_count = parseInt($("#current_assigned_managers-count").text().replace(/\D/g, ''));
            var historyItems_count = parseInt($("#history_assigned_managers-count").text().replace(/\D/g, ''));
            var table = $("#jd-datatable").DataTable();
            var currentrow = $("#jd-datatable tr.active-row");

            if (status == "Unopened") {

                updatedStatus = "Deleted";

                var deleteCall = _delete_selected_file(id, filename);

                $("#s4-workspace").preLoad(deleteCall, {
                    backgroundImage: 'url("https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/preloaders/preloader_rotating.gif")',
                    position: "fixed"
                });


            } else {

                var deleteCall = _closed_selected_file(id, updatedStatus);

                $("#s4-workspace").preLoad(deleteCall, {
                    backgroundImage: 'url("https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/preloaders/preloader_rotating.gif")',
                    position: "fixed"
                });

                historyItems_count += 1;
            }

            currentItems_count -= 1; //because we are deleting/closing an item

            if (currentItems_count == 0 && historyItems_count == 0) {

                if ($("#job_info-final_version").text() == "Yes") {
                    table.row(currentrow).data().Assigned_Managers = "Final Version";

                } else {
                    table.row(currentrow).data().Assigned_Managers = "";
                }


            } else if (historyItems_count > 0) {

                if ($("#job_info-final_version").text() == "Yes") {
                    table.row(currentrow).data().Assigned_Managers = "Final Version";

                } else {
                    table.row(currentrow).data().Assigned_Managers = "Closed";
                }

            }

            table.row(currentrow).invalidate();
            table.draw();


            var job_code = $("#jd-datatable tr.active-row").attr("data-job_code_value");
            var jdf_id = $("#jd-datatable tr.active-row").attr("id").replace(/\D/g, '');




            //run script here
        }

    }); // $("body").on("click", ".link-close-file", function(){

    $("body").on("click", "#btn-reassign_file", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        var loading_html = "<img src='https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/preloaders/preloader_save.gif'> " +
            "<strong>Saving Entry...</strong> File is being duplicated through the system. Please wait...";
        $("#assigning-status").html(loading_html);
        $("#assigning-status").hide();

        $("#assigning-status").removeClass("alert-success");
        $("#assigning-status").addClass("alert-info");

        $("#assign-upper-body").show();

        $("#btn-submitassignment").prop("disabled", true);



        var id = $("#jd-datatable tr.active-row").attr("id").replace(/\D/g, '');


        var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/items?$select=*,FileLeafRef,Editor/Title&$expand=Editor/Id&$filter=ID eq " + id;

        $.ajax({
            url: _spPageContextInfo.webAbsoluteUrl + url,
            type: "GET",
            headers: {
                "accept": "application/json;odata=verbose",
            },
            success: function(data) {
                $(data.d.results).each(function() {
                    $("#job_code-assign").val(this.Job_Code);
                    $("#job_title-assign").val(this.Title);
                    $("#job_grade-assign").val(this.Job_Grade);
                    $("#filename-assign").val(this.FileLeafRef);
                });


            },
            error: function(error) {
                $(".global-error-notification span").html(error);
                $(".global-error-notification").fadeIn('slow')
                    .animate({
                        opacity: 1.0
                    }, 13500)
                    .fadeOut('slow', function() {
                        $(this).remove();
                    });
            }
        });

        $("#duedate-assign").datepicker({
            dateFormat: 'MM dd, yy',
            minDate: 0
        });

        $("#duedate-assign").val(moment().add(7, 'days').format("LL"));

        $("#modal-assign-newmanager").parent().show();

        $("#peoplePickerDiv").spPeoplePicker();

        var assignmentPeoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict.peoplePickerDiv_TopSpan;

        var userObj = {
            'Key': "JSebulino@manulife.com"
        };

        var userKeys = JSON.parse($(this).attr("data-userKeys"));

        //console.log(userKeys);
        var userEmail = {
            'Key': fixedDecodeUri(userKeys.emailAddress)
        };

        //console.log("BEFOREEEEEEEEE");

        //console.log(assignmentPeoplePicker);


        assignmentPeoplePicker.SetFocusOnEditorEnd();


        //so there are some issue with the people picker
        //the following are just workaround

        setTimeout(function() {
            //$("#modal-assign-newmanager .jd_box_assignnew-body").fadeIn();

            assignmentPeoplePicker.AddUnresolvedUser(userEmail, true);
        }, 1800);



        AssignManagerSelection.load();

        return; //stop here below code are old version

        var result = confirm("Are you sure you want to reassign this entry?" + '\n' + "NOTE: You cannot undo this operation.");

        if (result) {

            var id = $(this).attr("data-id");
            var UpdatedStatus = "Unopened";


            var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/getItemById('" + id + "')";

            //updated data to pass
            var data = {
                __metadata: {
                    'type': 'SP.Data.File_x005f_AssignmentsListItem'
                },
                Status: UpdatedStatus
            };

            $.ajax({
                url: _spPageContextInfo.webAbsoluteUrl + url,
                type: "PATCH",
                headers: {
                    "accept": "application/json;odata=verbose",
                    "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                    "content-Type": "application/json;odata=verbose",
                    "X-Http-Method": "PATCH",
                    "If-Match": "*"
                },
                data: JSON.stringify(data),
                success: function(data) {
                    /* console.log(data);*/
                    var job_code = $("#jd-datatable tr.active-row").attr("data-job_code_value");

                    alert("Entry has been successfully reassigned");

                    var job_code = $("#jd-datatable tr.active-row").attr("data-job_code_value");
                    var jdf_id = $("#jd-datatable tr.active-row").attr("id").replace(/\D/g, '');

                    updateJDF_assigned_managers_column(job_code, jdf_id)



                }
            }); //end of AJAX update call



        } // if (result) {

    }); //

    $("body").on("click", "ul#assignedmanager-list li", function() {

        $("ul#assignedmanager-list li").removeClass("active");
        $(this).addClass("active");
    });

    $("body").on("click", "#select_filter-monthdayyear", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        $(".filterbetweendates-popup").toggle();

    });



    $("body").on("click", ".am-action-btns-list > ul > li", function() {
        $(".am-action-btns-list").hide();
    });

    $("body").on("click", ".am-action-btns", function(e) {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        let scrollTopId;

        if ($(this).hasClass("current")) {

            $("#current_assigned_managers").append($(".am-action-btns-list"));
            scrollTopId = $("#current_assigned_managers");
            $(".link-close-file").show();

        } else {

            $("#history_assigned_managers").append($(".am-action-btns-list"));
            scrollTopId = $("#history_assigned_managers");
            $(".link-close-file").hide();

        }


        var id = $(this).attr("data-file_assignment_id");
        var status = $(this).attr("data-file_assignment_status");
        var filename = $(this).parent().parent().attr("data-filename");
        var assigned_manager_id = $(this).attr("data-assigned_manager_id");
        var userKeys = $(this).attr("data-userKeys");

        //console.log(userKeys);

        $(".am-action-btns-list ul > li").attr("data-id", id);
        $(".am-action-btns-list ul > li").attr("data-status", status);
        $(".am-action-btns-list ul > li").attr("data-assigned_manager_id", assigned_manager_id);
        $(".am-action-btns-list ul > li").attr("data-filename", filename);



        $(".am-action-btns-list ul > li").attr("data-userKeys", userKeys);




        if ($(this).parent().parent().find(".am-status_label").text().trim() == "Submitted".trim() || $(this).parent().parent().find(".am-status_label").text().trim() == "Closed") {
            $("#btn-reassign_file").show();
        } else {
            $("#btn-reassign_file").hide();
        }



        $(".am-action-btns-list").css("top", $(this).position().top + 25 + scrollTopId.scrollTop());

        $(".am-action-btns-list").css("left", $(this).position().left - 148);

        $(".am-action-btns-list").show();



    });


    setInterval(function() {
        //console.log("Number of Jax request is : ", $.active);
    }, 500);


    $(".textReadonly-close").each(function() {
        var el = this;
        $(this).parent().append('<span class="zz_clearText" style="position:absolute;right: 23px;top: 30px;color: #777;cursor: pointer;font-size: 16px;">x</span>');

    });

    $("body").on("click", ".zz_clearText", function() {
        $(this).parent().find(".textReadonly-close").val("");
    });


    $("body").on("click", ".chk-replacefile", function() {
        var node = $(this);
        $(this).parent().find(".info").toggle();



        if ($("#replaceJobFile-checkbox").prop("checked")) {

            $("#replaceJobFile-checkbox").prop("checked", false);


            $("#replaceJobFile").each(function() {
                $(this).remove();
            });


        } else {
            $("#replaceJobFile-checkbox").prop("checked", true);
            $(node).parent().append(" <input type='file' id='replaceJobFile' style='width:100%;padding:7px;border-radius:7px'>");
        }
    });



    $("body").on("click", "#replaceJobFile-checkbox", function(e) {



        if ($("#replaceJobFile-checkbox").prop("checked")) {


            $(".chk-replacefile").parent().append(" <input type='file' id='replaceJobFile' style='width:100%;padding:7px;border-radius:7px'>");
        } else {
            $("#replaceJobFile").each(function() {
                $(this).remove();
            });

        }

        $(this).parent().parent().find(".info").toggle();

        e.stopPropagation();




    });



    $("body").on('change', "#replaceJobFile", function() {



        var fileInput = $('#replaceJobFile');

        fileInput.css("border", "1px solid #444");
        var fileCount = fileInput[0].files.length;

        if (fileCount == 0) {
            //alert("No file selected");
            return;
        }

        var nonWordDocumentSelected = false;
        var jobCodeDontExist_in_a_file = false;

        $(fileInput[0].files).each(function() {

            var filename = this.name;

            var jobcode = filename.trim().substring(0, 6);


            if (filename.endsWith(".docx") || filename.endsWith(".doc")) {
                // $(".error-catcher > ul").append("<li><strong style='color:#00693c !important'>"+filename+"</strong></li>");
            } else {

                alert("Selected File is not a word document");
                fileInput.val("");
                return;

            }


            if (isNaN(parseInt(jobcode))) {
                // console.log("isNaN(parseInt("+jobcode+")) : " + isNaN(parseInt(jobcode)));
                alert("Wrong format of filename");
                fileInput.val("");

                return;

            }

            if (filename == $("#selectedJobfilename-edit").text()) {
                fileInput.css("border", "3px solid #6ad46a");
            } else {
                alert("Filename of the selected file is not equal to the Job filename");
                fileInput.val("");
            }

        });




    });

    let t;


    $("body").on("keyup", "#jd-datatable_filter label > input[type='search']", function() {

        clearTimeout(t);

        t = setTimeout(function() {
            $("#jd-datatable tbody tr:first td:nth-child(1)").click();
            //console.log("Test");
        }, 500);

    });


}); //document ready


function loadSelectedJobFamily(selectedJobFamilyGroup, _promises) {

    var url = "/_api/Web/Lists/GetByTitle('Job_Family')/Items?$select=*&$filter=Job_Family_Group eq '" + encodeURIComponent(selectedJobFamilyGroup) + "'";




    if (selectedJobFamilyGroup == '') {
        $("#select_job_family").prop("disabled", true);
        $("#select_job_family-edit").prop("disabled", true);
        return true;
    }

    //console.log(url);

    var _promise = $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {

            $("#select_job_family").html("");

            $("#select_job_family-edit").html("");

            $("#select_job_family").append('<option disabled selected value=""></option>');

            $("#select_job_family-edit").append('<option disabled selected value=""></option>');

            $(data.d.results).each(function() {

                var optionHTML = "<option class='options-removable' value='" + this.Title + "'>" + this.Title + "</option>";


                $("#select_job_family").append(optionHTML);
                $("#select_job_family-edit").append(optionHTML);

            });

            $("#select_job_family").prop("disabled", false);
            $("#select_job_family-edit").prop("disabled", false);
            $("#select_job_family").select2({
                width: '100%'
            });

        },
        error: function(error) {
            $(".global-error-notification span").html(error);
            $(".global-error-notification").fadeIn('slow')
                .animate({
                    opacity: 1.0
                }, 13500)
                .fadeOut('slow', function() {
                    $(this).remove();
                });
        }
    });

    _promises.push(_promise);
} //


function bs_input_file() {

    $(".input-file").before(
        function() {
            if (!$(this).prev().hasClass('input-ghost')) {

                var element = $("<input type='file' class='input-ghost' style='visibility:hidden; height:0'>");
                element.attr("name", $(this).attr("name"));

                element.change(function() {
                    element.next(element).find('input').val((element.val()).split('\\').pop());

                    var filename = $("#upload-file").val();

                    if (filename.trim() == "") {
                        __clear_uploadfile_fields();
                        return;
                    }

                    if (filename.endsWith(".docx") || filename.endsWith(".doc")) {

                        $("#text_job_code").val(filename.trim().substring(0, 6));

                        $("#text_job_code").keyup();

                        __check_file_name_exists(filename, $(this));

                    } else {
                        alert("Unsupported file type. Please contact the site administrator");
                        __clear_uploadfile_fields();
                    }



                });

                $(this).find("button.btn-choose").click(function() {
                    element.click();
                });
                $(this).find("button.btn-reset").click(function() {
                    element.val(null);
                    $(this).parents(".input-file").find('input').val('');
                });
                $(this).find('input').css("cursor", "pointer");
                $(this).find('input').mousedown(function() {
                    $(this).parents('.input-file').prev().click();
                    return false;
                });
                return element;
            }
        }
    );


} //end of bs_input_file


function __check_file_name_exists(filename, element) {


    var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/Items?$select=*,FileLeafRef&$filter=FileLeafRef eq '" + filename + "'";

    //console.log(url);

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {
            $(".err-msg").remove();

            if (data.d.results.length > 0) {

                var spanHTML = "<span class='err-msg' style='color: red; font-size: 12px; '>File name exists! Please choose a different filename!</span>";

                $(element).parent().prepend(spanHTML);

                $(element).attr("data-validation-state", "false");

                $(element).css("border", "1px solid red");

            } else {
                $(".err-msg").remove();
                $(element).attr("data-validation-state", "true");
            }

        },
        error: function(error) {
            $(".global-error-notification span").html(error);
            $(".global-error-notification").fadeIn('slow')
                .animate({
                    opacity: 1.0
                }, 13500)
                .fadeOut('slow', function() {
                    $(this).remove();
                });
        }
    });

} //

function __loadUploadSelections(field_name, select_element, selected_option, promises) {

    var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/fields?$filter=EntityPropertyName eq '" + field_name + "'";

    var promise = $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {
            $(data.d.results[0].Choices.results).each(function() {


                var optionHTML = "<option class='options-removable' value='" + this + "'>" + this + "</option>";
                var node = this;

                if (this.toUpperCase() == "JOB DESCRIPTION" || (this.toUpperCase() == "NO" && selected_option == undefined)) {
                    optionHTML = "<option class='options-removable' value='" + this + "' selected>" + this + "</option>";
                }


                if (selected_option != undefined || selected_option != null) {


                    var a = node.toUpperCase() == selected_option.toUpperCase();
                    //console.log(node.toUpperCase() + "==" + selected_option.toUpperCase() + " | " + a);

                    if (node.toUpperCase() == selected_option.toUpperCase()) {
                        optionHTML = "<option class='options-removable' value='" + this + "' selected>" + this + "</option>";
                    }
                }



                // console.log(optionHTML);

                $("#" + select_element).append(optionHTML);

            });
        },
        error: function(error) {
            $(".global-error-notification span").html(error);
            $(".global-error-notification").fadeIn('slow')
                .animate({
                    opacity: 1.0
                }, 13500)
                .fadeOut('slow', function() {
                    $(this).remove();
                });
        }
    });

    if (promises) promises.push(promise);


} //end of load upload selections


function __check_if_typed_jobcode_exists(jobcode, element, url) {



    // console.log(url);

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {
            $(".error-msg2").remove();
            if (data.d.results.length > 0) {

                var spanHTML = "<span class='error-msg2' style='color: red; font-size: 10px; float: right;'>Job Code selected already exists!</span>";

                $(element).parent().find("label").after(spanHTML);
                $(element).attr("data-validation-state", "false");
                $(element).css("border", "1px solid red");

            } else {
                $(element).css("border", "1px solid #ababab");
                $(element).attr("data-validation-state", "true");
                $(".error-msg2").remove();
            }

            $("#btn-upload").prop("disabled", false);
            $("#btn-update-edit").prop("disabled", false);

        },
        error: function(error) {
            $(".global-error-notification span").html(error);
            $(".global-error-notification").fadeIn('slow')
                .animate({
                    opacity: 1.0
                }, 13500)
                .fadeOut('slow', function() {
                    $(this).remove();
                });
        }
    });
} //__check_if_typed_jobcode_exists


function uploadReplacementFile(uploadFileObj) {

    var fileName = uploadFileObj.name;
    var webUrl = _spPageContextInfo.webAbsoluteUrl;
    var documentLibrary = "Job_Description_Files";
    var targetUrl = _spPageContextInfo.webServerRelativeUrl + "/" + documentLibrary;

    var url = webUrl + "/_api/Web/GetFolderByServerRelativeUrl(@target)/Files/add(overwrite=true, url='" + fileName + "')?$expand=ListItemAllFields&@target='" + targetUrl + "'";

    var table = $("#jd-datatable").DataTable();
    var currentrow = $("#jd-datatable tr.active-row");

    uploadFileToFolder(uploadFileObj, url, function(data) {
        var file = data.d;
        var updateObject = {
            __metadata: {
                type: file.ListItemAllFields.__metadata.type
            },
            Title: table.row(currentrow).data().Title,
            Job_Code: table.row(currentrow).data().Job_Code,
            Job_Grade: table.row(currentrow).data().Job_Grade,
            Job_Family_Group: table.row(currentrow).data().Job_Family_Group,
            Job_Family: table.row(currentrow).data().Job_Family,
            File_Type: table.row(currentrow).data().File_Type,
            Exemption_Status: table.row(currentrow).data().Exemption_Status,
            Final_Version: table.row(currentrow).data().Final_Version,
            Country: table.row(currentrow).data().Country,
            Division: table.row(currentrow).data().Division,
            File_State: table.row(currentrow).data().File_State,
            Career_Path: table.row(currentrow).data().Career_Path,
            Job_Code: table.row(currentrow).data().Job_Code,
            Entry_Type: 1
        };

        url = webUrl + "/_api/Web/lists/getbytitle('" + documentLibrary + "')/items(" + file.ListItemAllFields.Id + ")";

        updateFileMetadata(url, updateObject, file, function(data) {

            //success lines
            var success_html = "<div id='update-success-edit-jd' style='padding:15px'>" +
                "<div class='alert alert-success' style='margin-bottom:0 !important'>" +
                "Job File has been replaced! <br>" +
                "Update has been successfully saved!" +
                "</div>" +
                "</div>";

            $("#edit-jd-modal-content").fadeOut();

            $("#select_job_family-edit").prop("disabled", true);

            $("#edit-jd-modal-content").parent().append(success_html);

            $("#replaceJobFile-checkbox").prop("checked", false);
            $(".chk-replacefile").parent().find(".info").hide();

            $("#replaceJobFile").each(function() {
                $(this).remove();
            });
            /*__load_datat able();*/


        }, function(error) {

            alert("An error has occurred while replacing the file.");
            console.log(error);

            /*   console.log(data);*/
        });

    }, function(data) { //failure ajax call
        var errorhtml = "<div class='alert alert-danger'>" +
            "<strong>Error!</strong> File uploading and meta data updating FAILEDs" +
            "</div>";


        $(errorhtml).prependTo(".jd-upload-box-body")
            .fadeIn('slow')
            .animate({
                opacity: 1.0
            }, 2500)
            .fadeOut('slow', function() {
                $(this).remove();
            });


        /*console.log(data);*/
    });



}

function uploadFiles(uploadFileObj) {

    var fileName = uploadFileObj.name;
    var webUrl = _spPageContextInfo.webAbsoluteUrl;
    var documentLibrary = "Job_Description_Files";
    var targetUrl = _spPageContextInfo.webServerRelativeUrl + "/" + documentLibrary;
    console.log(targetUrl);

    var url = webUrl + "/_api/Web/GetFolderByServerRelativeUrl(@target)/Files/add(overwrite=true, url='" + fileName + "')?$expand=ListItemAllFields&amp;amp;@target='" + targetUrl + "'";

    var url = webUrl + "/_api/Web/GetFolderByServerRelativeUrl(@target)/Files/add(overwrite=true, url='" + fileName + "')?$expand=ListItemAllFields&@target='" + targetUrl + "'";


    //var url = webUrl + "/_api/Web/GetFolderByServerRelativeUrl(@target)/Files/add(overwrite=true, url='102832.docx')?$expand=ListItemAllFields&@target='/sites/JobLibrary/Job_Description_Files'";


    var job_title = $("#text_job_title").val();
    var job_code = $("#text_job_code").val();
    var job_grade = $("#text_job_grade").val();
    var job_family_group = $("#select_job_family_group").val();
    var job_family = $("#select_job_family").val();
    var career_path = $("#select_career_path").val();
    var country = $("#select_country").val();
    var file_type = $("#select_file_type").val();
    var exemption_status = $("#select_exemption_status").val();
    var final_version = $("#select_final_version").val();
    var file_state = "0";

    //permission add here

    var assigned_managers_states = null;

    if (final_version == "Yes") {
        assigned_managers_states = "Final Version";
    }

    console.log('Job_Title = ' + job_title + '\n' +
        'Job_Grade = ' + job_code + '\n' +
        'Job_Code = ' + job_grade + '\n' +
        'Job_Family_Group = ' + job_family_group + '\n' +
        'Job_Family = ' + job_family + '\n' +
        'Career_Path = ' + career_path + '\n' +
        'Country = ' + country + '\n' +
        'File_Type = ' + file_type + '\n' +
        'Exemption_Status = ' + exemption_status + '\n' +
        'Final_Version = ' + final_version + '\n' +
        'File_State = ' + file_state);


    uploadFileToFolder(uploadFileObj, url, function(data) {
        var file = data.d;
        var updateObject = {
            __metadata: {
                type: file.ListItemAllFields.__metadata.type
            },
            Title: job_title,
            Job_Grade: job_grade,
            Job_Code: job_code,
            Job_Family_Group: job_family_group,
            Job_Family: job_family,
            Career_Path: career_path,
            Country: country,
            File_Type: file_type,
            Exemption_Status: exemption_status,
            Final_Version: final_version,
            File_State: file_state,
            Assigned_Managers: assigned_managers_states,
            Entry_Type: 1
        };

        url = webUrl + "/_api/Web/lists/getbytitle('" + documentLibrary + "')/items(" + file.ListItemAllFields.Id + ")";

        updateFileMetadata(url, updateObject, file, function(data) {


            __clear_uploadfile_fields();

            var successhtml = "<div class='alert alert-success'>" +
                "<strong>Success!</strong> Your entries has been successfully saved. " +
                "</div>";


            $(successhtml).prependTo(".jd-upload-box-body")
                .fadeIn('slow')
                .animate({
                    opacity: 1.0
                }, 3500)
                .fadeOut('slow', function() {
                    $(this).remove();
                });

            $("#btn-upload").prop("disabled", false);

            /*__load_datatable();*/
            recursive_load_datatable("", "", []);

            $("#btn-upload").text("Upload & Save");

            PermissionModificationModule.libraryName = "Job_Description_Files";
            PermissionModificationModule.brkInhrt(fileName).done(function() {
                PermissionModificationModule.rmvAsgn(fileName, 4).done(function() {
                    console.log("Success Removing Visitor");
                });
            });


        }, function(data) {

            var errorhtml = "<div class='alert alert-danger'>" +
                "<strong>Error!</strong> File upload done but meta data updating has failed" +
                "</div>";


            $(errorhtml).prependTo(".jd-upload-box-body")
                .fadeIn('slow')
                .animate({
                    opacity: 1.0
                }, 2500)
                .fadeOut('slow', function() {
                    $(this).remove();
                });



            /*   console.log(data);*/
        });

    }, function(data) { //failure ajax call
        var errorhtml = "<div class='alert alert-danger'>" +
            "<strong>Error!</strong> File uploading and meta data updating FAILEDs" +
            "</div>";


        $(errorhtml).prependTo(".jd-upload-box-body")
            .fadeIn('slow')
            .animate({
                opacity: 1.0
            }, 2500)
            .fadeOut('slow', function() {
                $(this).remove();
            });


        /*console.log(data);*/
    });
} //upload files

function getFileBuffer(uploadFile) {
    var deferred = jQuery.Deferred();
    var reader = new FileReader();
    reader.onloadend = function(e) {
        deferred.resolve(e.target.result);
    }
    reader.onerror = function(e) {
        deferred.reject(e.target.error);
    }
    reader.readAsArrayBuffer(uploadFile);
    return deferred.promise();
}

function uploadFileToFolder(fileObj, url, success, failure) {
    var apiUrl = url;
    var getFile = getFileBuffer(fileObj);
    getFile.done(function(arrayBuffer) {
        $.ajax({
            url: apiUrl,
            type: "POST",
            data: arrayBuffer,
            processData: false,
            async: false,
            headers: {
                "accept": "application/json;odata=verbose",
                "X-RequestDigest": jQuery("#__REQUESTDIGEST").val(),
            },
            success: function(data) {
                success(data);
            },
            error: function(error) {
                $(".global-error-notification span").html(error);
                $(".global-error-notification").fadeIn('slow')
                    .animate({
                        opacity: 1.0
                    }, 13500)
                    .fadeOut('slow', function() {
                        $(this).remove();
                    });
            }
        });
    });
}

function updateFileMetadata(apiUrl, updateObject, file, success, failure) {
    $.ajax({
        url: apiUrl,
        type: "POST",
        async: false,
        data: JSON.stringify(updateObject),
        headers: {
            "accept": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            "Content-Type": "application/json;odata=verbose",
            "X-Http-Method": "MERGE",
            "IF-MATCH": file.ListItemAllFields.__metadata.etag,
        },
        success: function(data) {
            success(data);
        },
        error: function(error) {
            $(".global-error-notification span").html(error);
            $(".global-error-notification").fadeIn('slow')
                .animate({
                    opacity: 1.0
                }, 13500)
                .fadeOut('slow', function() {
                    $(this).remove();
                });
        }
    });
}

function __clear_uploadfile_fields() {


    $(".jd-upload-box-wrapper").find("input[type='text']").each(function() {

        $(this).val(null);
        $(this).css("border", "1px solid #ababab");

    });

    $(".jd-upload-box-wrapper").find("input[file]").each(function() {

        $(this).val(null);
        $(this).css("border", "1px solid #ababab");

    });

    $(".jd-upload-box-wrapper").find("select").each(function() {

        $(this).parent().find("span.select2-container--default .select2-selection--single").css("border", "1px solid #ababab");

    });


    $("#select_job_family_group").val('').trigger('change');
    $("#select_job_family").val('').trigger('change');
    $("#select_career_path").val('').trigger('change');
    $("#select_country").val('').trigger('change');
    $("#select_file_type").val('Job Description').trigger('change');
    $("#select_exemption_status").val('').trigger('change');
    $("#select_final_version").val('No').trigger('change');



    /* $("#select_file_type").prop("selectedIndex", 1);
     $("#select_final_version").prop("selectedIndex", 1);*/

} //clear

function recursive_load_datatable(job_code, filter_datatable, response, recursive_url) {


    //disable_buttonts_on_table_data_loadx
    $("#filter-clear").prop("disabled", true);
    $("#filter-datatable").prop("disabled", true);


    $("#jd-datatable tbody").html("<tr><td  align='center' colspan='10'>" +
        "<img src='https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/preloaders/preloader_spinner.gif' data-themekey='#' style='text-align: center;'></td></tr>");


    if (filter_datatable == "" || filter_datatable == null) filter_datatable = "$filter=Entry_Type eq 1";

    var url = _spPageContextInfo.webAbsoluteUrl + "/_api/Web/Lists/GetByTitle('Job_Description_Files')/items?$select=*,FileLeafRef&" + filter_datatable + "&$orderby=Created desc&$top=5000";

    if (recursive_url != null) {
        url = recursive_url;
    }


    console.log(url);

    return $.ajax({
        url: url,
        method: "GET",
        headers: {
            "Accept": "application/json; odata=verbose"
        },
        success: function(data) {
            /*console.log(data);*/
            response = response.concat(data.d.results);

            if (data.d.__next) {

                /*recursive_LoadACCList(url, response, recur_promises);*/
                var next_url = data.d.__next;

                recursive_load_datatable("", "", response, next_url);

            } else { //if finshi adding records to the response 
                var __data_object = response;

                var deffereds = [];



                $(__data_object).each(function() {


                    var node = this;
                    var id = this.ID;
                    var jobcode = this.Job_Code;

                    node["DT_RowId"] = "row_" + id; //node id

                    node["DT_RowAttr"] = {
                        "data-job_code_value": jobcode
                    }

                    var defer = [];
                    deffereds.push(defer);


                }); //each function ends

                $.when.apply($, deffereds)
                    .done(function() {


                        $('#jd-datatable').DataTable({
                            dom: 'Bf<"#info2"i>tip',
                            buttons: [
                                'copy', 'csv', 'excel', 'pdf', 'print'
                            ],
                            "destroy": true,
                            "processing": true,
                            "lengthMenu": [
                                [50, 150, 500, -1],
                                [50, 150, 500, "All"]
                            ],
                            "data": __data_object,
                            "searching": true,
                            "columns": [{
                                    "data": null,
                                    "render": function(data) {

                                        var __data = "";

                                        __data = data.ID;
                                        return __data;
                                    }
                                },
                                {
                                    "data": null,
                                    "render": function(data) {

                                        var href = "ms-word:ofe|u|" + _spPageContextInfo.webAbsoluteUrl + "/Job_Description_Files/" + data.FileLeafRef;

                                        var __data = "<a href='" + href + "'> <img src='https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/icons/microsoft-word.png' style='width:20px;margin-right:5px'/>" + data.Title + "</a>";
                                        return __data;
                                    }
                                },
                                {
                                    "data": null,
                                    "render": function(d) {

                                        return "<p title='" + d.Job_Code + "' class='ellipseText'>" + d.Job_Code + "</p>"

                                    }
                                },
                                {
                                    "data": null,
                                    "render": function(d) {

                                        return "<p title='" + d.Job_Grade + "' class='ellipseText'>" + d.Job_Grade + "</p>"

                                    }
                                },
                                {
                                    "data": "Job_Family_Group"
                                },
                                {
                                    "data": "Job_Family"
                                },
                                {
                                    "data": "Career_Path"
                                },
                                {
                                    "data": "Country"
                                },
                                {
                                    "data": "Assigned_Managers"
                                }
                            ],
                            "columnDefs": [{
                                    "width": "10px",
                                    "visible": false,
                                    "targets": 0
                                },
                                {
                                    "width": "20%",
                                    "targets": 1
                                },
                                {
                                    "width": "8%",
                                    "targets": 2
                                },
                                {
                                    "width": "2%",
                                    "targets": 3
                                },
                                {
                                    "width": "18%",
                                    "targets": 4
                                },
                                {
                                    "width": "15%",
                                    "targets": 5
                                },
                                {
                                    "width": "15%",
                                    "targets": 6
                                },
                                {
                                    "width": "15%",
                                    "targets": 7
                                },
                                {
                                    "width": "5%",
                                    "targets": 8
                                }

                            ],
                            "aaSorting": []
                        }); //datatable end

                        /* if(job_code != undefined){
                             $("#jd-datatable td").filter(function() {
                             if($(this).text() == job_code){
                                 //console.log($(this).parent());
                                 $(this).parent().find("td:nth-child(1)").click();
                               };
                            });
                         }*/
                        $("#jd-datatable tr:nth-child(1) td:first-child").click();
                        // $("#job_selected_current > span").text("No Selected File");

                        var noselected = "" +
                            "<div class='preloader_ajax' style='text-align:center'>" +
                            "<p style=' color: #34a3da; background: #fbfeff; border: 1px solid #b6e8ff; padding: 10px; border-radius: 3px; '>Select a row in the Job File Table</p>" +
                            "</div>";

                        $("#filter-clear").prop("disabled", false);
                        $("#filter-datatable").prop("disabled", false);



                    }); //done function

                //console.log(__data_object);
            } //end of else
        },
        error: function(error) {
            console.log(JSON.stringify(error));
        },
        complete: function() {

        }
    }); //end of ajax call


    //recur_promises.push(promise);


} //recursiveLoad

function __load_datatable(job_code, filter_datatable) {

    if (filter_datatable == undefined) filter_datatable = "$filter=Entry_Type eq 1"

    var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/items?$select=*,FileLeafRef&" + filter_datatable + "&$orderby=Created desc";

    var call = $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        dataType: "json",
        headers: {
            "accept": "application/json;odata=verbose",
        }
    });



    call.done(function(data, textStatus, jqXHR) {

        var __data_object = data.d.results;

        var deffereds = [];



        $(__data_object).each(function() {


            var node = this;
            var id = this.ID;
            var jobcode = this.Job_Code;

            var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*&$filter=Status ne 'Closed' and Job_Code eq '" + this.Job_Code + "'";
            var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*&$filter=Job_Code eq '" + this.Job_Code + "'";

            var defer = $.ajax({
                url: _spPageContextInfo.webAbsoluteUrl + url,
                type: "GET",
                dataType: "json",
                headers: {
                    "accept": "application/json;odata=verbose",
                }
            }).done(function(data) {
                /*  console.log(data);*/

                if (data.d.results.length > 0) {


                    var closed_cnt = 0;
                    var open_cnt = 0;

                    $(data.d.results).each(function() {

                        if (this.Status == "Closed") closed_cnt++;
                        if (this.Status == "Unopened" || this.Status == "Opened" || this.Status == "Working" || this.Status == "Submitted" || this.Status == "Validated") open_cnt++;
                    });


                    //console.log(open_cnt + " vS " + closed_cnt);

                    if (open_cnt > 0) {
                        node["Assigned_Managers_States"] = "Open";
                    } else {
                        if (closed_cnt > 0) {
                            node["Assigned_Managers_States"] = "Closed";
                        }
                    }

                } else {
                    node["Assigned_Managers_States"] = "";
                }

                node["AssignManagersCount"] = data.d.results.length;

                node["DT_RowId"] = "row_" + id;

                node["DT_RowAttr"] = {
                    "data-job_code_value": jobcode
                }

            });

            deffereds.push(defer);


        }); //each function ends

        $.when.apply($, deffereds)
            .done(function() {

                $('#jd-datatable').DataTable({
                    dom: 'Bfrtip',
                    buttons: [
                        'copy', 'csv', 'excel', 'pdf', 'print'
                    ],
                    "destroy": true,
                    "processing": true,
                    "lengthMenu": [
                        [50, 150, 500, -1],
                        [50, 150, 500, "All"]
                    ],
                    "data": __data_object,
                    "searching": true,
                    "columns": [{
                            "data": null,
                            "render": function(data, row) {

                                var __data = "";

                                __data = "<span id='" + data.ID + "'>&nbsp;</span>";

                                return __data;
                            }
                        },
                        {
                            "data": null,
                            "render": function(data) {

                                var href = "ms-word:ofe|u|" + _spPageContextInfo.webAbsoluteUrl + "/Job_Description_Files/" + data.FileLeafRef;

                                var __data = "<a href='" + href + "'> <img src='https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/icons/microsoft-word.png' style='width:24px;margin-right:5px'/>" + data.Title + "</a>";
                                return __data;
                            }
                        },
                        {
                            "data": "Job_Code"
                        },
                        {
                            "data": "Job_Grade"
                        },
                        {
                            "data": "Job_Family_Group"
                        },
                        {
                            "data": "Job_Family"
                        },
                        {
                            "data": "Career_Path"
                        },
                        {
                            "data": "Country"
                        },
                        {
                            "data": "Assigned_Managers_States"
                        }
                    ],
                    "columnDefs": [{
                            "width": "10px",
                            "visible": false,
                            "targets": 0
                        },
                        {
                            "width": "20%",
                            "targets": 1
                        },
                        {
                            "width": "8%",
                            "targets": 2
                        },
                        {
                            "width": "2%",
                            "targets": 3
                        },
                        {
                            "width": "18%",
                            "targets": 4
                        },
                        {
                            "width": "15%",
                            "targets": 5
                        },
                        {
                            "width": "15%",
                            "targets": 6
                        },
                        {
                            "width": "15%",
                            "targets": 7
                        },
                        {
                            "width": "5%",
                            "targets": 8
                        }

                    ],
                    "aaSorting": []
                }); //datatable end

                if (job_code != undefined) {
                    $("#jd-datatable td").filter(function() {
                        return;
                        if ($(this).text() == job_code) {
                            // console.log($(this).parent());
                            $(this).parent().find("td:nth-child(1)").click();
                        };
                    });
                }




            });

        //console.log(__data_object);




    }); //call.done end



} //end of loadtraining materials


function datatable_init_buttons() {

    var timer;

    $("body").on("click", "table#jd-datatable td", function() {


        $(".jd-information-loader").show();

        if ($(this).hasClass("dataTables_empty")) return;

        $("table#jd-datatable tr").removeClass("active-row");

        var id = $(this).parent().attr("id").replace(/\D/g, '');



        $("#btn-edit-jd").attr("data-ID", id);

        var job_code = $(this).parent().attr("data-job_code_value");
        var job_title = $(this).parent().find("td:nth-child(1) a").text();

        $("#job_selected_current > span").text(job_title + " - " + job_code);

        $(".jd-box-tabcontrol-body").fadeIn();
        $(".jd-box-tabcontrol-footer").fadeIn();
        $(".jd-box-tabcontrol-empty").hide();
        $("#btn-assignmanager").prop("disabled", false);

        $(this).parent().addClass('active-row');

        clearTimeout(timer); //clear any running timeout on key up

        timer = setTimeout(function() {

            $(".preloader_ajax").remove();

            var preloader_ajax = "" +
                "<div class='preloader_ajax' style='text-align:center'>" +
                "<img src='https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/preloaders/preloader_spinner.gif' data-themekey='#' style='text-align: center;'>" +
                "</div>";

            $(".jd-assignedmanager-tabs").prepend(preloader_ajax);

            load_additional_info(id); //loading job information
            load_assigned_managers(job_code);
            load_assigned_managers_history(job_code);


        }, 700);




    });

} //end of datatableinit
//removed here




function load_additional_info(id) {

    var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/items?$select=*,FileLeafRef,Editor/Title,Author/Title&$expand=Editor/Id,Author/Id&$filter=ID eq " + id;

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {
            /*console.log(data);*/
            $(data.d.results).each(function() {


                var upload_date = moment(this.Created).format('LLLL');

                //console.log(moment(this.Modified).format('LLLL'));


                var modified_date = moment(this.Modified).format('LLLL');

                //additional info
                $("#job_info-uploaddate").text(upload_date);

                $("#job_info-modified").text(modified_date);

                $("#job_info-uploadedby").text(this.Author.Title);
                $("#job_info-modifiedby").text(this.Editor.Title);


                var last_evaluated = this.Last_Evaluated;
                if (last_evaluated == "" || last_evaluated == null) {
                    last_evaluated = "";
                } else {
                    last_evaluated = moment(this.Last_Evaluated).format('LL')
                }

                $("#job_info-last_evaluated").text(last_evaluated);
                $("#job_info-final_version").text(this.Final_Version);

                //job details
                //
                $("#job_details-title").text(this.Title);
                $("#job_details-code").text(this.Job_Code);
                $("#job_details-grade").text(this.Job_Grade);
                $("#job_details-familygroup").text(this.Job_Family_Group);
                $("#job_details-family").text(this.Job_Family);
                $("#job_details-career").text(this.Career_Path);
                $("#job_details-country").text(this.Country);
                $("#job_details-filetype").text(this.File_Type);
                $("#job_details-exemptionstatus").text(this.Exemption_Status);


                $(".jd-information-loader").fadeOut();
            });
        },
        error: function(error) {
            $(".global-error-notification span").html(error);
            $(".global-error-notification").fadeIn('slow')
                .animate({
                    opacity: 1.0
                }, 13500)
                .fadeOut('slow', function() {
                    $(this).remove();
                });
        }
    });

} //https://mfc.sharepoint.com/sites/JobLibrary/_api/web/getuserbyid(26)


function copyDocument(sourceSite, sourceFolderPath, sourceFileName, targetSite, targetFolderPath, targetFileName, requestDigest, data) {

    var sourceSiteUrl = sourceSite + "/_api/web/GetFolderByServerRelativeUrl('" + sourceFolderPath + "')/Files('" + sourceFileName + "')/$value";
    var targetSiteUrl = targetSite + "/_api/web/GetFolderByServerRelativeUrl('" + targetFolderPath + "')/Files/Add(url='" + targetFileName + "',overwrite=true)";

    var xhr = new XMLHttpRequest();
    xhr.open('GET', sourceSiteUrl, true);
    xhr.setRequestHeader('binaryStringResponseBody', true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
        if (this.status == 200) {
            //console.log(this.response);
            var arrayBuffer = this.response;
            $.ajax({
                    url: targetSiteUrl + "?$expand=ListItemAllFields",
                    method: 'POST',
                    data: arrayBuffer,
                    processData: false,
                    headers: {
                        'binaryStringRequestBody': 'true',
                        'Accept': 'application/json;odata=verbose;charset=utf-8',
                        'X-RequestDigest': requestDigest
                    }
                })
                .done(function(postData) {

                    var managerID = data.AssignedManagerId;

                    var id = postData.d.ListItemAllFields.ID
                    // console.log(id);
                    data.JDF_IDId = id;
                    // 
                    //console.log("&&&***********");
                    //console.log(data);
                    record_manager_assignment(data);

                    //console.log(postData);

                    console.log("FILENAME       " + targetFileName);

                    var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/items(" + id + ")";

                    var updateObject = {
                        __metadata: {
                            type: postData.d.ListItemAllFields.__metadata.type
                        },
                        Job_Code: $("#job_code-assign").val(),
                        Job_Grade: $("#job_grade-assign").val(),
                        Title: $("#job_title-assign").val(),
                        Entry_Type: 0

                    }


                    $.ajax({
                        url: _spPageContextInfo.webAbsoluteUrl + url,
                        type: "PATCH",
                        data: JSON.stringify(updateObject),
                        headers: {
                            "accept": "application/json;odata=verbose",
                            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                            "Content-Type": "application/json;odata=verbose",
                            "X-Http-Method": "PATCH",
                            "IF-MATCH": "*",
                        },
                        success: function(data) {

                            //console.log("data ^^^^^^^^^^^^s");

                            //lines for modifying file permission

                            PermissionModificationModule.libraryName = "Job_Description_Files/versions";

                            PermissionModificationModule.brkInhrt(targetFileName).done(function() {
                                PermissionModificationModule.rmvAsgn(targetFileName, 4).done(function() {
                                    PermissionModificationModule.addAsgn(targetFileName, managerID, "Contribute").done(function() {
                                        console.log("Permission has been set !");
                                    });
                                });
                            });



                            var table = $("#jd-datatable").DataTable();
                            var currentrow = $("#jd-datatable tr.active-row");

                            //console.log(currentrow);

                            table.row(currentrow).data().Assigned_Managers = "Open";

                            table.row(currentrow).invalidate();
                            table.draw();
                            //update the dom ctrl z




                            var job_code = $("#jd-datatable tr.active-row").attr("data-job_code_value");
                            var jdf_id = $("#jd-datatable tr.active-row").attr("id").replace(/\D/g, '');


                            updateJDF_assigned_managers_column(job_code, jdf_id)

                        },
                        error: function(error) {
                            $(".global-error-notification span").html(error);
                            $(".global-error-notification").fadeIn('slow')
                                .animate({
                                    opacity: 1.0
                                }, 13500)
                                .fadeOut('slow', function() {
                                    $(this).remove();
                                });
                        }
                    });
                })
                .fail(function(jqXHR, errorText) {
                    // console.log('dadgummit');
                });
        }
    }
    xhr.send();
}




function assignmanager_init() {

    /*  var __ex = false;*/

    $("body").on("click", "#btn-assignmanager", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        var loading_html = "<img src='https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/preloaders/preloader_save.gif'> " +
            "<strong>Saving Entry...</strong> File is being duplicated through the system. Please wait...";
        $("#assigning-status").html(loading_html);
        $("#assigning-status").hide();

        $("#assigning-status").removeClass("alert-success");
        $("#assigning-status").addClass("alert-info");

        $("#assign-upper-body").show();

        $("#btn-submitassignment").prop("disabled", true);



        var id = $("#jd-datatable tr.active-row").attr("id").replace(/\D/g, '');

        $("#duedate-assign").val(moment().add(14, 'days').format("LL"));

        var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/items?$select=*,FileLeafRef,Editor/Title&$expand=Editor/Id&$filter=ID eq " + id;

        $.ajax({
            url: _spPageContextInfo.webAbsoluteUrl + url,
            type: "GET",
            headers: {
                "accept": "application/json;odata=verbose",
            },
            success: function(data) {
                $(data.d.results).each(function() {
                    $("#job_code-assign").val(this.Job_Code);
                    $("#job_title-assign").val(this.Title);
                    $("#job_grade-assign").val(this.Job_Grade);
                    $("#filename-assign").val(this.FileLeafRef);
                });


            },
            error: function(error) {
                $(".global-error-notification span").html(error);
                $(".global-error-notification").fadeIn('slow')
                    .animate({
                        opacity: 1.0
                    }, 13500)
                    .fadeOut('slow', function() {
                        $(this).remove();
                    });
            }
        });

        //$("#modal-assign-newmanager").iziModal("open");
        $("#modal-assign-newmanager").parent().show();
        //initializePeoplePicker("peoplePickerDiv");
        $("#peoplePickerDiv").spPeoplePicker();

        AssignManagerSelection.load();
        /*  __ex = true;*/


    }); //end of btn-assignmanager"

    $("body").on("click", "#btn-submitassignment", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        var peoplepicker_value = $("#peoplePickerDiv_TopSpan_HiddenInput").val();

        peoplepicker_value = JSON.parse(peoplepicker_value);

        peoplepicker_value = peoplepicker_value[0];

        $("#btn-submitassignment").prop("disabled", true);


        if ($("#btn-submitassignment").text().trim().toUpperCase() == "Re-Assign Manager".toUpperCase()) {

            // var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/getItemById('" + id + "')";

            var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/items?" +
                "$select=*,AssignedManager/Name,AssignedManager/EMail&$expand=AssignedManager&" +
                "$filter=AssignedManager/EMail eq '" + fixedEncodeURIComponent(peoplepicker_value.EntityData.Email) + "' and Job_Code eq '" + $("#job_code-assign").val() + "'&$top=1";


            var call = $.ajax({
                url: _spPageContextInfo.webAbsoluteUrl + url,
                type: "GET",
                headers: {
                    "accept": "application/json;odata=verbose",
                }
            });



            call.done(function(data) {

                //console.log(data);

                var node = data.d.results[0];

                var assignedById = _spPageContextInfo.userId;

                if ($("#select-assignmanagerName").select2("data")[0].id !== undefined) {

                    assignedById = $("#select-assignmanagerName").select2("data")[0].id;

                }

                var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/getItemById('" + data.d.results[0].ID + "')";

                var data = {
                    __metadata: {
                        'type': 'SP.Data.File_x005f_AssignmentsListItem'
                    },
                    Status: "Unopened",
                    AssignedById: assignedById,
                    Submission_Date: $("#duedate-assign").val(),
                    managerSubmission_Status: "new"
                };

                $.ajax({
                    url: _spPageContextInfo.webAbsoluteUrl + url,
                    type: "PATCH",
                    headers: {
                        "accept": "application/json;odata=verbose",
                        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                        "content-Type": "application/json;odata=verbose",
                        "X-Http-Method": "PATCH",
                        "If-Match": "*"
                    },
                    data: JSON.stringify(data),
                    success: function(data) {


                        var table = $("#jd-datatable").DataTable();
                        var currentrow = $("#jd-datatable tr.active-row");

                        table.row(currentrow).data().Assigned_Managers = "Open";

                        table.row(currentrow).invalidate();
                        table.draw();
                        //update the dom ctrl z


                        var job_code = $("#jd-datatable tr.active-row").attr("data-job_code_value");
                        var jdf_id = $("#jd-datatable tr.active-row").attr("id").replace(/\D/g, '');


                        updateJDF_assigned_managers_column(job_code, jdf_id);

                        var peoplepicker_value = $("#peoplePickerDiv_TopSpan_HiddenInput").val();

                        peoplepicker_value = JSON.parse(peoplepicker_value);

                        peoplepicker_value = peoplepicker_value[0];


                        var userKeysString = {
                            submission_date: moment($("#duedate-assign").val()).format("MMMM Do"),
                            displayName: peoplepicker_value.AutoFillDisplayText
                        };

                        userKeysString = JSON.stringify(userKeysString);

                        var successhtml = "<table id='tbl-assignManagerSuccessBox' data-userKeys='" + userKeysString + "' class='assign-table' style='border:1px;width:100%'>" +
                            "<tr>" +
                            "<td colspan='2'> <strong>Success!</strong> Job Description File has been reassigned.</td>" +
                            "</tr>" +
                            "<tr>" +
                            "<td> File Name:</td><td> <strong>" + node.New_File_Name + "</strong></td>" +
                            "</tr>" +
                            "<tr>" +
                            "<td> Assigned To: </td><td><strong id='manager_displayName'>" + peoplepicker_value.DisplayText + "</strong></td>" +
                            "</tr>" +
                            "<tr>" +
                            "<td> Email Address: </td><td><strong id='assigned-email-address'>" + peoplepicker_value.EntityData.Email + "</strong></td>" +
                            "</tr>" +
                            "<tr>" +
                            "<td colspan='2'>" +
                            "<div class='htmlemail-bccd-wrapper'>" +
                            "<div class='htmlemail-bccd-text'>" +
                            "<i class='fa fa-cogs'></i> Email Notification CC'd People" +
                            "</div>" +
                            "<div class='htmlemail-bccd-select-wrapper'>" +
                            "<select id='htmlemail-bccd-select' multiple='' style='width: 100%;'>" +
                            "</select>" +
                            "</div>" +
                            "</div>" +
                            "</td>" +
                            "</tr>" +
                            "<tr>" +
                            "<td colspan='2'><button data-assignerCC='" + $("#select-assignmanagerName").select2("data")[0].email + "' class='btn btn-success' id='btn-sendemail-notification-forReassignment'><i class='fa fa-bell'></i> Send Email Notification</button></td>"
                        "</tr>" +

                        "</table>";


                        $("#assigning-status").fadeIn();

                        $("#assigning-status").removeClass("alert-info");

                        $("#assigning-status").addClass("alert-success");

                        $("#assigning-status").html(successhtml);


                        getToBCCdPeoples.init("htmlemail-bccd-select");

                        //console.log($("#btn-sendemail-notification").data("data-emailinfo-array"));   

                        $("#btn-submitassignment").prop("disabled", true);
                        $(".sp-peoplepicker-delImage").click();




                        $("#assign-upper-body").hide();
                    }
                }); //end of AJAX update call
            });



            return;
        } //if condition ends

        //below are the else

        $("#assigning-status").fadeIn();

        ensureUser(peoplepicker_value.EntityData.Email)
            .done(function(data) {

                /* console.log(data);*/
                var user_id = data.d.Id;

                var assigned_by_id = _spPageContextInfo.userId //current user logged in

                var assigned_by_id = _spPageContextInfo.userId;

                if ($("#select-assignmanagerName").select2("data")[0].id !== undefined) {

                    assigned_by_id = $("#select-assignmanagerName").select2("data")[0].id;

                }

                $("#btn-submitassignment").attr("data-assigningTOmanagerID", user_id);

                var file_name = $("#filename-assign").val();

                var _ind = 0;
                var _type = "";

                if (file_name.endsWith(".docx")) {
                    _ind = -5;
                    _type = ".docx";
                } else if (file_name.endsWith(".doc")) {
                    _ind = -4;
                    _type = ".doc";
                }


                var hash_for_filename = moment().format('MMMM Do YYYY, h:mm:ss a');
                hash_for_filename = md5(hash_for_filename);

                var new_file_name = file_name.slice(0, _ind) + "_" + peoplepicker_value.Description + "_" + hash_for_filename + _type;


                var assignedManagerKey = data.d.Email + "_" + $("#job_code-assign").val();

                //get selected user Department
                Rest.user(data.d.LoginName).profile().then(function(d) {

                    var Department = d.d.UserProfileProperties.results.filter(function(props) {
                        return props.Key == 'Department';
                    });

                    console.log(Department[0].Value);

                    var userDepartment = Department[0].Value;

                    var data = {
                        __metadata: {
                            'type': 'SP.Data.File_x005f_AssignmentsListItem'
                        },
                        Title: $("#job_title-assign").val(),
                        Job_Code: $("#job_code-assign").val(),
                        Comments: "No Comments yet",
                        Status: "Unopened",
                        New_File_Name: new_file_name,
                        AssignedManagerId: user_id,
                        AssignedById: assigned_by_id,
                        Submission_Date: $("#duedate-assign").val(),
                        AssignedManager_Key: assignedManagerKey,
                        Department: userDepartment
                    };

                    copyDocument(_spPageContextInfo.webAbsoluteUrl, "Job_Description_Files", file_name, _spPageContextInfo.webAbsoluteUrl, "Job_Description_Files/versions", new_file_name, $("#__REQUESTDIGEST").val(), data);
                });




            });

    });

    $("body").on("click", "#btn-send_email", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        //  var assigned_manager_id = $(this).attr("data-assigned_manager_id");

        //set name of Manager email being send to : htmlemail-manager_name
        $(".html-email-row-removable").remove();

        var userKeys = JSON.parse($(this).attr("data-userKeys"));
        var userKeysString = $(this).attr("data-userKeys");

        var successhtml = "<table id='tbl-assignManagerSuccessBox' data-userKeys='" + userKeysString + "' class='assign-table' style='border:1px;width:100%'>" +
            "<tr>" +
            "<td> File Name:</td><td> <strong>" + userKeys.fileName + "</strong></td>" +
            "</tr>" +
            "<tr>" +
            "<td> Assigned To: </td><td><strong id='manager_displayName'>" + fixedDecodeUri(userKeys.displayName) + "</strong></td>" +
            "</tr>" +
            "<tr>" +
            "<td> Email Address: </td><td><strong id='assigned-email-address'>" + fixedDecodeUri(userKeys.emailAddress) + "</strong></td>" +
            "</tr>" +
            "<tr>" +
            "<td colspan='2'>" +
            "<div class='htmlemail-bccd-wrapper'>" +
            "<div class='htmlemail-bccd-text'>" +
            "<i class='fa fa-cogs'></i> Email Notification Settings" +
            "</div>" +
            "<div class='htmlemail-bccd-select-wrapper'>" +
            "<select id='htmlemail-bccd-select' multiple='' style='width: 100%;'>" +
            "</select>" +
            "<input value='Reminder - Action Required: Job Documentation Review!' id='htmlemail-settings-subject' class='form-control' placeholder='Email Subject Line' style='display:none;margin-top: 8px; border-radius: 4px; padding: 4px 5px; min-width: 100%;'/>" +
            "</div>" +
            "</div>" +
            "</td>" +
            "</tr>" +
            "<tr>" +
            "<td colspan='2'><button data-assignerCC='" + userKeys.assigner_email + "' class='btn btn-success' id='btn-sendemail-notification'><i class='fa fa-bell'></i> Send Email Notification</button></td>"
        "</tr>" +

        "</table>";



        $("#assigning-status").removeClass("alert-info");

        $("#assigning-status").addClass("alert-success");

        $("#assigning-status").html(successhtml);


        //console.log($("#btn-sendemail-notification").data("data-emailinfo-array"));   

        $("#btn-submitassignment").prop("disabled", true);




        $("#assign-upper-body").hide();
        $("#modal-assign-newmanager").parent().show();
        $("#assigning-status").fadeIn();

        getToBCCdPeoples.init("htmlemail-bccd-select");

    }); // $("body").on("click", "#btn-send_email", function(){

    $("body").on("click", "#btn-sendemail-notification-forReassignment", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        var btn = this;

        var managerSplitName = $("#manager_displayName").text().substr(0, $("#manager_displayName").text().indexOf(' '));

        $("#htmlemail-manager_name-reassignNotify").html(managerSplitName + ",");

        $("#htmlemail_link_to_manager_dashboard-reassignNotify").attr("href", _spPageContextInfo.webAbsoluteUrl + "/Pages/managers-dashboard.aspx");

        var url = "/_api/Web/Lists/GetByTitle('Email_Notification_Settings')/items?$select=*&$orderby=Order0 desc";

        $(".html-email-row-removable").remove();

        $.ajax({
            url: _spPageContextInfo.webAbsoluteUrl + url,
            type: "GET",
            headers: {
                "accept": "application/json;odata=verbose",
            },
            success: function(data) {
                //console.log(data.d.results);

                $(data.d.results).each(function() {

                    if (this.Column_Type.toUpperCase() == "REASSIGNMENT EMAIL MORE INFO") {

                        var newRow = "<tr class='html-email-row-removable'><td width='650' colspan='5' style='font-family:Verdana; text-align:left;padding:14px;font-size:14px'>" +
                            "<b style='color:#002060;'><span id='htmlemail-default_message_title-reassignNotify'>" + this.Title + "</span></b>" +
                            "<p style='color:#555;' id='htmlemail-default_message_body-reassignNotify'>" +
                            this.Contents +
                            "</p>" +
                            "</td> " +
                            "</tr>";

                        $(newRow).insertAfter($("tr#htmlemail-assignmentstable_row-reassignNotify").closest('tr'));

                    } else if (this.Column_Type.toUpperCase() == "REASSIGNMENT EMAIL HEADER") {

                        $("#htmlemail-infosection-reassignNotify").html(this.Contents);

                    }

                }); //data each 


                var emailAddresses_TO = $("#htmlemail-bccd-select").select2("data");

                assignerCC = $(btn).attr("data-assignerCC");

                assignerCC = fixedDecodeUri(assignerCC);

                //console.log(fixedDecodeUri(assignerCC));



                //  $("#htmlemail-support_body").html($("#htmlemail-support_body").html().replace('(*Name of assigner*)', ""));
                send_reassigning_email_notification("Sample Subject", $("#assigned-email-address").text(), emailAddresses_TO, assignerCC);

                //var assignerName = $(".banner-template").attr("data-userdisplayname");
                //the back up ajax goes here

            },
            error: function(error) {
                console.log(JSON.stringify(error));
            }
        }); //ajax call ends

    }); //end of  $("body").on("click", "#btn-sendemail-notification", function(){



    $("body").on("click", "#btn-sendemail-notification", function() {


        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        var btn = this;

        var managerSplitName = $("#manager_displayName").text().substr(0, $("#manager_displayName").text().indexOf(' '));

        var userKeys = JSON.parse($("#tbl-assignManagerSuccessBox").attr("data-userKeys"));

        $("#htmlemail-manager_name").html(managerSplitName + ",");


        $("#htmlemail_link_to_manager_dashboard").attr("href", _spPageContextInfo.webAbsoluteUrl + "/Pages/managers-dashboard.aspx");

        var url = "/_api/Web/Lists/GetByTitle('Email_Notification_Settings')/items?$select=*&$orderby=Order0 desc";

        $(".html-email-row-removable").remove();

        $.ajax({
            url: _spPageContextInfo.webAbsoluteUrl + url,
            type: "GET",
            headers: {
                "accept": "application/json;odata=verbose",
            },
            success: function(data) {
                //console.log(data.d.results);
                var numberofWeeks = 0;
                $(data.d.results).each(function() {

                    if (this.Column_Type.toUpperCase() == "MORE INFO") {

                        var content = this.Contents;


                        var newRow = "<tr class='html-email-row-removable'><td width='650' colspan='5' style='font-family:Verdana; text-align:left;padding:14px;font-size:14px'>" +
                            "<b style='color:#002060;'><span id='htmlemail-default_message_title'>" + this.Title + "</span></b>" +
                            "<div style='color:#555;' id='htmlemail-default_message_body'>" +
                            this.Contents +
                            "</div>" +
                            "</td> " +
                            "</tr>";


                        $(newRow).insertAfter($("tr#htmlemail-assignmentstable_row").closest('tr'));

                        // $("tr#htmlemail-assignmentstable_row").closest('tr').html().replace("[dateToChange]", " today is the day");


                    } else if (this.Column_Type.toUpperCase() == "MAIN INFO") {

                        $("#htmlemail-infosection").html(this.Contents);

                    } else if (this.Column_Type.toUpperCase() == "SUPPORT INFO") {

                        $("#htmlemail-support_title").html(this.Title);
                        $("#htmlemail-support_body").html(this.Contents);

                    } else if (this.Column_Type.toUpperCase() == "DEADLINE") {

                        numberOfWeeks = parseInt(this.Contents);




                    } else if (this.Column_Type.toUpperCase() == "ASSIGNMENTS TABLE INFO") {

                        $("#htmlemail-assignmentstable_title").html(this.Title);
                        $("#htmlemail-assignmentstable_body").html(this.Contents);

                    }

                }); //data each 


                var emailAddresses_TO = $("#htmlemail-bccd-select").select2("data");

                assignerCC = $(btn).attr("data-assignerCC");
                assignerCC = fixedDecodeUri(assignerCC);

                //console.log(fixedDecodeUri(assignerCC));

                //  $("#htmlemail-support_body").html($("#htmlemail-support_body").html().replace('(*Name of assigner*)', ""));

                $("#htmlemail-default_message_body").html($("#htmlemail-default_message_body").html().replace("[dateToChange]", userKeys.submission_date));

                send_email_notification($("#htmlemail-settings-subject").val(), $("#assigned-email-address").text(), emailAddresses_TO, assignerCC);

                //var assignerName = $(".banner-template").attr("data-userdisplayname");
                //the back up ajax goes here

            },
            error: function(error) {
                console.log(JSON.stringify(error));
            }
        }); //ajax call ends




    });

    $("body").on("click", ".btn-cancel", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        var modal_close = $(this).attr("data-close");

        $("#" + modal_close).parent().hide();

    });


    $("body").on("click", "ul#jd-btnswitch-ul li", function() {

        $("ul#jd-btnswitch-ul li").removeClass("active");
        $(this).addClass("active");

        var id = $(this).attr("data-tabId");

        $(".jd-assignedmanager-tabs").hide();

        $("#" + id).fadeIn();
    });


    $("body").on("click", "li.show-comments-btn", function(e) {

        var btn_element = $(this);
        var promises = [];

        var file_id = $(this).parent().attr("id");

        ProcessingLoader.showPreloader($("#chatSupport-listbox"));


        checkAccessSetting(promises);

        $.when.apply($, promises).done(function(data) {

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
            var mfcgdid = node.Admin_Name.Name;

            if (access_type.trim().toUpperCase() == "Admin Full Access".trim().toUpperCase()) {

            } else if (access_type.trim().toUpperCase() == "Admin Default Access".trim().toUpperCase()) {

                var select_li_mfcgdid = $(btn_element).attr("data-assignedby-mfcgdid");

                if (select_li_mfcgdid != mfcgdid) {
                    alert("It seems that you don't have permission to access this resource.");
                    $(".chatbox-wrapper").hide();
                }


            }


        });


        $(".chatbox-wrapper").show();



        $(".chatbox-wrapper").css("top", (e.pageY + $('#s4-workspace').scrollTop()) - 77);
        $(".chatbox-wrapper").css("left", e.pageX - 20);

        var table = $("#jd-datatable").DataTable();

        var currentrow = $("#jd-datatable tr.active-row");

        var title = table.row(currentrow).data().Title;

        var chat_header_html =
            "<img src='" + getSharepointUserPhoto($(btn_element).attr("data-mfcgdid")) + "' style='width: 35px; height: 35px; border: 2px solid #f7f7f7; border-radius: 50%; margin-top: 3px; margin-right: 5px; position: absolute; zoom: 1.9; box-shadow: 0px 3px 2px -2px #00693c; top: 2px;' />" + //image
            "<span style='font-size:12px;color:#defd60;margin-left:73px'>" + title + "</span><br><span style='font-size:11px;color:#f3f3f3;margin-left:73px'>" + $(btn_element).attr("data-assignedto-name") + "</span>";

        $(".chatbox-header").html(chat_header_html);


        var $textarea = $("#enterNewChat-textarea");

        $textarea.attr("data-fid", file_id);

        var data_item_id = $(this).parent().attr("id");

        $(".chatbox-header").attr("data-current_itemid", data_item_id);

        SupportChat.init();
        SupportChat.loadChats(file_id);
        SupportChatPolling.pollForNewMessage(file_id, 1000, "jd-datatable");



    }); //end of button



    expandTextarea("textarea-newmessage");

    $("#textarea-newmessage").keyup(function(e) {
        var node = $(this);
        var code = e.keyCode ? e.keyCode : e.which;
        if (e.keyCode == 13 && !e.shiftKey) { // Enter keycode

            //check if text area has nothing
            if (node.val() !== "") {

                //get id 

                var message_id = node.attr("data-message-id");

                var message = node.val();
                message = message.replace(/ /g, '\u00a0');
                message = message.replace(/\n/g, "<br />");

                $(node).css("height", "45px");

                $("#textarea-newmessage").val("");

                var access_check_promises = [];

                checkAccessSetting(access_check_promises);

                runWhen_checkAccessSettingDone(access_check_promises);

                addNew_Comment(message_id, message);


                //$(".support-chat-wrapper > ul").animate({scrollTop:$(".support-chat-wrapper > ul")[0].scrollHeight}, 500);


            }
        }
    });

    $("#textarea-newmessage").on("keypress", function(e) {
        if ((e.keyCode == 13 && !e.shiftKey)) {
            e.preventDefault();
        }
    });



} //assignmanager

function record_manager_assignment(data) {




    var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/Items";

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "POST",
        headers: {
            "accept": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            "content-Type": "application/json;odata=verbose"
        },
        data: JSON.stringify(data),
        success: function(data) {

            /*   console.log(data);*/


            var peoplepicker_value = $("#peoplePickerDiv_TopSpan_HiddenInput").val();

            peoplepicker_value = JSON.parse(peoplepicker_value);

            peoplepicker_value = peoplepicker_value[0];



            var userKeysString = {
                submission_date: moment($("#duedate-assign").val()).format("MMMM Do"),
                displayName: peoplepicker_value.AutoFillDisplayText
            };

            userKeysString = JSON.stringify(userKeysString);

            var successhtml = "<table id='tbl-assignManagerSuccessBox' data-userKeys='" + userKeysString + "' class='assign-table' style='border:1px;width:100%'>" +
                "<tr>" +
                "<td colspan='2'> <strong>Success!</strong> Job Description File has been assigned and duplicated!.</td>" +
                "</tr>" +
                "<tr>" +
                "<td> File Name:</td><td> <strong>" + data.d.New_File_Name + "</strong></td>" +
                "</tr>" +
                "<tr>" +
                "<td> Assigned To: </td><td><strong id='manager_displayName'>" + peoplepicker_value.AutoFillDisplayText + "</strong></td>" +
                "</tr>" +
                "<tr>" +
                "<td> Email Address: </td><td><strong id='assigned-email-address'>" + peoplepicker_value.EntityData.Email + "</strong></td>" +
                "</tr>" +
                "<tr>" +
                "<td colspan='2'>" +
                "<div class='htmlemail-bccd-wrapper'>" +
                "<div class='htmlemail-bccd-text'>" +
                "<i class='fa fa-cogs'></i> Email Notification CC'd People" +
                "</div>" +
                "<div class='htmlemail-bccd-select-wrapper'>" +
                "<select id='htmlemail-bccd-select' multiple='' style='width: 100%;'>" +
                "</select>" +
                "</div>" +
                "</div>" +
                "</td>" +
                "</tr>" +
                "<tr>" +
                "<td colspan='2'><button data-assignerCC='" + $("#select-assignmanagerName").select2("data")[0].email + "' class='btn btn-success' id='btn-sendemail-notification'><i class='fa fa-bell'></i> Send Email Notification</button></td>"
            "</tr>" +

            "</table>";



            $("#assigning-status").removeClass("alert-info");

            $("#assigning-status").addClass("alert-success");

            $("#assigning-status").html(successhtml);



            //console.log($("#btn-sendemail-notification").data("data-emailinfo-array"));   

            $("#btn-submitassignment").prop("disabled", true);
            $(".sp-peoplepicker-delImage").click();



            $("#assign-upper-body").hide();

            getToBCCdPeoples.init("htmlemail-bccd-select");
            //load assigned managers panel on the right side
            //load_assigned_managers($("#job_code-assign").val());

            //load datatable

            /*__load_datatable(job_code);*/
            /*var job_code = $("#job_code-assign").val();
            recursive_load_datatable(job_code, "", []);*/




        },

        error: function(error) {
            $(".global-error-notification span").html(error);
            $(".global-error-notification").fadeIn('slow')
                .animate({
                    opacity: 1.0
                }, 13500)
                .fadeOut('slow', function() {
                    $(this).remove();
                });
        }
    });

} //n record_manager_assignment(){


function ensureUser(email_address) {
    var payload = {
        'logonName': 'i:0#.f|membership|' + email_address
    };
    return $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/ensureuser",
        type: "POST",
        contentType: "application/json;odata=verbose",
        data: JSON.stringify(payload),
        headers: {
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            "accept": "application/json;odata=verbose"
        }
    });
}



function send_email_notification(htmlemail_Subject, emailAddressTo, emailAddressCC, assignerCC) {


    /*    getDataUri('https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/banner/banner.jpg', function(dataUri) {
           $("#htmlemail_default_image-banner").attr("src", dataUri);
        });*/


    try {

        //get outlook and create new email
        var outlook = new ActiveXObject('Outlook.Application');
        var email = outlook.CreateItem(0);


        $(emailAddressCC).each(function() {

            var email_address = this.emailAddress;
            email.Recipients.Add(email_address).Type = 2; //2CC

        });

        email.Recipients.Add(emailAddressTo).Type = 1; //1=To
        //email.Recipients.Add(_spPageContextInfo.userEmail).Type = 2; //1=CC admin

        email.Recipients.Add(assignerCC).Type = 2; //1=CC admin



        if (_spPageContextInfo.userDisplayName == "Zeke Sebulino") {
            email.Attachments.Add("https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/banner/emailbanner.JPG");
        } else {
            email.Attachments.Add("\\\\entsserver24\\dfs\\shared\\migrate\\n02hra\\sharehr\\Staff Compensation\\James Gleason\\sharepoint\\emailbanner.JPG");
        }



        //subject and attachments
        var the_htmlemail_Subject = "Action Required: Job Documentation Review";

        email.Subject = the_htmlemail_Subject;

        //email.Attachments.Add('URL_TO_FILE', 1); //1=Add by value so outlook downloads the file from the url

        // display the email (this will make the signature load so it can be extracted)
        email.Display();

        //use a regular expression to extract the html before and after the signature
        var signatureExtractionExpression = new RegExp('/[^~]*(<BODY[^>]*>)([^~]*</BODY>)[^~]*/', 'i');

        signatureExtractionExpression.exec(email.HTMLBody);

        var beforeSignature = RegExp.$1;

        var signature = RegExp.$2;

        //set the html body of the email

        var myHtml = $("#htmlemail").html();


        email.HTMLBody = beforeSignature + myHtml + signature;

    } catch (ex) {
        //something went wrong
        //
        alert(ex);

        alert("ERROR : An error has occured : Please use internet explorer with Active X enabled");
    }
} //end of loadoutlookemailto


function send_reassigning_email_notification(htmlemail_Subject, emailAddressTo, emailAddressCC, assignerCC) {


    /*    getDataUri('https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/banner/banner.jpg', function(dataUri) {
           $("#htmlemail_default_image-banner").attr("src", dataUri);
        });*/


    try {

        //get outlook and create new email
        var outlook = new ActiveXObject('Outlook.Application');
        var email = outlook.CreateItem(0);


        $(emailAddressCC).each(function() {

            var email_address = this.emailAddress;
            email.Recipients.Add(email_address).Type = 2; //2CC

        });

        email.Recipients.Add(emailAddressTo).Type = 1; //1=To
        //email.Recipients.Add(_spPageContextInfo.userEmail).Type = 2; //1=CC admin

        email.Recipients.Add(assignerCC).Type = 2; //1=CC admin



        if (_spPageContextInfo.userDisplayName == "Zeke Sebulino") {
            email.Attachments.Add("https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/banner/emailbanner.JPG");
        } else {
            email.Attachments.Add("\\\\entsserver24\\dfs\\shared\\migrate\\n02hra\\sharehr\\Staff Compensation\\James Gleason\\sharepoint\\emailbanner.JPG");
        }



        //subject and attachments
        var the_htmlemail_Subject = "Action Required: Job Documentation Review";

        email.Subject = the_htmlemail_Subject;

        //email.Attachments.Add('URL_TO_FILE', 1); //1=Add by value so outlook downloads the file from the url

        // display the email (this will make the signature load so it can be extracted)
        email.Display();

        //use a regular expression to extract the html before and after the signature
        var signatureExtractionExpression = new RegExp('/[^~]*(<BODY[^>]*>)([^~]*</BODY>)[^~]*/', 'i');

        signatureExtractionExpression.exec(email.HTMLBody);

        var beforeSignature = RegExp.$1;

        var signature = RegExp.$2;

        //set the html body of the email

        var myHtml = $("#htmlemail-reassignNotification").html();


        email.HTMLBody = beforeSignature + myHtml + signature;

    } catch (ex) {
        //something went wrong
        //
        alert(ex);

        alert("ERROR : An error has occured : Please use internet explorer with Active X enabled");
    }
} //end of loadoutlookemailto

function notifyManager_outlookPrompt(managerEmail, ccd, assignedByCC) {


    /*    getDataUri('https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/banner/banner.jpg', function(dataUri) {
           $("#htmlemail_default_image-banner").attr("src", dataUri);
        });*/


    try {

        //get outlook and create new email
        var outlook = new ActiveXObject('Outlook.Application');
        var email = outlook.CreateItem(0);


        $(ccd).each(function() {

            var email_address = this.emailAddress;
            email.Recipients.Add(email_address).Type = 2; // CCD admin selected

        });

        email.Recipients.Add(managerEmail).Type = 1; // ADD user email to TO FIELD
        email.Recipients.Add(assignedByCC).Type = 2; // CC THE ADMIN


        if (_spPageContextInfo.userDisplayName == "Zeke Sebulino") {
            email.Attachments.Add("https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/banner/emailbanner.JPG");
        } else {
            email.Attachments.Add("\\\\entsserver24\\dfs\\shared\\migrate\\n02hra\\sharehr\\Staff Compensation\\James Gleason\\sharepoint\\emailbanner.JPG");
        }
        //email.Attachments.Add("https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/banner/banner.JPG");


        //subject and attachments
        var subject = "Reminder - Action Required: Job Documentation Review";

        email.Subject = subject;

        //email.Attachments.Add('URL_TO_FILE', 1); //1=Add by value so outlook downloads the file from the url

        // display the email (this will make the signature load so it can be extracted)
        email.Display();

        //use a regular expression to extract the html before and after the signature
        var signatureExtractionExpression = new RegExp('/[^~]*(<BODY[^>]*>)([^~]*</BODY>)[^~]*/', 'i');

        signatureExtractionExpression.exec(email.HTMLBody);

        var beforeSignature = RegExp.$1;

        var signature = RegExp.$2;

        //set the html body of the email

        var myHtml = $("#htmlemail-notifyManager").html();


        email.HTMLBody = beforeSignature + myHtml + signature;

    } catch (ex) {
        //something went wrong
        //
        alert(ex);

        alert("ERROR : An error has occured : Please use internet explorer with Active X enabled");
    }
} //end of loadoutlookemailto


function peoplePickerChange() {



    var assignmentPeoplePicker = SPClientPeoplePicker.SPClientPeoplePickerDict.peoplePickerDiv_TopSpan;

    assignmentPeoplePicker.OnValueChangedClientScript = function(peoplePickerId) {


        var peoplepicker_value = JSON.parse($("#peoplePickerDiv_TopSpan_HiddenInput").val());

        peoplepicker_value = peoplepicker_value[0];

        //console.log(peoplepicker_value);

        if (assignmentPeoplePicker.IsEmpty()) {

            $("#peoplePickerDiv_TopSpan_EditorInput").prop("disabled", false);

            $("#c1_peoplediv .error-msg-place").html("");
            $("#btn-submitassignment").prop("disabled", true);

            $("#lbl-user-email").val("");
            // $("#lbl-user-mfcgd").val("");

            return;
        }

        if (peoplepicker_value.IsResolved) {

            $("#peoplePickerDiv_TopSpan_EditorInput").prop("disabled", true);
            $("#lbl-user-email").val(peoplepicker_value.EntityData.Email);
            // $("#lbl-user-mfcgd").val(peoplepicker_value.Description);




            //check if user is already assigned to the job description
            //
            var file_name = $("#filename-assign").val();
            var _ind;
            var _type;

            if (file_name.endsWith(".docx")) {
                _ind = -5;
                _type = ".docx";
            } else if (file_name.endsWith(".doc")) {
                _ind = -4;
                _type = ".doc";
            }
            var assigned_manager_key = peoplepicker_value.EntityData.Email + "_" + $("#job_code-assign").val();
            var new_file_name = file_name.slice(0, _ind) + "_" + peoplepicker_value.Description + _type;

            var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*&$filter=AssignedManager_Key eq '" + fixedEncodeURIComponent(assigned_manager_key) + "'";
            // console.log("URL =>>>>>>>>>>>>>>>>>>>> " + url);
            $.ajax({
                url: _spPageContextInfo.webAbsoluteUrl + url,
                type: "GET",
                headers: {
                    "accept": "application/json;odata=verbose",
                },
                success: function(data) {

                    var __isAssigned = false;


                    if (data.d.results.length > 0) {

                        var _hasFileInProgress = false;

                        $(data.d.results).each(function() {
                            //recent update, i removed the "this.Status == "Submitted" || "

                            if (this.Status == "Working" || this.Status == "In-Progress" || this.Status == "Unopened") {
                                _hasFileInProgress = true;
                            }
                        });

                        if (_hasFileInProgress) {



                            var spanHTML = "<span class='err-msg' style='color: red; font-size: 11px; '>Manager is already assigned to this Job Description.</span>";

                            $("#c1_peoplediv .error-msg-place").html(spanHTML);

                            $("#btn-submitassignment").prop("disabled", true);

                            $("#btn-submitassignment").html('<i class="fa fa-user-plus"></i> Assign Manager');

                        } else {

                            $("#btn-submitassignment").html('<i class="fa fa-user-plus"></i> Re-Assign Manager');

                            $("#c1_peoplediv .error-msg-place").html("");

                            $("#btn-submitassignment").prop("disabled", false);
                        }


                    } else {

                        $("#c1_peoplediv .error-msg-place").html("");

                        $("#btn-submitassignment").prop("disabled", false);

                        $("#btn-submitassignment").html('<i class="fa fa-user-plus"></i> Assign Manager');

                    }


                },
                error: function(error) {
                    $(".global-error-notification span").html(error);
                    $(".global-error-notification").fadeIn('slow')
                        .animate({
                            opacity: 1.0
                        }, 13500)
                        .fadeOut('slow', function() {
                            $(this).remove();
                        });
                }
            });


        } else {

            var spanHTML = "<span class='err-msg' style='color: red; font-size: 11px; '>User not found!.</span>";
            $("#c1_peoplediv .error-msg-place").html(spanHTML);
        }
    };


} //peoplepickerchange




function _closed_selected_file(id, status) {

    var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/getItemById('" + id + "')";

    //updated data to pass
    var data = {
        __metadata: {
            'type': 'SP.Data.File_x005f_AssignmentsListItem'
        },
        Status: status
    };

    return $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "PATCH",
        headers: {
            "accept": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            "content-Type": "application/json;odata=verbose",
            "X-Http-Method": "PATCH",
            "If-Match": "*"
        },
        data: JSON.stringify(data),
        success: function(data) {
            /* console.log(data);*/
            var job_code = $("#jd-datatable tr.active-row").attr("data-job_code_value");
            var jdf_id = $("#jd-datatable tr.active-row").attr("id").replace(/\D/g, '');

            updateJDF_assigned_managers_column(job_code, jdf_id)

            alert("Entry has been successfully closed" + '\n' + "You will see the closed entries on history tab.");
        },
        error: function(error) {
            $(".global-error-notification span").html(error);
            $(".global-error-notification").fadeIn('slow')
                .animate({
                    opacity: 1.0
                }, 13500)
                .fadeOut('slow', function() {
                    $(this).remove();
                });
        }
    }); //end of AJAX update call

} //close selected file

function _delete_selected_file(id, filename) {

    var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/getItemById('" + id + "')";

    var call = $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "DELETE",
        headers: {
            "accept": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            "If-Match": "*"
        }
    }); //ajax call

    call.done(function() {

        var siteUrl = _spPageContextInfo.webAbsoluteUrl;

        var webRelUrl = _spPageContextInfo.webServerRelativeUrl;

        var fullUrl = siteUrl + "/_api/web/GetFileByServerRelativeUrl('" + webRelUrl + "/Job_Description_Files/versions/" + filename + "')";

        $.ajax({
            url: fullUrl,
            type: "POST",
            headers: {
                "accept": "application/json;odata=verbose",
                "content-type": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "X-HTTP-Method": "DELETE",
                "IF-MATCH": "*"
            },
            success: function(data) {
                var job_code = $("#jd-datatable tr.active-row").attr("data-job_code_value");
                var jdf_id = $("#jd-datatable tr.active-row").attr("id").replace(/\D/g, '');

                updateJDF_assigned_managers_column(job_code, jdf_id)
                $('.smartNotifications').notifyMe({
                    class: 'success',
                    message: 'Entry has been successfully deleted!'
                });
            },
            error: function(error) {
                console.log(JSON.stringify(error));
            }

        });
    }); //call.done

    return call;

}



function update_jobdescription_selected(old_job_code, Updated_data, promises) {

    $("#update-success-edit-jd").remove();

    var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/items?$filter=Job_Code eq '" + old_job_code + "'";

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {

            $(data.d.results).each(function() {

                var promise = $.ajax({
                    url: this.__metadata.uri,
                    type: "PATCH",
                    headers: {
                        "accept": "application/json;odata=verbose",
                        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                        "content-Type": "application/json;odata=verbose",
                        "X-Http-Method": "PATCH",
                        "If-Match": "*"
                    },
                    data: JSON.stringify(Updated_data),
                    success: function(data) {

                    },
                    error: function(error) {
                        $(".global-error-notification span").html(error);
                        $(".global-error-notification").fadeIn('slow')
                            .animate({
                                opacity: 1.0
                            }, 13500)
                            .fadeOut('slow', function() {
                                $(this).remove();
                            });
                    }
                }); //end of AJAX update call

                promises.push(promise);


            }); //data.d.results

            $.when.apply($, promises)
                .done(function() {




                    var table = $("#jd-datatable").DataTable();
                    var currentrow = $("#jd-datatable tr.active-row");

                    table.row(currentrow).data().Job_Code = $("#text_job_code-edit").val();
                    table.row(currentrow).data().Title = $("#text_job_title-edit").val();
                    table.row(currentrow).data().Job_Grade = $("#text_job_grade-edit").val();
                    table.row(currentrow).data().Job_Family_Group = $("#select_job_family_group-edit").val();
                    table.row(currentrow).data().Job_Family = $("#select_job_family-edit").val();
                    table.row(currentrow).data().Career_Path = $("#select_career_path-edit").val();
                    table.row(currentrow).data().Country = $("#select_country-edit").val();

                    table.row(currentrow).data().DT_RowAttr['data-job_code_value'] = Updated_data.Job_Code;

                    table.row(currentrow).invalidate();
                    table.draw();


                    $("#job_selected_current > span").text(table.row(currentrow).data().Title + " - " + table.row(currentrow).data().Job_Code);


                    //console.log("TEST");


                    var job_code = $("#text_job_code-edit").val();

                    //recursive_load_datatable(job_code,"", []);
                    var jdf_id = $("#btn-edit-jd").attr("data-id");
                    load_additional_info(jdf_id);




                    var job_code = $("#jd-datatable tr.active-row").attr("data-job_code_value");

                    load_assigned_managers(job_code);
                    load_assigned_managers_history(job_code);


                    if ($("#replaceJobFile-checkbox").prop("checked")) {
                        ReplaceJobFile.replaceFile();
                        return;
                    }

                    var success_html = "<div id='update-success-edit-jd' style='padding:15px'>" +
                        "<div class='alert alert-success' style='margin-bottom:0 !important'>" +
                        "Update has been successfully saved!" +
                        "</div>" +
                        "</div>";

                    $("#edit-jd-modal-content").fadeOut();
                    $("#select_job_family-edit").prop("disabled", true);
                    $("#edit-jd-modal-content").parent().append(success_html);
                });


        },
        error: function(error) {
            ajaxFailureError(error);
        }
    });



} //update_jobdescription_selected

function update_file_assignments_with_job_code(old_job_code, Updated_data, promises2) {

    var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$filter=Job_Code eq '" + old_job_code + "'";

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {

            $(data.d.results).each(function() {

                var promise = $.ajax({
                    url: this.__metadata.uri,
                    type: "PATCH",
                    headers: {
                        "accept": "application/json;odata=verbose",
                        "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                        "content-Type": "application/json;odata=verbose",
                        "X-Http-Method": "PATCH",
                        "If-Match": "*"
                    },
                    data: JSON.stringify(Updated_data),
                    success: function(data) {

                    },
                    error: function(error) {
                        ajaxFailureError(error);
                    }
                }); //end of AJAX update call

                promises2.push(promise);



            }); //data.d.results

            $.when.apply($, promises2)
                .done(function() {

                    $("#jd-datatable tr.active-row").attr("data-job_code_value", Updated_data.Job_Code);

                    // $("#edit-jd-modal-content").html("<h1>B</h1>");
                });

        },
        error: function(error) {

            ajaxFailureError(error);
        }
    });



} //update_file_assignments


function load_comments_of_selected_file(id, requestElementChecker_element) {




    var url = "/_api/Web/Lists/GetByTitle('File_comments')/Items?$select=*&$filter=File_Assignment_ID eq '" + id + "'&$orderby=Created asc";

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {


            $("ul.chatbox-list").html("");
            if (data.d.results.length < 1) {
                $(".preloader_ajax").remove();
                $("ul.chatbox-list").append("<li style='color: #3fa287; '>No conversation recorded on this file.</li>");
            }



            $(data.d.results).each(function(i) {

                var message = this.Message_Body;
                var timestamp = this.Created;
                var messaged_by = this.Messaged_By;

                var user = "user";
                var timestamp_location = "left";

                if (messaged_by == 1) {
                    user = "admin";
                    timestamp_location = "right";
                }

                timestamp = moment(timestamp).fromNowOrNow();

                var chatHTML_sender = "" +
                    "<li>" +
                    "<div class='chat-msg-" + user + " support-chat-box' >" +
                    "<div class='chat-msg-text'>" +
                    "<p>" + message + "</p>" +
                    "</div>" +
                    "</div>" +
                    "<div class='chat-msg-timestamp " + timestamp_location + "-timestamp'>" +
                    "<p>" + timestamp + "</p>"
                "</div>"
                "</li>";

                $("ul.chatbox-list").append(chatHTML_sender);

                if (i == data.d.results.length - 1) $("textarea.chatbox-textarea-input").attr("data-lastitem-id", this.ID);

            }); //end of each function

            $("ul.chatbox-list").scrollTop($("ul.chatbox-list")[0].scrollHeight);


            var parentWidth = parseInt($(".support-chat-box").parent().outerWidth());

            var pixels = parentWidth * (85 / 100);

            $(".chat-msg-text > p").css("max-width", pixels);

            $(".preloader_ajax").remove();


        },
        complete: function() {
            if (requestElementChecker_element) {
                requestElementChecker_element.data("ajax_requestRunning", false);
            }
        },
        error: function(error) {
            $(".global-error-notification span").html(error);
            $(".global-error-notification").fadeIn('slow')
                .animate({
                    opacity: 1.0
                }, 13500)
                .fadeOut('slow', function() {
                    $(this).remove();
                });
        }
    });


    moment.fn.fromNowOrNow = function(a) {
        if (Math.abs(moment().diff(this)) < 1000) { // 1000 milliseconds
            return 'just now';
        }
        return this.fromNow(a);
    }

} //load_comments_of_selected_file


function expandTextarea(id) {
    document.getElementById(id).addEventListener('keyup', function() {
        this.style.overflow = 'hidden';
        this.style.height = 0;
        this.style.height = this.scrollHeight + 'px';
    }, false);
}


function addNew_Comment(message_id, message_body) {

    var url = "/_api/Web/Lists/GetByTitle('File_comments')/Items";

    var data = {
        __metadata: {
            'type': 'SP.Data.File_x005f_commentsListItem'
        },
        Title: 'Default',
        File_Assignment_ID: message_id,
        Messaged_By: 1,
        Message_Body: message_body,
        AssignedManagerId: _spPageContextInfo.userId
    };

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "POST",
        headers: {
            "accept": "application/json;odata=verbose",
            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
            "content-Type": "application/json;odata=verbose"
        },
        data: JSON.stringify(data),
        success: function(data) {
            /* console.log(data);*/
            load_comments_of_selected_file(message_id);

        },
        error: function(error) {
            console.log(JSON.stringify(error));

        }
    });
} //add new comment




var polling_interval = null;

function polling__(id) {


    if (polling_interval != null) {
        clearInterval(polling_interval);
    }



    polling_interval = setInterval(function() {

        var tableisactive = false;

        $("#jd-datatable tr").each(function() {

            if ($(this).hasClass("active-row")) {
                tableisactive = true;
            }

        });

        if (!tableisactive) {
            clearInterval(polling_interval);
        }

        check_message_polling(id);

    }, 1000);




}

function check_message_polling(id) {
    //start polling
    //check if an entry was saved on the list : filtered via "File_Assignment ID"  then check if last item created is equal to : top1

    var url = "/_api/Web/Lists/GetByTitle('File_comments')/Items?$select=*&$filter=File_Assignment_ID eq '" + id + "'&$orderby=Created desc&$top=1";

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {

            if (data.d.results.length < 1) return;

            var node = data.d.results[0];

            // console.log(node.ID);
            //alert(node.ID == $("#textarea-newmessage").attr("data-lastitem-id"));



            if (node.ID != $("#textarea-newmessage").attr("data-lastitem-id")) {

                load_comments_of_selected_file(node.File_Assignment_ID);

            }
        },
        error: function(error) {
            $(".global-error-notification span").html(error);
            $(".global-error-notification").fadeIn('slow')
                .animate({
                    opacity: 1.0
                }, 13500)
                .fadeOut('slow', function() {
                    $(this).remove();
                });
        }
    });

} // message polling


function scroll_then_fixed() {
    //codes for scroll then fix

    var old_top = 0;

    //old_width =  $('.jd-box-right').outerWidth();
    //
    $('#s4-workspace').scroll(function() {



        var elementPosition = $('.jd-box-right').offset();

        var subtractTop = -95;
        if ($("#filter-jd-advanced").is(":visible")) {
            // subtractTop = 200;
        }

        var element_top = (elementPosition.top + $('#s4-workspace').scrollTop()) - 95;




        if ($('.jd-box-right').css('position') == "fixed") {

            element_top = old_top;
        }

        //console.log($('#s4-workspace').scrollTop() + " > " + element_top);

        /*  var chatOffset = $(".chatbox-wrapper").offset();
          var chatBox = $(".chatbox-wrapper");
          var chat_oldTop = chatOffset.top;
          var chat_oldleft = chatOffset.left;*/
        if ($('#s4-workspace').scrollTop() > element_top) {

            $('.jd-box-right').css('position', 'fixed').css('top', '95px').css("right", "15px").css("min-width", "400px").css("z-index", "99");
            var top = parseInt($('.chatbox-wrapper').css("top"));



            /* chatBox.css({
               position: "fixed",
               top: chatOffset.top + 140,
               left: chatOffset.left + 460
             });*/

            old_top = element_top;

        } else {

            /*  chatBox.css({
                position: "absolute",
                top: chat_oldTop,
                left: chat_oldleft
              });*/

            $('.jd-box-right').css('position', 'static');
            $('.jd-box-right').css("min-width", "0");



        }
    });
} //scrolll then fixed



function filter_datatable() {


    $("#select_filter-grade").select2({
        placeholder: "by Grade",
        allowClear: true
    });

    load_filter_grade();



    /*
$('#select_filter-grade').on('select2:opening', function (e) {

  // Do something
  




});*/

    load_job_family_select2filter(); // LATER CALL

    //load_selections_on_filter("Country", "select_filter-country");
    load_selections_on_filter("Career_Path", "select_filter-career_family");
    load_selections_on_filter("Job_Family_Group", "select_filter-job_family_group");


    load_filter_uploaded_by();
    load_filter_assigned_by();
    load_filter_assigned_to();

    /*;*/
    load_filter_country();


    $("#date_filter-uploaddate_from").datepicker({
        dateFormat: 'MM dd, yy'
    });




    $("#date_filter-uploaddate_from").bind("propertychange change click keyup input paste", function(event) {
        var fromDate = $(this).val();

        if (fromDate == "") {
            fromDate = moment().format("MMMM Do YYYY");
        }


        var toDate = moment().format("MMMM Do YYYY");


        if ($("#date_filter-uploaddate_to").val() != "") {
            toDate = $("#date_filter-uploaddate_to").val();
        }

        $("#select_filter-monthdayyear").text(fromDate + " - " + toDate);

    });



    $("#date_filter-uploaddate_to").bind("propertychange change click keyup input paste", function(event) {


        var toDate = $(this).val();

        if (toDate == "") {
            toDate = moment().format("MMMM Do YYYY");
        }
        var fromDate = moment().format("MMMM Do YYYY");

        if ($("#date_filter-uploaddate_from").val() != "") {
            fromDate = $("#date_filter-uploaddate_from").val();
        }

        $("#select_filter-monthdayyear").text(fromDate + " - " + toDate);

    });


    $("#date_filter-uploaddate_to").datepicker({
        dateFormat: 'MM dd, yy'
    });


    $("#duedate-assign").datepicker({
        dateFormat: 'MM dd, yy',
        minDate: 0
    });

    $("#duedate-assign").val(moment().add(14, 'days').format("LL")); //set default duedate


    $("#select_filter-finalversion").select2({
        placeholder: "by Final Version",
        allowClear: true
    });



    $("#select_filter-filetype").select2({
        placeholder: "by File Type",
        allowClear: true
    });


    $("#select_filter-exemption").select2({
        placeholder: "by Exemption",
        allowClear: true
    });

    $('#select_filter-job_family').select2({
        placeholder: "by Job Family"
    });

    $('#select_filter-country').select2({
        placeholder: "by Country"
    });

    $('#select_filter-job_family_group').select2({
        placeholder: "by Job Family Group"
    });

    $('#select_filter-career_family').select2({
        placeholder: "by Career_Family"
    });


    $('#select_filter-uploadedby').select2({
        placeholder: "by Uploaded By"
    });

    $('#select_filter-assignedby').select2({
        placeholder: "by Assigned By"
    });




    //just clearing the filters
    $("#text_filter-grade").val("");
    $("#filter-jd-box select").val('').trigger('change');
    $("#filter-jd-box input").val("");


    $("body").on("click", "#filter-datatable", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        $("#filter-jd-box select").each(function() {
            if ($(this).val() != "") {
                $(this).parent().find("span.select2-selection.select2-selection--multiple").css("border", "2px solid #4cae4c");
            }
        });

        $("#jd-datatable tbody").html("<tr><td  align='center' colspan='10'>" +
            "<img src='https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/preloaders/preloader_spinner.gif' data-themekey='#' style='text-align: center;'></td></tr>");
        $(".preloader_ajax").remove();

        var preloader_ajax = "" +
            "<div class='preloader_ajax' style='text-align:center'>" +
            "<p style=' color: #34a3da; background: #fbfeff; border: 1px solid #b6e8ff; padding: 10px; border-radius: 3px; '>Select a row in the Job File Table</p>" +
            "</div>";

        $(".jd-assignedmanager-tabs").prepend(preloader_ajax);
        $("#assignedmanager-list").html("");
        $("#assignedmanager-list-history").html("");

        var country_filter = "";
        var grade_filter = "";
        var job_family_group_filter = "";
        var final_version_filter = "";


        var filterby_country = $("#select_filter-country").val(); //array
        var filterby_grade = $("#select_filter-grade").val(); //array
        var filterby_jobfamilygroup = $("#select_filter-job_family_group").val(); //array
        var filterby_jobfamily = $("#select_filter-job_family").val(); //array
        var filterby_career_family = $("#select_filter-career_family").val(); //array
        var filterby_finalversion = $("#select_filter-finalversion").val();
        var filterby_filetype = $("#select_filter-filetype").val();
        var filterby_exemption = $("#select_filter-exemption").val();
        var filterby_uploadedby = $("#select_filter-uploadedby").val(); //array 
        var filterby_assignedby = $("#select_filter-assignedby").val(); //array 
        var filterby_assignedto = $("#select_filter-assignedto").val(); //array 
        var filterby_uploadeddate_from = $("#date_filter-uploaddate_from").val();
        var filterby_uploadeddate_to = $("#date_filter-uploaddate_to").val();


        var assignedby_query = "";
        var assignedto_query = "";

        if (filterby_assignedby != "") {

            //console.log(filterby_assignedby);

            var assignedby_data = $("#select_filter-assignedby").select2("data"); //array

            assignedby_query = formatQuery(assignedby_data, assignedby_query);
        }


        if (filterby_assignedto != "") {

            //console.log(filterby_assignedto);

            var assignedto_data = $("#select_filter-assignedto").select2("data"); //array

            assignedto_query = formatQuery(assignedto_data, assignedto_query);
        }




        function formatQuery(data, var_query) {

            var job_codes = [];
            //if(!(select2Data[_index].job_codes.indexOf(job_code) > -1)){
            $(data).each(function() {
                $.merge(job_codes, this.job_codes);
            });

            job_codes = removeDuplicates(job_codes);


            var_query = generateQuery(job_codes, "Job_Code");

            //console.log(var_query);

            return var_query;

        }


        /*
https://mfc.sharepoint.com/sites/JobLibrary/_api/Web/Lists/GetByTitle('Job_Description_Files')/Items?$filter=Created ge 2018-02-08T00:00:00.000Z and Created 2018-02-09T00:00:00.000Z */


        var country_query = generateQuery(filterby_country, "Country");

        var grade_query = generateQuery(filterby_grade, "Job_Grade");

        var jobfamilygroup_query = generateQuery(filterby_jobfamilygroup, "Job_Family_Group");

        var jobfamily_query = generateQuery(filterby_jobfamily, "Job_Family");

        var careerfamily_query = generateQuery(filterby_career_family, "Career_Path");

        var uploadedby_query = generateQuery(filterby_uploadedby, "Author/Title");




        function generateQuery(arrayField, columnName) {

            var queryString = "";

            $(arrayField).each(function(i) {

                i == 0 ? queryString = "(" + columnName + " eq '" + encodeURIComponent(this) + "'" : queryString = queryString + " or " + columnName + " eq '" + this + "'";

                if (arrayField.length - 1 == i) {
                    queryString = queryString + ")";
                }
            });

            queryString == "" ? queryString = "" : queryString = " and " + queryString;

            return queryString;
        } //generateQuery


        //Created ge 2018-02-08T00:00:00.000Z and Created 2018-02-09T00:00:00.000Z

        //get the date



        if (filterby_uploadeddate_from != "" || filterby_uploadeddate_to != "") {

            // date format is ISO 8601

            if (filterby_uploadeddate_from == "") {

                filterby_uploadeddate_from = moment().format("YYYY-MM-DD") + "T00:00:00.000";

            } else {

                filterby_uploadeddate_from = moment(filterby_uploadeddate_from).format("YYYY-MM-DD") + "T00:00:00";
            }

            if (filterby_uploadeddate_to == "") {

                filterby_uploadeddate_to = moment().format("YYYY-MM-DD") + "T23:59:59.000";

            } else {
                filterby_uploadeddate_to = moment(filterby_uploadeddate_to).format("YYYY-MM-DD") + "T23:59:59";
            }

            filterby_uploadeddate_from = moment(filterby_uploadeddate_from).toISOString();
            filterby_uploadeddate_to = moment(filterby_uploadeddate_to).toISOString();




            // nextDayDate = moment(nextDayDate).format("YYYY-MM-DD");


            filterby_uploadeddate_from = " and (Created ge '" + filterby_uploadeddate_from + "' and Created le '" + filterby_uploadeddate_to + "')";

        } else {
            filterby_uploadeddate_from = "";
        }




        //get the next day

        //create the filter

        //console.log(country_query);
        //console.log(jobfamilygroup_query);
        //console.log(jobfamily_query);
        //console.log(careerfamily_query);
        //console.log(uploadedby_query);
        //console.log(filterby_filetype);
        //console.log(assignedby_query);
        //console.log(assignedto_query);

        // filterby_grade.trim() != "" ? filterby_grade = " and (Job_Grade eq '" + encodeURIComponent(filterby_grade) + "')" : filterby_grade = "";
        filterby_filetype != null ? filterby_filetype = " and (File_Type eq '" + encodeURIComponent(filterby_filetype) + "')" : filterby_filetype = "";
        filterby_finalversion != null ? filterby_finalversion = " and (Final_Version eq '" + encodeURIComponent(filterby_finalversion) + "')" : filterby_finalversion = "";
        filterby_exemption != null ? filterby_exemption = " and (Exemption_Status eq '" + encodeURIComponent(filterby_exemption) + "')" : filterby_exemption = "";

        var final_filter_query = country_query +
            grade_query +
            jobfamilygroup_query +
            jobfamily_query +
            filterby_finalversion +
            filterby_filetype +
            filterby_exemption +
            careerfamily_query +
            uploadedby_query +
            assignedby_query +
            assignedto_query +
            filterby_uploadeddate_from;




        final_filter_query.trim() == "" ? final_filter_query = "$filter=(Entry_Type eq 1)" : final_filter_query = "$filter=(Entry_Type eq 1)" + final_filter_query;

        //console.log(final_filter_query);

        recursive_load_datatable('', final_filter_query, []);
    });


    $('#select_filter-job_family_group').on('change', function() {

        var selectedJobFamilyGroup = this.value;

        //console.log(selectedJobFamilyGroup + " V S " + encodeURIComponent(selectedJobFamilyGroup));

        var alt_url = "/_api/Web/Lists/GetByTitle('Job_Family')/Items?$select=*&$filter=Job_Family_Group eq '" + encodeURIComponent(selectedJobFamilyGroup) + "'";


        //load_selections_on_filter("Job_Family", "select_filter-job_family", alt_url);

        // loadSelectedJobFamily(selectedJobFamilyGroup);

    });




    $("body").on("click", "#filter-clear", function() {

        event.preventDefault ? event.preventDefault() : (event.returnValue = false);

        //$("#select_filter-job_family").prop("disabled",true);
        $("#text_filter-grade").val("");


        $("#filter-jd-box select").val('').trigger('change');
        $("#filter-jd-box input").val("");

        $("button#select_filter-monthdayyear").text("Filter by Date")


        //$("#jd-datatable tbody").html("<tr><td  align='center' colspan='10'>"+ 
        //"<img src='https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/preloaders/preloader_spinner.gif' data-themekey='#' style='text-align: center;'></td></tr>");


        recursive_load_datatable("", "", []);
    });


} //filter datatable end


function load_job_family_select2filter() {

    var alt_url = "/_api/Web/Lists/GetByTitle('Job_Family')/Items?$select=*";

    load_selections_on_filter("Job_Family", "select_filter-job_family", alt_url);

} //load job family select2

function load_selections_on_filter(field, element, alt_url) {

    var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/fields?$filter=EntityPropertyName eq '" + encodeURIComponent(field) + "'";

    if (alt_url) {
        url = alt_url;
    }

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {


            if (alt_url) {
                //$("#"+element).html("<option value='0' disabled selected>-- Filter by Job Family --</option>");
                //$("#"+element).prop("disabled", false);

                $(data.d.results).each(function() {

                    var optionHTML = "<option value='" + this.Title + "'>" + this.Title + "</option>";
                    $("#" + element).append(optionHTML);

                });

            } else {
                $(data.d.results[0].Choices.results).each(function() {
                    //console.log(this);
                    var optionHTML = "<option value='" + this + "'>" + this + "</option>";
                    $("#" + element).append(optionHTML);
                });
            }
        },
        error: function(error) {
            $(".global-error-notification span").html(error);
            $(".global-error-notification").fadeIn('slow')
                .animate({
                    opacity: 1.0
                }, 13500)
                .fadeOut('slow', function() {
                    $(this).remove();
                });
        }
    });
} //load_selections_on_filter


function check_job_code_autofill(job_code, edit_var) {

    var url = "/_api/Web/Lists/GetByTitle('Job_Code_Autofill')/Items?$select=*&$filter=Job_Code eq '" + job_code + "'";

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {
            if (data.d.results.length > 0) {

                var node = data.d.results[0];

                $("#text_job_title" + edit_var).val(node.Title);

                $("#text_job_grade" + edit_var).val(node.Grade);

                $("#select_job_family_group" + edit_var).val(node.Job_Family_Group).trigger('change');


                var _promises = [];
                loadSelectedJobFamily(node.Job_Family_Group, _promises);

                $.when.apply($, _promises).done(function() {
                    $("#select_job_family" + edit_var).val(node.Job_Family).trigger('change');
                });

                $("#select_career_path" + edit_var).val(node.Career_Family).trigger('change');
                $("#select_country" + edit_var).val(node.Country).trigger('change');

                if (node.Exemption_Status != null) {
                    if (node.Exemption_Status.indexOf("Non-Exempt") > -1) {

                        $("#select_exemption_status" + edit_var).val('Non-Exempt').trigger('change');

                    } else if (node.Exemption_Status.indexOf("Exempt") > -1) {
                        $("#select_exemption_status" + edit_var).val('Exempt').trigger('change');
                    }
                }


            } else {

                $("#text_job_title" + edit_var).val("");
                $("#text_job_grade" + edit_var).val("");
                $("#select_job_family_group" + edit_var).val('').trigger('change');
                $("#select_job_family" + edit_var).val('').trigger('change');
                $("#select_career_path" + edit_var).val('').trigger('change');
                $("#select_country" + edit_var).val('').trigger('change');
                //$("#select_file_type"+edit_var).val('Job Description').trigger('change');
                $("#select_exemption_status" + edit_var).val('').trigger('change');
                $("#select_final_version" + edit_var).val('').trigger('change');
            }
        },
        error: function(error) {
            console.log(JSON.stringify(error));
        }
    });
} //check_job_code_autofill



function load_filter_uploaded_by() {
    var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/items?$select=*,Author/Title&$expand=Author&$top=5000";

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {

            var authorNames = [];

            $(data.d.results).each(function() {

                var author = this.Author.Title;

                //alert(authorNames.indexOf(author) > -1);
                //

                if (!(authorNames.indexOf(author) > -1)) {
                    $("#select_filter-uploadedby").append("<option>" + author + "</option>");
                }

                authorNames.push(author);


            });
        },
        error: function(error) {
            console.log(JSON.stringify(error));
        }
    });
} //load_filter_uploaded_by

function load_filter_assigned_to() {
    var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*,AssignedManager/Title&$expand=AssignedManager&$orderby=AssignedManagerId asc&$top=5000";

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {

            var assignedTo_names = [];

            var select2Data = [];
            var job_codes = [];




            $(data.d.results).each(function() {

                var node = this;
                var assignedto = this.AssignedManager.Title;
                var assignedto_id = this.AssignedManagerId;
                var job_code = this.Job_Code;

                //create a new obj
                var obj = {};


                //just getting the index
                var _index = assignedTo_names.indexOf(assignedto);



                if (!(_index > -1)) {
                    //$("#select_filter-assignedby").append("<option data-assignedby_id='"+ assignedby_id +"'>"+ assignedby +"</option>");

                    obj.id = assignedto_id;
                    obj.text = assignedto;
                    obj.job_codes = [];
                    obj.job_codes.push(job_code);

                    select2Data.push(obj);

                    assignedTo_names.push(assignedto);

                } else {

                    //console.log("TTTTTTTTTTT => " + select2Data[_index].job_codes.indexOf(job_code) > -1);

                    if (!(select2Data[_index].job_codes.indexOf(job_code) > -1)) {
                        select2Data[_index].job_codes.push(job_code);
                    }



                }


            }); //each function


            $('#select_filter-assignedto').select2({
                placeholder: "by Assigned Manager",
                data: select2Data
            });

        },
        error: function(error) {
            console.log(JSON.stringify(error));
        }
    });
} //load_filter_uploaded_by


function load_filter_assigned_by() {

    var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*,AssignedBy/Title&$expand=AssignedBy&$orderby=AssignedById asc&$top=5000";

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {

            var assignedBy_names = [];

            var select2Data = [];
            var job_codes = [];




            $(data.d.results).each(function() {

                var node = this;
                var assignedby = this.AssignedBy.Title;
                var assignedby_id = this.AssignedById;
                var job_code = this.Job_Code;

                //create a new obj
                var obj = {};


                //just getting the index
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


            }); //each function




        },
        error: function(error) {
            console.log(JSON.stringify(error));
        }
    });
} //load_filter_uploaded_by

function load_filter_grade() {

    var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/items?$select=Job_Grade&$top=5000";

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {

            var grades = [];

            $(data.d.results).each(function() {

                var grade = this.Job_Grade;

                //alert(authorNames.indexOf(author) > -1);
                //
                if (grade == null) return;

                if (!(grades.indexOf(grade) > -1)) {
                    $("#select_filter-grade").append("<option>" + grade + "</option>");
                }

                grades.push(grade);


            });
        },
        error: function(error) {
            console.log(JSON.stringify(error));
        }
    });
} //load_filter_uploaded_by

function load_filter_country() {
    //alert();
    var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/items?$select=Country&$top=5000&$filter=Entry_Type eq '1'";

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {

            var countries = [];
            //console.log("&^&^**^&^&^&^&*^^&");
            $(data.d.results).each(function() {

                var country = this.Country;

                //alert(authorNames.indexOf(author) > -1);
                //
                //console.log("COUNTRY : " + country);

                if (country == null) return;

                if (!(countries.indexOf(country) > -1)) {
                    $("#select_filter-country").append("<option>" + country + "</option>");
                }

                countries.push(country);


            });
        },
        error: function(error) {
            console.log(JSON.stringify(error));
        }
    });
} //load_filter_uploaded_by

function groupBy(items, propertyName) {
    var result = [];
    $.each(items, function(index, item) {
        if ($.inArray(item[propertyName], result) == -1) {
            result.push(item[propertyName]);
        }
    });
    return result;
}


function __body_mouseupevent() {

    $('body').mouseup(function(e) {

        var _container = $(".link-edit-with-choice");
        if (!_container.is(e.target) && _container.has(e.target).length === 0) {
            _container.hide();
        }

        var _container2 = $(".chatbox-wrapper");
        if (!_container2.is(e.target) && _container2.has(e.target).length === 0) {
            _container2.hide();
            if (polling_interval != null) {
                clearInterval(polling_interval);
            }

            SupportChatPolling.stopPoll();
        }

        var _container3 = $(".jd-dropdown-wrapper");
        if (!_container3.is(e.target) && _container3.has(e.target).length === 0) {
            _container3.hide();
        }

        var _container3 = $(".ms-openDocIn");
        if (!_container3.is(e.target) && _container3.has(e.target).length === 0) {
            _container3.hide();
        }

        var _container3 = $(".am-action-btns-list");
        if (!_container3.is(e.target) && _container3.has(e.target).length === 0) {
            _container3.hide();
        }




    });

} //__body_mouseupevent


function load_ResourcesDatatable() {

    var url = "/_api/Web/Lists/GetByTitle('Resources_List')/Items?$select=*&$orderby=Order0 asc";

    $("#resources_datatable").html("");
    var call_for_resourcesDatatable = $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {
            //console.log(data);

            var appendItems = $();

            $(data.d.results).each(function() {

                var href = this.Link;
                var title = this.Title;
                //console.log(this.Link);
                if (title == null) title = "";
                if (href == null) href = "";

                appendItems = appendItems.add("<div class='resourceLinks-item'><a href='" + href + "'> <i class='fa fa-link'></i> " + title + "</a></div>");


            });
            // console.log(appendItems);

            $("#resources_datatable").append(appendItems);

            /*$('#resources_datatable').DataTable({
                         "destroy": true,
                         "processing": true,
                         "paging":   false,
                         "ordering": false,
                         "info":     false,
                         "lengthMenu": [[10, 20, 100, -1], [10, 20, 100, "All"]],
                         "data": data.d.results,
                         "searching": false,
                         "columns" : [
                            { "data" : null, "render": function(data){

                             //var href = "ms-word:ofe|u|" + _spPageContextInfo.webAbsoluteUrl + "/Job_Description_Files/" + data.FileLeafRef;
                             var href = data.Link;
                             var linkhtml = "";
                             var title = "";

                             title = data.Title;

                             if(data.Title == null) title = "";
                             if(data.Link == null) href = "";


                             var linkhtml = "<a target='_blank' href='"+ href +"'><i class='fa fa-link'></i> " + title +"</a>";

                             var __data = linkhtml;
                               return __data;
                             }
                             ,
                             "width" : "100%"
                           },
                         ],
                        "aaSorting": []
               }); //datatable end*/
        },
        error: function(error) {
            alert(JSON.stringify(error));
        }
    }); //ajax call

    call_for_resourcesDatatable.done(function() {
        //check if 
        //
        var endpointUrl = _spPageContextInfo.webServerRelativeUrl + '/_api/web/currentuser/?$expand=groups';

        var ajaxcall = $.ajax({
            url: endpointUrl,
            method: "GET",
            contentType: "application/json;odata=verbose",
            headers: {
                "Accept": "application/json;odata=verbose"
            }
        });

        ajaxcall.done(function(data) {

            var groupNames = ['Access_Group_Job_Description_Project'];
            //determine wether current user is a memeber of group(s) 
            var userGroups = data.d.Groups.results;
            var foundGroups = userGroups.filter(function(g) {
                return groupNames.indexOf(g.LoginName) > -1
            });
            // console.log(foundGroups);

            if (foundGroups.length > 0) {
                $("#jdp_box").show();
            } else {
                $("#jdp_box").remove();
            }
        });

    });



} // load_ResourcesDatatable


function __autoRunAtFirst_updatesAllAssignedManagers_column() {

    var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/items?$select=*&$top=5000";


    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {
            // console.log("length : " + data.d.results.length);
            $(data.d.results).each(function() {
                updateJDF_assigned_managers_column(this.Job_Code, this.Id);
            });
        },
        error: function(error) {
            alert(JSON.stringify(error));
        }
    });

}

function updateJDF_assigned_managers_column(job_code, jdf_id) {

    //get job_code of the jdf needs to be updated

    //get the id of the jdf needs for updating later

    //set url endpoint
    //
    //console.log("******** STATE: " + job_code + " and " + jdf_id);

    var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*&$filter=Job_Code eq '" + job_code + "'";

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        dataType: "json",
        headers: {
            "accept": "application/json;odata=verbose",
        }
    }).done(function(data) {

        var assigned_managers_states = "";
        if (data.d.results.length > 0) {
            var closed_cnt = 0;
            var open_cnt = 0;

            $(data.d.results).each(function() {
                if (this.Status == "Closed" || this.Status == "Deleted") closed_cnt++;
                if (this.Status == "Unopened" || this.Status == "Opened" || this.Status == "Working" || this.Status == "Submitted" || this.Status == "Validated") open_cnt++;
            });

            if (open_cnt > 0) {
                assigned_managers_states = "Open";
            } else {
                if (closed_cnt > 0) {
                    assigned_managers_states = "Closed";
                }
            }

        } else {
            assigned_managers_states = "";
        }


        //rest call to update the jdf

        var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/getItemById('" + jdf_id + "')";

        //console.log(url);

        //updated data to pass
        var updated_data = {
            __metadata: {
                "type": "SP.Data.Job_x005f_Description_x005f_FilesItem"
            },
            Assigned_Managers: assigned_managers_states
        }

        $.ajax({
            url: _spPageContextInfo.webAbsoluteUrl + url,
            type: "PATCH",
            headers: {
                "accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                "content-Type": "application/json;odata=verbose",
                "X-Http-Method": "PATCH",
                "If-Match": "*"
            },
            data: JSON.stringify(updated_data),
            success: function(data) {
                //console.log("updateSuccessful : " + jdf_id + " and " + job_code + " updated to : " + assigned_managers_states);
                //recursive_load_datatable(job_code,"",[]);
                //
                load_assigned_managers(job_code);
                load_assigned_managers_history(job_code);
                load_filter_assigned_to();
            },
            error: function(error) {
                alert(JSON.stringify(error));
            }
        }); //end of AJAX update call

    }); //done function
} //updateJDF_assigned_managers_column




//below codes will check user inactivity then force reload the page
//


var refresh_rate = 600; //<-- In seconds, change to your needs
var last_user_action = 0;
var lost_focus = true;
var focus_margin = 10; // If we lose focus more then the margin we want to refresh
var allow_refresh = true; // on off sort of switch

function keydown(evt) {
    if (!evt) evt = event;
    if (evt.keyCode == 192) {
        // Shift+TAB
        toggle_on_off();
    }
} // function keydown(evt)


function toggle_on_off() {
    if (can_i_refresh) {
        allow_refresh = false;
        //console.log("Auto Refresh Off");
    } else {
        allow_refresh = true;
        //console.log("Auto Refresh On");
    }
}

function reset() {
    last_user_action = 0;
    // console.log("Reset");
}

function windowHasFocus() {
    lost_focus = false;
    //console.log(" <~ Has Focus");
}

function windowLostFocus() {
    lost_focus = true;
    //console.log(" <~ Lost Focus");
}

setInterval(function() {
    last_user_action++;
    refreshCheck();
}, 1000);

function can_i_refresh() {
    if (last_user_action >= refresh_rate && lost_focus && allow_refresh) {
        return true;
    }
    return false;
}

function refreshCheck() {
    var focus = window.onfocus;

    if (can_i_refresh()) {
        window.location.reload(); // If this is called no reset is needed
        reset(); // We want to reset just to make sure the location reload is not called.
    } else {
        // console.log("Timer");
    }

}

window.addEventListener("focus", windowHasFocus, false);
window.addEventListener("blur", windowLostFocus, false);
window.addEventListener("click", reset, false);
window.addEventListener("mousemove", reset, false);
window.addEventListener("keypress", reset, false);
window.onkeyup = keydown;




function readItemInAList(listname) {

    var ReadItems = {

        settings: {
            _url_endpoint: "/_api/Web/Lists/GetByTitle('" + listname + "')/Items?$select=*&$top=5000"
        },

        init: function() {
            //make an ajax calls
            $.ajax({
                url: _spPageContextInfo.webAbsoluteUrl + ReadItems.settings._url_endpoint,
                type: "GET",
                headers: {
                    "accept": "application/json;odata=verbose",
                },
                success: function(data) {
                    $(data.d.results).each(function() {
                        //console.log(this.Title);
                    });
                },
                error: function(error) {
                    ReadItems.alertOnError();
                }
            });
        },

        alertOnError: function() {
            alert("There was an error");
        }

    }; //ReadItems

    ReadItems.init();
}

function removeDuplicates(arr) {
    let unique_array = []
    for (let i = 0; i < arr.length; i++) {
        if (unique_array.indexOf(arr[i]) == -1) {
            unique_array.push(arr[i])
        }
    }
    return unique_array
}


function getDataUri(url, callback) {
    var image = new Image();

    image.onload = function() {
        var canvas = document.createElement('canvas');
        canvas.width = this.naturalWidth; // or 'width' if you want a special/scaled size
        canvas.height = this.naturalHeight; // or 'height' if you want a special/scaled size

        canvas.getContext('2d').drawImage(this, 0, 0);

        // Get raw image data
        callback(canvas.toDataURL('image/png').replace(/^data:image\/(png|jpg);base64,/, ''));

        // ... or get as Data URI
        callback(canvas.toDataURL('image/png'));
    };

    image.src = url;
}

// Usage


function backupAJAXCodes() {
    var url = "/_api/Web/Lists/GetByTitle('File_Assignments')/items?$select=*&$filter=(Status eq 'Unopened' or Status eq 'Working') and AssignedManagerId eq " + parseInt($("#btn-submitassignment").attr("data-assigningTOmanagerID"));

    $.ajax({
        url: _spPageContextInfo.webAbsoluteUrl + url,
        type: "GET",
        headers: {
            "accept": "application/json;odata=verbose",
        },
        success: function(data) {
            var _deffereds = [];

            $(data.d.results).each(function(i) {


                var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/items?" +
                    "$select=*,FileLeafRef, Author/Title&$expand=Author&$top=1&" +
                    "$filter=Entry_Type eq 0 and FileLeafRef eq '" + this.New_File_Name + "'";

                _deffereds.push($.ajax({
                    url: _spPageContextInfo.webAbsoluteUrl + url,
                    type: "GET",
                    headers: {
                        "accept": "application/json;odata=verbose",
                    },
                    success: function(data) {

                        var node = data.d.results[0];

                        var numberOfDays = parseInt(7 * numberOfWeeks);

                        var deadline = moment(moment(moment(), node.Created).add(numberOfDays, 'days')).format("MMMM Do YYYY");

                        var newRow = "<tr class='html-email-row-removable' style='font-family:Verdana;font-size:13px;'>" +
                            "<td style='padding:4px;border:1px solid #9aa7c1;'>" + node.Job_Code + "</td>" +
                            "<td style='padding:4px;border:1px solid #9aa7c1;'>" + node.Title + "</td>" +
                            "<td style='padding:4px;border:1px solid #9aa7c1;'>" + node.Job_Grade + "</td>" +
                            "<td style='padding:4px;border:1px solid #9aa7c1;'>" + deadline + "</td>" +
                            "</tr>";

                        $("#htmlemail-assignedjobstable").append(newRow);
                    },
                    error: function(error) {
                        console.log(JSON.stringify(error));
                    }
                })); //ajax call end              
            }); //data . each

            /*$.when.apply($, _deffereds).done(function(){
               $("#htmlemail-assignedjobstable tr").not(":first").each(function(i){
              
                 if(i % 2 === 0){
                   $(this).css("background", "#eaf1fd");
                 }
              });

               
              
            });*/



        },
        error: function(error) {
            console.log(JSON.stringify(error));
        }
    }); //ajax call end
} //backup ends




/*

  END OF Module function

 */


/*****
  
  Creating / Concatenating a query the filters if the user is an admin full access (from Access_List Sharepoint list)
  
*****/

var pollForNewUpdatesInJDBoxes = (function(MD, SNB, MS, interval) {

    var checkForManagerDeadlineUpdate = function() {


        return setInterval(function() {

            var promise = MD.showManagerDeadlines(true);

        }, interval);
    }

    var checkForSupportNotificationUpdate = function() {


        return setInterval(function() {

            var promise = SNB.showSupportNotificationBoxes(true);

        }, interval);
    }

    var checkforManagerSubmissionUpdate = function() {


        return setInterval(function() {

            var promise = MS.showManagerSubmissions(true);

        }, interval);
    }



    return {
        MD_poll: checkForManagerDeadlineUpdate,
        SNB_poll: checkForSupportNotificationUpdate,
        MS_poll: checkforManagerSubmissionUpdate
    }
})(ManagerDeadlines, SupportNotificationBox, ManagerSubmissions, 15000);


/*
  @@@@@@@@@@@@@END OF A MODULE
*/



function copyToArchiveFolder(sourceSite, sourceFolderPath, sourceFileName, targetSite, targetFolderPath, targetFileName, requestDigest, file) {

    var sourceSiteUrl = sourceSite + "/_api/web/GetFolderByServerRelativeUrl('" + sourceFolderPath + "')/Files('" + sourceFileName + "')/$value";
    var targetSiteUrl = targetSite + "/_api/web/GetFolderByServerRelativeUrl('" + targetFolderPath + "')/Files/Add(url='" + targetFileName + "',overwrite=true)";

    var xhr = new XMLHttpRequest();
    xhr.open('GET', sourceSiteUrl, true);
    xhr.setRequestHeader('binaryStringResponseBody', true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
        if (this.status == 200) {
            //console.log(this.response);
            var arrayBuffer = this.response;
            $.ajax({
                    url: targetSiteUrl + "?$expand=ListItemAllFields",
                    method: 'POST',
                    data: arrayBuffer,
                    processData: false,
                    headers: {
                        'binaryStringRequestBody': 'true',
                        'Accept': 'application/json;odata=verbose;charset=utf-8',
                        'X-RequestDigest': requestDigest
                    }
                })
                .done(function(postData) {

                    var id = postData.d.ListItemAllFields.ID

                    //console.log(postData);


                    var url = "/_api/Web/Lists/GetByTitle('Job_Description_Files')/items(" + id + ")";


                    var table = $("#jd-datatable").DataTable();
                    var currentrow = $("#jd-datatable tr.active-row");


                    /*console.log("Job_Code" + ":" +  table.row(currentrow).data().Job_Code);
                        console.log("Job_Grade" + ":" +  table.row(currentrow).data().Job_Grade);
                        console.log("Job_Family_Group" + ":" +  table.row(currentrow).data().Job_Family_Group);
                        console.log("Job_Family" + ":" +  table.row(currentrow).data().Job_Family);
                        console.log("File_Type" + ":" +  table.row(currentrow).data().File_Type);
                        console.log("Exemption_Status" + ":" +  table.row(currentrow).data().Exemption_Status);
                        console.log("Final_Version" + ":" +  table.row(currentrow).data().Final_Version);
                        console.log("Country" + ":" +  table.row(currentrow).data().Country);
                        console.log("Division" + ":" +  table.row(currentrow).data().Division);
                        console.log("File_State" + ":" +  table.row(currentrow).data().File_State);
                        console.log("Career_Path" + ":" +  table.row(currentrow).data().Career_Path);
                        console.log("Job_Code" + ":" +  table.row(currentrow).data().Job_Code);*/

                    var updateObject = {
                        __metadata: {
                            type: postData.d.ListItemAllFields.__metadata.type
                        },
                        Title: table.row(currentrow).data().Title,
                        Job_Code: table.row(currentrow).data().Job_Code,
                        Job_Grade: table.row(currentrow).data().Job_Grade,
                        Job_Family_Group: table.row(currentrow).data().Job_Family_Group,
                        Job_Family: table.row(currentrow).data().Job_Family,
                        File_Type: table.row(currentrow).data().File_Type,
                        Exemption_Status: table.row(currentrow).data().Exemption_Status,
                        Final_Version: table.row(currentrow).data().Final_Version,
                        Country: table.row(currentrow).data().Country,
                        Division: table.row(currentrow).data().Division,
                        File_State: table.row(currentrow).data().File_State,
                        Career_Path: table.row(currentrow).data().Career_Path,
                        Job_Code: table.row(currentrow).data().Job_Code,
                        Entry_Type: 3
                    }


                    $.ajax({
                        url: _spPageContextInfo.webAbsoluteUrl + url,
                        type: "PATCH",
                        data: JSON.stringify(updateObject),
                        headers: {
                            "accept": "application/json;odata=verbose",
                            "X-RequestDigest": $("#__REQUESTDIGEST").val(),
                            "Content-Type": "application/json;odata=verbose",
                            "X-Http-Method": "PATCH",
                            "IF-MATCH": "*",
                        },
                        success: function(data) {

                            //console.log("data ARCHIVING SUCCESS");

                            //update the DOM add a dom for ul and update the the data table
                            var file = $("#replaceJobFile")[0].files;
                            uploadReplacementFile(file[0]);
                        },
                        error: function(error) {
                            ajaxFailureError(error);
                        }
                    });


                })
                .fail(function(jqXHR, errorText) {

                });


        } //if status is 200
    }
    xhr.send();
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}