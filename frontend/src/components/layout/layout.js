import { useTheme } from "@emotion/react";
import styled from "@emotion/styled";
import { AppBar, Box, Button, CssBaseline, Grid, IconButton, Menu, Toolbar, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { navListBasedOnUserType } from "../accessControl/accessControl";
import Sidebar from "../sidebar/sidebar";
import { Logout } from "@mui/icons-material";
import { FaDatabase } from "react-icons/fa";

const Root = styled.div`
display: flex;
min-height: 100%;
overflow: hidden !important;
`;

const AppContent = styled.div`
flex: 1;
display: flex;
flex-direction: column;
max-width: 100%;
height: 100%;
justify-content: space-between;
overflow: hidden !important;
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
const navListBasedOnUserRole = await navListBasedOnUserType(state.userData, dispatch, navigate);
setNavBarItems(navListBasedOnUserRole);
};

const [loading, setLoading] = useState(false);
const [currentUser,setCurrentUser] = useState(null)

const [mobileOpen, setMobileOpen] = useState(false);
const location = useLocation();
const theme = useTheme();

const handleProfileOnClick = () => {
setShowMenuItemModal(true);
};
const handleProfileClose = () => {
setShowMenuItemModal(false);
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

useEffect(() => {
getNavListByPermission();
}, []);

return (
<Root className="background-color-class">
    <CssBaseline />
    <Grid sx={{ overflow: "hidden" }}>
    <Box sx={{ display: { xs: "block", lg: "block" } }}>
        <Sidebar
        PaperProps={{ style: { width: 100 } }}
        variant="temporary"
        open={false}
        onClose={() => {}}
        items={navBarItems}
        isBotsScreen={true}
        />
    </Box>
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
    </Grid>
    <Grid
    item
    flex={1}
    display={"flex"}
    flexDirection={"column"}
    justifyContent={"space-between"}
    sx={{ overflow: "hidden" }}
    pr={1}
    >
    <AppContent>
        <AppBar
    position="fixed"
    sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: "var(--primary-color)",
        width: { sm: `calc(100% - 240px)` },
        ml: { sm: `240px` },
    }}
    >
    <Toolbar>
        <IconButton
        color="inherit"
        edge="start"
        onClick={handleDrawerToggle}
        sx={{ mr: 2, display: { sm: "none" } }}
        >
        <Menu />
        </IconButton>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1, ml: 2 }}>
        <FaDatabase size={24} />
        <Typography
            variant="h5"
            sx={{ ml: 2, color: "var(--primary-text)" }}
        >
        
            {/* Database: {database.data?.dbName || dbName || "Unnamed Database"} */}
        </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Typography
        variant="body1"
        sx={{ color: "var(--primary-text)", mr: 2 }}
        >
        {state.userData.email || "Loading..."}
        </Typography>
        <Button
        variant="outlined"
        onClick={handleLogout}
        sx={{
            color: "var(--primary-text)",
            borderColor: "var(--primary-text)",
            borderRadius: "20%",
            minWidth: 40,
            width: 40,
            height: 40,
            p: 0,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            borderColor: "var(--primary-text)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
            transform: "scale(1.05)",
            },
            transition: "all 0.3s ease",
        }}
        >
        <Logout fontSize="small" />
        </Button>
    </Toolbar>
    </AppBar>
        {!loading && (
        <Grid flex={1} pt={1}>
            <Outlet />
        </Grid>
        )}
    </AppContent>
    </Grid>
    {/* <SnackbarMessage />
    {showMenuItemModal && (
    <ProfileModal open={showMenuItemModal} handleClose={handleProfileClose} />
    )} */}
</Root>
);
}
