import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  CssBaseline,
  Divider,
  Grid,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { navListBasedOnUserType } from "../accessControl/accessControl";
import Sidebar from "../sidebar/sidebar";
import { Logout } from "@mui/icons-material";
import { FaDatabase } from "react-icons/fa";
import AppsList from "../pyramidComponents/AppList";
import axiosInstance from "../../utils/axiosInstance";
import ProfileModal from "../pyramidComponents/ProfileModal";
import { Menu  as MenuIcon} from "@mui/icons-material";

const Root = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: #f5e9e2;
`;

const AppContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 100%;
  height: 100vh;
  overflow: hidden;
`;

const MainContent = styled.main`
  flex: 1;
  overflow-y: auto;
  background-color: #ffffff;
  
`;
export const Roles = ["superadmin", "user"];

export default function Layout({ children }) {
  const navigate = useNavigate();
  const state = useSelector((state) => state.dbaasStore);
  const [navBarItems, setNavBarItems] = useState([]);
  const dispatch = useDispatch();
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [organizationLogo, setOrganizationLogo] = useState("");
  const getNavListByPermission = async () => {
    const navListBasedOnUserRole = await navListBasedOnUserType(
      state.userData,
      dispatch,
      navigate
    );
    setNavBarItems(navListBasedOnUserRole);
  };
  const [openAppList, setOpenAppsList] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);


  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [orgDetails, setOrgDetails] = useState();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleProfileOnClick = () => {
    setShowMenuItemModal(true);
  };

  const handleProfileClick = () => {
        setShowProfileModal(true);
    };

  const handleProfileClose = () => {
    setShowProfileModal(false);
  };
  const handleAppsOnClick = () => {
    setOpenAppsList(true);
  };

  //   const checkIsPageAccessible = async () => {
  //     setLoading(true);
  //     const isPageAccessible = await isAccessible(
  //       location.pathname,
  //       state.userData,
  //       dispatch,
  //       navigate
  //     );
  //     if (isPageAccessible) {
  //       setLoading(false);
  //     } else {
  //       setLoading(false);
  //       navigate("/unauthorized");
  //     }
  //   };
  //   useEffect(() => {
  //     checkIsPageAccessible();
  //   }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    navigate("/login");
  };

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    getNavListByPermission();
  }, []);

  return (
    <Root>
      <CssBaseline />
          <Sidebar
            onClose={handleDrawerToggle}
            items={navBarItems}
            isBotsScreen={true}
            mobileOpen={mobileOpen}
          />
        {/* <Box sx={{ display: { xs: "none", md: "block" } }}>
        <Sidebar
        PaperProps={{ style: { width: 100 } }}
        variant='temporary'
        open={false}
        onClose={() => {}}
        items={navBarItems}
        isBotsScreen={true}
        />
    </Box> */}
        <AppContent>
          <AppBar
          position="fixed"
          elevation={0}
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: "#ffffff",
            borderBottom: '1px solid #e0e0e0',
            width: { md: `calc(100% - 280px)` },
            ml: { md: `280px` },
            height: '80px',
            '& .MuiToolbar-root': {
              height: '100%',
              minHeight: '80px'
            }
          }}
        >
            <Toolbar>
              {
                isMobile && (
                  <IconButton
                      color="inherit"
                      edge="start"
                      onClick={handleDrawerToggle}
                      sx={{ mr: 3, color: '#333' }}
                  >
                    <MenuIcon fontSize="medium" />
                  </IconButton>
                )
              }
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: "none" } }}
              >
                <Menu />
              </IconButton>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1,
                  ml: 2,
                  backgroundColor: "white",
                }}
              >
                <img
                  src="/assets/images/dbaas.svg"
                  alt="DBaaS Logo"
                  style={{
                    width: "50px",
                    height: "50px",
                  }}
                />
              </Box>
                <Typography variant="h5" sx={{ ml: 2, color: "#000000" }}>
                  {/* Database: {database.data?.dbName || dbName || "Unnamed Database"} */}
                  {state.userData.id && `DBAAS - DBAAS ${state?.userData?.unitDetails?.unitName}`}
                </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Grid alignItems={"center"} ml={1} display={"flex"}>
                {state.userData.id ? (
                  <img
                    src="/assets/images/apps_colored.svg"
                    onClick={handleAppsOnClick}
                    style={{ maxHeight: "40px", cursor: "pointer" }}
                  />
                ) : (
                  <></>
                )}
              </Grid>
              {state.userData.id ? 
              <>
                <Grid alignItems={"center"} display={"flex"}>
                                    <img src={state.userData.organizationLogo} style={{ maxHeight: "40px" }} />
                                    </Grid>
                                    <Grid display={"flex"}>
                                        <Grid item display={"flex"} justifyContent={"end"}>
                                            <IconButton onClick={handleProfileClick}>
                                                <Tooltip title={state.userData.email}>
                                                    <Avatar
                                                        sx={{
                                                            color: "#000000",
                                                            backgroundColor:
                                                                [
                                                                state.userData.firstName ? state.userData.firstName[0].toUpperCase() : ""
                                                                ],
                                                            border: `1px solid black`,
                                                        }}
                                                    >
                                                        {state?.userData?.firstName ? state.userData.firstName[0].toUpperCase() : ""}
                                                    </Avatar>
                                                </Tooltip>
                                            </IconButton>
                                        </Grid>
                                    </Grid> 
                </>
              :
              <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: theme.palette.primary.main,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  {state.userData.email?.charAt(0).toUpperCase() || "U"}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                    mt: 1.5,
                    '& .MuiAvatar-root': {
                      width: 32,
                      height: 32,
                      ml: -0.5,
                      mr: 1,
                    },
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem>
                  <Avatar /> 
                  <Typography variant="body2" sx={{ ml: 1, fontWeight: 500 }}>
                    {state.userData.email || "User"}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
              
              {/* {!isMobile && (
                <Button
                  variant="contained"
                  onClick={handleLogout}
                  startIcon={<Logout fontSize="medium" />}
                  size="medium"
                  sx={{
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '8px 20px',
                    textTransform: 'none',
                    fontWeight: 500,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: '#ff5252',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                      transform: 'translateY(-1px)'
                    },
                    '& .MuiButton-startIcon': {
                      marginRight: '8px',
                      marginLeft: '-4px'
                    }
                  }}
                >
                  Log Out
                </Button>
              )} */}
            </Box>
              </>
              }
              
            </Toolbar>
          </AppBar>
          {!loading && (
            <Grid flex={1} pt={1}>
              <Outlet />
            </Grid>
          )}
        </AppContent>
          
      {showProfileModal && <ProfileModal open={showProfileModal} handleClose={handleProfileClose} />}

      {openAppList === true && (
        <AppsList setOpenAppsList={setOpenAppsList} openAppList={openAppList} />
      )}
      {/* <SnackbarMessage />
    {showMenuItemModal && (
    <ProfileModal open={showMenuItemModal} handleClose={handleProfileClose} />
    )} */}
    </Root>
  );
}
