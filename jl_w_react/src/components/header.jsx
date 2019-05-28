import React from "react";

const Header = () => {
  return (
    <React.Fragment>
      <header>
        <div className="banner">
          <div className="banner-title">
            <img
              alt="manulife_logo"
              src="https://mfc.sharepoint.com/sites/JobLibrary/joblibraryassets/images/manulifejh.PNG?ctag=190528"
            />
          </div>
          <div className="welcome-user">
            Welcome, {window.spo_context_info.userDisplayName}
          </div>
        </div>
      </header>

      <div className="subHeader">Welcome to Manulife Job Family Library</div>
    </React.Fragment>
  );
};

export default Header;
