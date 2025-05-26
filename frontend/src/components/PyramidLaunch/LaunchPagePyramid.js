import {
  Button,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { setUserData } from "../../redux/ssoSlice";

export default function LaunchPagePyramid() {
  const currentUrl = new URL(window.location.href);
  const searchParams = new URLSearchParams(currentUrl.search);
  let unitId = searchParams.get("unitId");
  const navigate = useNavigate();
  // const state = useSelector((store) => store.user_slice);
  const [state, setState] = useState({});
  const [errorResponse, setErrorResponse] = useState("");

  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const getData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/app-sync/authenticate`, {
        params: { unitId: unitId },
        withCredentials: true,
      });
      let cuName = response.data.findUser.unitDetails.unitName
        .trim()
        .replace(/ /g, "_");
      sessionStorage.setItem("cuname", cuName);

      setState(response.data.findUser);
      if (response.status === 200) {
        axiosInstance.defaults.headers.cuname = cuName;
        dispatch(setUserData(response.data.findUser));
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);

      let errorMessage = "Server not reachable.";

      if (error.response) {
        errorMessage =
          (error.response.data && error.response.data.message) ?? errorMessage;
      }
      setErrorResponse(errorMessage);
    }
  };
  useEffect(() => {
    async function work() {
      await getData();
    }
    work()
      .then(() => {})
      .catch((error) => {
        // dispatch(
        //   showSnackbar({
        //     open: true,
        //     severity: "error",
        //     message: error.response?.data ? error.response?.data : error.response?.statusText,
        //   })
        // );
      });
  }, []);

  const handleOnClickProceed = () => {
    navigate("/databases");
  };
  return loading ? (
    <CircularProgress />
  ) : (
    <>
      <Grid container sx={{ display: "grid", marginTop: "20px" }}>
        <Grid container display={"flex"} justifyContent={"space-between"}>
          <Grid>
            <img src={state.registryLogo} width={"160px"} />
          </Grid>
          <Grid>
            <img src={state.appIcon} width={"110px"} />
          </Grid>
          {/* <Grid>
            <img src={state.organizationLogo} height={"60px"} />
          </Grid> */}
        </Grid>

        {/* {JSON.stringify(state)} */}

        <Grid
          container
          display={"flex"}
          flexDirection={"column"}
          alignItems={"center"}
        >
          <Grid component={Paper} p={4}>
            <Grid>
              <Typography
                sx={{ fontWeight: 600 }}
                display={"flex"}
                justifyContent={"center"}
                textAlign={"center"}
                variant="h1"
                mb={2}
              >
                Welcome {state ? state.firstName : ""} to DBAAS Panel of{" "}
                {state ? state.organizationName : ""}
              </Typography>
            </Grid>
            <Grid>
              <TableContainer sx={{ width: "1000px" }} component={Paper}>
                <Table aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="right"
                        sx={{ backgroundColor: "#f4f4f4" }}
                      >
                        <b>Detail Name</b>
                      </TableCell>
                      <TableCell sx={{ backgroundColor: "#f4f4f4" }}>
                        <b>Information</b>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right">Consumer Unit Name</TableCell>
                      <TableCell>
                        {state.unitDetails ? state.unitDetails.unitName : ""}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right">Consumer Unit Id</TableCell>
                      <TableCell>
                        {state.unitDetails ? state.unitDetails.id : ""}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right">User Email</TableCell>
                      <TableCell>{state ? state.email : ""}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right">User Id</TableCell>
                      <TableCell>{state ? state.id : ""}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right">Secondary ERPId</TableCell>
                      <TableCell>{state ? state.secondaryERPId : ""}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right">Registry Id</TableCell>
                      <TableCell>{state ? state.registryId : ""}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell align="right">Org Id</TableCell>
                      <TableCell>{state ? state.orgId : ""}</TableCell>
                    </TableRow>
                  </TableHead>
                </Table>
              </TableContainer>
            </Grid>
            <Grid display={"flex"} justifyContent={"center"}>
              <Button
                sx={{
                  padding: "10px",
                  marginTop: "16px",
                  color: "#fff",
                  backgroundColor: "#2962ff",
                }}
                onClick={handleOnClickProceed}
              >
                Proceed
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      {/* <AlertMessageComponent
                message={errorResponse}
                fieldName={"getUserData"}
                handleClose={() => setErrorResponse("")}
                show={Boolean(errorResponse)}
            /> */}
    </>
  );
}
