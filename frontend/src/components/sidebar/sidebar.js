import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import {
  Box,
  Card,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer as MuiDrawer,
  Typography,
  useMediaQuery,
} from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";
import { useParams } from "react-router-dom";
// import { setSelectedSidebarApp } from "../../store/ssoSlice";

const Drawer = styled(MuiDrawer)`
  .MuiDrawer-paper {
    width: 280px;
    background-color: #ffffff;
    border-right: 1px solid #e0e0e0;
    box-shadow: 1px 0 4px rgba(0, 0, 0, 0.05);
    position: relative;
    height: 100vh;
    @media (max-width: 768px) {
      width: 280px;
      position: fixed;
    }
  }
`;

const Sidebar = ({ items, isBotsScreen, mobileOpen, onClose, ...rest }) => {
  const state = useSelector((store) => store.dbaasStore);
  const navigate = useNavigate();
  let { pathname } = useLocation();
  pathname = pathname.replace("%20", "");
  const currentPath = pathname;
  const theme = useTheme();
  const dispatch = useDispatch();

  const { appName } = useParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const onClickSidebar = (item) => {
    // dispatch(setSelectedSidebarApp(item));
    navigate(`${item.route}`);
  };

  let currentLocation = window.location.href;
  currentLocation = currentLocation
    .replace("http://", "")
    .replace("https://", "");

  let xyz = currentLocation.split("/");

  let currentMergeRoute = "";

  for (let index = 1; index < xyz.length; index++) {
    const element = xyz[index];
    currentMergeRoute = currentMergeRoute + "/" + element;
  }
  const currentRoute = `/${currentLocation.split("/")[1]}`;

  return (
    <Drawer
      variant={isMobile ? "temporary" : "permanent"}
      open={mobileOpen}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        display: { xs: 'block', md: 'block' },
        '& .MuiDrawer-paper': {
          boxSizing: 'border-box',
          width: 280,
          position: isMobile ? 'fixed' : 'relative',
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box  sx={{
          p: '20px 16px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e0e0e0',
          minHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Typography variant="h5">
            {state.userData.id ? (
            <img
              src="/pinnaclelogowithtext.png"
              alt="User Logo"
              style={{ width: "100px", height: "30px" }}
            />
          ) : (
            "DBAAS"
          )}
          </Typography>
        </Box>
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {items.map((item, index) => (
            <ListItem key={index} disablePadding>
              <ListItemButton
                onClick={() => onClickSidebar(item)}
                selected={pathname === item.route}
                sx={{
                  px: 3,
                  py: 2,  // Increased padding
                  '&.Mui-selected': {
                    backgroundColor: '#f5e9e2',
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 48,  // Increased min-width
                  color: pathname === item.route ? theme.palette.primary.main : 'inherit',
                  fontSize: '1.25rem'  // Larger icons
                }}>
                  <item.icon fontSize="medium" />
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    fontWeight: pathname === item.route ? 600 : 'normal',
                    fontSize: '1rem'  // Slightly larger text
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {/* <List className="mt-1" sx={{ padding: "8px" }}>
          {items.map((item, index) => (
            <React.Fragment key={`sidebar-items-${index}`}>
             
                <div>
                  <Card
                    className="mb-1"
                    style={{
                      boxShadow: "none",
                      backgroundColor:
                        item.route === currentMergeRoute
                          ? theme.palette.primary.light
                          : "",
                      color:
                        item.route === currentRoute
                          ? theme.palette.primary.dark
                          : theme.palette.primary.dark,
                    }}
                    key={index}
                  >
                    <ListItem
                      // className=" poppins-regular"
                      // selected={item.route === currentPath}
                      display="flex"
                      alignItems="center"
                      key={item.name}
                      disablePadding
                      onClick={() => {
                        onClickSidebar(item);
                      }}
                    >
                      <ListItemButton
                        sx={{
                          color:
                            item.route === currentPath
                              ? theme.palette.primary.text
                              : theme.palette.primary.dark,
                          ":hover": {
                            backgroundColor: "transparent",
                            color: ``,
                          },
                        gap:1
                        }}
                      >
                        <item.icon  />
                        <ListItemText
                          className="ml-3 poppins-regular"
                          primary={
                            <Typography
                            //   sx={{
                            //     // fontFamily: `"Poppins", sans-serif !important`,
                            //     fontSize: "16px",
                            //     fontWeight: 600,

                            //     ":hover": {
                            //       backgroundColor: "transparent",
                            //       color: `${theme.typography.primary.text}`,
                            //     },
                            //   }}
                            >
                              {item.name}
                            </Typography>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  </Card>
                </div>
            </React.Fragment>
          ))}
        </List> */}
      </Box>
    </Drawer>
  );
};

export default Sidebar;
