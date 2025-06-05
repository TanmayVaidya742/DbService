import { Avatar, Dialog, DialogContent, Grid, IconButton } from "@mui/material";
import * as React from "react";
import { useSelector } from "react-redux";
import { useTheme } from "@emotion/react";
import { Close } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
// import { apiGatewayAxiosInstance } from "../utils/axios";
import {
  CardHeadingBold,
  PyramidCreateButton,
  PyramidLoggedInUserInfo,
} from "../theme/styleComponent";
// import { UserProfileColors } from "./userProfileColors";
// import { config } from "../config";
import axiosInstance from "../../utils/axiosInstance";

export default function ProfileModal({ open, handleClose }) {
  const state = useSelector((store) => store.dbaasStore);
  const theme = useTheme();
  //   let userRole = DisplayNameForPyramidUserRole[state.userData.userRole];
  const navigate = useNavigate();
  const {
    REACT_APP_HTTP_PROTOCOL,
    REACT_APP_ENVIRONMENT,
    REACT_APP_REGISTRY_FRONTEND_PORT,
  } = process.env;
  // const handleLogOut = async () => {
  //     try {
  //         //#TODO:Signout
  //         let domain = window.location.href;
  //         domain = domain.split(.);
  //         let domainURL = ${domain[1]}.com:5006;
  //         const response = await apiGatewayAxiosInstance.post(/user_management/logout);
  //           window.open(domainURL, "_self");
  //         //   navigate(/${domainURL});
  //         // window.open("http://ashishtechnologies.com:5006", "_self");
  //     } catch (error) {}
  // };

  const handleLogOut = async () => {
    try {
      //   let domain = window.location.href;
      let domain = window.location.hostname;
      domain = domain.split(".");
      let domainURL = `${REACT_APP_HTTP_PROTOCOL}${domain[1]}.${domain[2]}`;
      if (REACT_APP_ENVIRONMENT === "dev") {
        domainURL = `${domainURL}:${REACT_APP_REGISTRY_FRONTEND_PORT}`;
      }
      //   window.location.href = domainURL;
      const response = await axiosInstance.post(`/app-sync/logout`);
      window.open(domainURL, "_self");
    } catch (error) {}
  };

  //For dynamic use below function
  // const handleLogOut = async () => {
  //     try {
  //         let domain = window.location.href;
  //         domain = domain.split(.);
  //         // let domainURL = ${domain[1]}.com:5006;
  //         let domainURL = ${domain[1]}.${domain[2]};
  //         const response = await apiGatewayAxiosInstance.post(/authenticate/logout);
  //           window.open(domainURL, "_self");
  //         //   navigate(/${domainURL});
  //         // window.open("http://ashishtechnologies.com:5006", "_self");
  //     } catch (error) {}
  // };
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      hideBackdrop
      PaperProps={{
        style: {
          position: "fixed",
          top: 65,
          right: 20,
          margin: 0,
          padding: 0,
          width: "25%",
          height: "auto",
          borderRadius: "12px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        },
      }}
      sx={{ overflow: "hidden !important" }}
    >
      <DialogContent>
        <Grid
          container
          alignItems="center"
          justifyContent="space-between"
          pb={2}
        >
          <Grid item xs>
            <Grid container justifyContent="center">
              <PyramidLoggedInUserInfo>
                {state.userData?.email}
              </PyramidLoggedInUserInfo>
            </Grid>
          </Grid>

          <Grid item>
            <IconButton onClick={handleClose}>
              <Close fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>

        <Grid display="flex" flexDirection="column" alignItems="center">
          <Avatar
            sx={{
              color: "black",
              backgroundColor: [state.userData?.firstName[0].toUpperCase()],
              border: `1px solid black`,
              width: 60,
              height: 60,
            }}
          >
            {state.userData?.firstName[0].toUpperCase()}
          </Avatar>
          <CardHeadingBold mt={2}>
            Hi, {state.userData?.firstName}
          </CardHeadingBold>
          <Grid mt={1}>{"User"}</Grid>

          <Grid mt={4}>
            <PyramidCreateButton onClick={handleLogOut}>
              Sign Out
            </PyramidCreateButton>
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
