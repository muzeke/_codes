var spsave = require("spsave").spsave;

var coreOptions = {
  siteUrl: "https://mfc.sharepoint.com/sites/JobLibrary/",
  notification: true,
  checkin: true,
  checkinType: 1
};

var creds = {
  username: "John_E_Sebulino@mfcgd.com",
  password: "Welcome7"
};

var fileOptions = {
  folder: "Solutions/userDashboard",
  glob: "build/**/*.*",
  base: "build"
};

spsave(coreOptions, creds, fileOptions)
  .then(function() {
    console.log("saved");
  })
  .catch(function(err) {
    console.log(err);
  });
