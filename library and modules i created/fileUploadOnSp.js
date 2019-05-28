var fileUploadOnList = (function() {

    //declares the object that will be returned later for public functions, variables
    var app = [];
    var fileUploadeCount = 0;
    var arraycount = 0;

    //this function is used to addThe Item to the list first
    //
    function PostAjax(siteurl, listItem) {
        return $.ajax({
            url: siteurl,
            type: "POST",
            contentType: "application/json;odata=verbose",
            data: JSON.stringify(listItem),
            headers: {
                "Accept": "application/json;odata=verbose",
                "X-RequestDigest": $("#__REQUESTDIGEST").val()
            }
        });
    }

    //function that will create item and upload the files one by one
    function createNewItem(listname, filearray, listItem) {
        //deffered object
        var dfd = $.Deferred();

        //posting the new item to the list
        var initializePermsCall = PostAjax(_spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/GetByTitle('" + listname + "')/items", listItem);

        //wait for the post item ajax to be done then, upload files one by one
        //use when deffered
        $.when(initializePermsCall).then(function(permData) {
            //get the id of the newly created item
            var id = permData.d.Id;

            //if file array length is zero, just skip this part 
            if (filearray.length != 0) {

                //for loop to upload each item one by one 
                for (i = 0; i <= filearray.length - 1; i++) {

                    //function to upload the file
                    //used then(successfunction, errorfunction);

                    loopFileUpload(listname, id, filearray, i).then(
                        function() {
                            //success upload handler
                        },
                        function(sender, args) {
                            console.log("Error uploading");
                            dfd.reject(sender, args);
                        }
                    );

                } //end of for loop 
            } //end of if statement  

        }); // end of when function
    }



    function loopFileUpload(listName, id, filearray, fileCount) {
        var dfd = $.Deferred();
        uploadFile(listName, id, filearray[fileCount].Attachment);
        return dfd.promise();
    }

    //function that uploads the file
    function uploadFile(listname, ID, file) {

        //function to read file and get all file contents as deffered
        var getFileBuffer = function(file) {

            var deferred = $.Deferred();
            var reader = new FileReader();

            reader.onload = function(e) {
                deferred.resolve(e.target.result);
            }
            reader.onerror = function(e) {
                deferred.reject(e.target.error);
            }
            reader.readAsArrayBuffer(file);
            return deferred.promise();
        }; //end of file buffer 

        //use case of the function
        getFileBuffer(file).then(function(buffer) {
            $.ajax({
                url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getbytitle('" + listname + "')/items(" + ID + ")/AttachmentFiles/add(FileName='" + file.name + "')",
                method: 'POST',
                async: false,
                data: buffer,
                processData: false,
                headers: {
                    "Accept": "application/json; odata=verbose",
                    "content-type": "application/json; odata=verbose",
                    "X-RequestDigest": document.getElementById("__REQUESTDIGEST").value

                },
                success: function(data) {
                    //just making an alert to say all files has been uploaded
                    fileUploadeCount++;
                    if (arraycount == fileUploadeCount) {
                        alert("new item has been created and the all attachments has been uploaded");
                    }
                }
            });

        }); //get buffer ends here

    } //end of uploadFile


    function saveItemAndUploadFiles(element, listname, listData) {


        var fileArray = [];

        var inputFileElement = element[0].files;

        $(inputFileElement).each(function() {

            fileArray.push({
                "Attachment": this
            });

        });

        arraycount = fileArray.length;

        //metadata of your column here
        //sample listData
        /*listData = {  
            __metadata: { "type": "SP.Data.MyTestListListItem" },  //be sure to change this
            "Title": "Sample Title",  
            "UserNameId": _spPageContextInfo.userId,
            "Description": "" 
        };*/

        createNewItem("MyTestList", fileArray, listData);
    }




    app.saveItemAndUploadFiles = saveItemAndUploadFiles;


    return app;


})(); //end of module


//use case here