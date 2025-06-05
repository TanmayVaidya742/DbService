import { useTheme } from "@emotion/react";
import { Card, Grid } from "@mui/material";
import {
  BotsIcon,
  ProcessIcon,
  RcsIcon,
  SmsIcon,
  WhatsAppIcon,
} from "./IconComponent";
import { ModalAppText } from "../theme/styleComponent";

function truncateUnitName(unitName) {
  if (!unitName || typeof unitName !== "string") {
    return "";
  }

  if (unitName.length <= 10) {
    return unitName;
  }

  return unitName.slice(0, 10) + "...";
}

export default function AppsListCard({ app, redirectToAppService }) {
  const theme = useTheme();
  const getAppsIcon = (appName) => {
    switch (appName) {
      case "Process":
        return <ProcessIcon />;
      case "Bot":
        return <BotsIcon />;

      case "RCS":
        return <RcsIcon />;
      case "SMS":
        return <SmsIcon />;

      case "WhatsApp":
        return <WhatsAppIcon />;

      default:
        break;
    }
  };
  return (
    // <Card className="app-list-card">
    //   <Box className="app-list-box">

    // <Box  sx={{height:"80px" , width:"80px", display:"grid" , alignContent:"center"}}>
    <Grid item md={3.5}>
      <Card
        sx={{
          height: "80px",
          placeItems: "center",
          boxShadow: "none",
          border: "1px solid #f5f5f5",
          borderRadius: "4px",
          cursor: "pointer",
          paddingTop: "8px",
          ":hover": {
            backgroundColor: "#f5f5f5",
          },
        }}
        onClick={() => redirectToAppService(app)}
      >
        <div>
          <img src={app?.appIcon} style={{ height: "40px" }} />
        </div>
        <ModalAppText className="ml-4 m-2" underline="hover">
          {truncateUnitName(app?.unitName)}
        </ModalAppText>
      </Card>
    </Grid>
    // </Card>
  );
}
