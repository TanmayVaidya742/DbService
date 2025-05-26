import { Stack } from "@mui/material";
import * as React from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
// import { setUserData } from "../../redux/userManagement/userManagementSlice";
import axiosInstance from "../utils/axiosInstance";
import { config } from "../config/config";
import { setUserData } from "../redux/ssoSlice";

// For routes that can only be accessed by authenticated team members
function AuthGuard({ children, params }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = React.useState(false);
  const state = useSelector((state) => state.userManagementSlice);
  const {
    REACT_APP_HTTP_PROTOCOL,
    REACT_APP_REGISTRY_FRONTEND_PORT,
    REACT_APP_ENVIRONMENT,
  } = config;

  let hostName = window.location.hostname;
  const domain = `${hostName.split(".")}`;
  let domainURL = `${domain[1]}.${domain[2]}`;
  let auhorization = localStorage.getItem("token");

  const cuName = sessionStorage.getItem("cuname");
  axiosInstance.defaults.headers.cuname = cuName;
  const setup = async () => {
    setLoading(true);
    try {
      let unitId;
      let logoURL;
      if (!unitId || unitId === "") {
        const currentUrl = new URL(window.location.href);
        const searchParams = new URLSearchParams(currentUrl.search);
        unitId = searchParams.get("unitId");
      }

      const cuname = sessionStorage.getItem("cuname");
      if (cuname) {
        axiosInstance.defaults.headers.cuname = cuname;
      }
      // making process backend url
      const response = await axiosInstance.get(`/app-sync/authenticate`, {
        params: { unitId: unitId },
        headers: { Authorization: auhorization },
      });
      dispatch(setUserData(response.data.findUser));
      setLoading(false);
      if (response.data.findUser === "superadmin") {
        navigate("/superadmin-dashboard");
      } else {
        navigate(`/databases`);
      }
    } catch (error) {
      //   if (REACT_APP_ENVIRONMENT === "dev") {
      //     window.open(
      //       `${REACT_APP_HTTP_PROTOCOL}${domainURL}:${REACT_APP_REGISTRY_FRONTEND_PORT}`,
      //       "_self"
      //     );
      //   } else {
      //     window.open(`${REACT_APP_HTTP_PROTOCOL}${domainURL}`, "_self");
      //   }
      throw error;
    }
  };
  useEffect(() => {
    setup();
    // navigate("/superadmin-dashboard");
  }, []);
  if (loading) {
    return (
      <Stack
        style={{ height: "92vh", display: "grid", placeItems: "center" }}
        spacing={5}
      >
        {" "}
        {/* <CircularProgress />{" "} */}
      </Stack>
    );
  }
  return <>{children}</>;
}

export default AuthGuard;
