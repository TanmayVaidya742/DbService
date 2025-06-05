import {
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  Modal,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import AppsListCard from "./AppListCard";
import axios from "axios";

export default function AppsList({ openAppList, setOpenAppsList }) {
  //   const state = useSelector((store) => store.smsSlice);
  const state = useSelector((store) => store.dbaasStore);
  const [linkedApps, setLinkedApps] = useState([]);
  const [loading, setLoading] = useState(false);

  const redirectToAppService = (item) => {
    if (!item.appFrontendURL) {
      console.log("Invalid App URL.");
      return null;
    }
    const appUrl = getAppUrl(item);
    window.open(appUrl, "_blank");
  };

  const getAppUrl = (item) => {
    const hostname = window.location.hostname;
    let domain = `${hostname.split(".")[1]}.${hostname.split(".")[2]}`;
    const {
      HTTP_PROTOCOL,
      REACT_APP_HTTP_PROCESS_PORT,
      REACT_APP_HTTP_BOT_PORT,
      REACT_APP_HTTP_RCS_PORT,
      REACT_APP_ENVIRONMENT,
    } = process.env;
    let fullURL = "";
    const unitId = item.id;
    let name;
    switch (item.appName) {
      case "WhatsApp":
        // fullURL = ${item.appFrontendURL.replace("{{domain}}", domain)}/pyramid-authentication?unitId=${unitId};
        fullURL = `${HTTP_PROTOCOL}${item.appName.toLowerCase()}.${domain}/pyramid-authentication?unitId=${unitId}`;

        break;
      case "RCS":
        // fullURL = ${item.appFrontendURL.replace("{{domain}}", domain)}/launch-rcs?unitId=${unitId};
        if (REACT_APP_ENVIRONMENT === "dev") {
          fullURL = `${HTTP_PROTOCOL}${item.appName.toLowerCase()}.${domain}:${REACT_APP_HTTP_RCS_PORT}/launch-rcs?unitId=${unitId}`;
        } else {
          fullURL = `${HTTP_PROTOCOL}${item.appName.toLowerCase()}.${domain}/launch-rcs?unitId=${unitId}`;
        }

        break;
      case "SMS":
        fullURL = `${HTTP_PROTOCOL}${item.appName.toLowerCase()}.${domain}/pyramidsms/member/landing.php?unitId=${unitId}`;
        // fullURL = ${item.appFrontendURL.replace("{{domain}}", domain)}/pyramidsms/member/landing.php?unitId=${unitId};
        break;
      case "Bot":
        // fullURL = ${item.appFrontendURL.replace("{{domain}}", domain)}/launch-bot?unitId=${unitId};
        if (REACT_APP_ENVIRONMENT === "dev") {
          fullURL = `${HTTP_PROTOCOL}${item.appName.toLowerCase()}.${domain}:${REACT_APP_HTTP_BOT_PORT}/launch-bot?unitId=${unitId}`;
        } else {
          fullURL = `${HTTP_PROTOCOL}${item.appName.toLowerCase()}.${domain}/launch-bot?unitId=${unitId}`;
        }

        break;
      case "Process":
        // fullURL = ${item.appFrontendURL.replace("{{domain}}", domain)}/launch-process?unitId=${unitId};
        if (REACT_APP_ENVIRONMENT === "dev") {
          fullURL = `${HTTP_PROTOCOL}${item.appName.toLowerCase()}.${domain}:${REACT_APP_HTTP_PROCESS_PORT}/launch-process?unitId=${unitId}`;
        } else {
          fullURL = `${HTTP_PROTOCOL}${item.appName.toLowerCase()}.${domain}/launch-process?unitId=${unitId}`;
        }

        break;
      case "Ads Manager":
        name = "adsmanager";
        fullURL = `${HTTP_PROTOCOL}${name.toLowerCase()}.${domain}/login?unitId=${unitId}`;

        break;
      case "Live Agent":
        name = "liveagent";
        fullURL = `${HTTP_PROTOCOL}${name.toLowerCase()}.${domain}/pyramid/panel?unitId=${unitId}`;

        break;

      default:
        break;
    }
    return fullURL;
  };

  const getAllAppsLinkedToOrg = async () => {
    setLoading(true);
    const linkedApps = await axiosInstance.get(
      `/app-sync/get-linked-apps-by-user-id`,
      {
        params: { userId: state.userData.id },
      }
    );

    setLinkedApps(linkedApps.data.appsByUnitIdAndUserId);
    setLoading(false);
  };

  useEffect(() => {
    async function work() {
      await getAllAppsLinkedToOrg();
    }
    work()
      .then(() => {})
      .catch(() => {});
  }, []);

  return (
    // <Modal
    //   style={{
    //     paddingTop: "50px",
    //     justifyContent: "end",
    //     right: 0,
    //     display: "flex",
    //     height: "min",
    //     marginRight: "20px",
    //     marginTop: "20px",
    //     border: "none",
    //   }}
    //   open={openAppList}
    //   onClose={() => setOpenAppsList(false)}
    // >
    //   <Grid
    //   className="app-list-grid-container"
    //   sx={{
    //     maxHeight:"100%"
    //   }}
    //   >
    //     {/* <Grid className="app-list-grid"> */}

    //     {loading ? (
    //       <Grid
    //         display={"flex"}
    //         style={{ width: "50%", margin: "auto" }}
    //         justifyContent={"center"}
    //       >
    //         <CircularProgress />
    //       </Grid>
    //     ) : (
    //       linkedApps.map((item, index) => {
    //         return (
    //           // <Grid container onClick={() => redirectToAppService(item)}>
    //           //   item.unitName != state.userData.unitDetails.unitName && (
    //           <AppsListCard
    //             app={item}
    //             redirectToAppService={redirectToAppService}
    //           />
    //           //   )
    //           // </Grid>
    //         );
    //       })
    //     )}
    //     {/* </Grid> */}
    //   </Grid>
    // </Modal>

    <Dialog
      open={openAppList}
      onClose={() => setOpenAppsList(false)}
      PaperProps={{
        sx: {
          position: "fixed",
          top: "50px",
          right: "230px",
          margin: 0,
          maxWidth: "400px",
          width: "auto",
          backgroundColor: "white",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: "transparent",
        },
      }}
    >
      <DialogTitle sx={{ padding: 0, margin: 0 }}></DialogTitle>
      <DialogContent>
        <Grid
          //   className="app-list-grid-container"
          sx={{
            maxHeight: "100%",
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridTemplateRows: "repeat(3, 1fr)",
            gap: 2,
            padding: 2,
          }}
        >
          {loading ? (
            <Grid
              display={"flex"}
              style={{ width: "50%", margin: "auto" }}
              justifyContent={"center"}
            >
              <CircularProgress />
            </Grid>
          ) : (
            linkedApps.map((item, index) => {
              return (
                item?.unitName != state?.userData?.unitDetails?.unitName && (
                  <AppsListCard
                    app={item}
                    redirectToAppService={redirectToAppService}
                  />
                )
              );
            })
          )}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
