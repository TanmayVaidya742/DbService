import React, { useState, useEffect } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Container,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  DialogActions,
  DialogContentText,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Add as AddIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Groups as GroupsIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { styled } from "@mui/material/styles";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import axiosInstance from "../utils/axiosInstance";

const drawerWidth = 240;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: "var(--border-radius)",
  boxShadow: "var(--shadow-lg)",
  backgroundColor: "var(--bg-paper)",
}));

const Dashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({
    organizationName: "",
    domainName: "",
    ownerEmail: "",
    firstName: "",
    lastName: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    email: "",
    id: "",
    name: "",
    orgName: "", // Changed from organization to orgName
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser({ email: "", id: "", name: "", orgName: "" });
    setSnackbar({
      open: true,
      message: "Logged out successfully",
      severity: "success",
    });
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user"));
        if (!token) {
          setSnackbar({
            open: true,
            message: "Not authenticated. Please log in.",
            severity: "error",
          });
          navigate("/login");
          return;
        }

        // Fetch user data
        const userResponse = await axiosInstance.get("/users/get-user", {
          params: { orgId: user.orgId },
          headers: { Authorization: `${token}` },
        });

        if (userResponse.data && userResponse.data.data) {
          const userData = userResponse.data.data[0];

          // Fetch organization data to get orgName
          const orgResponse = await axiosInstance.get("/orgs");
          const orgData = orgResponse.data.data.find(
            (org) => org.orgId === userData.orgId
          );
          const orgName = orgData ? orgData.orgName : "Not specified";

          setCurrentUser({
            email: userData.email,
            id: userData.userId,
            name: `${userData.firstName} ${userData.lastName}`,
            orgName: orgName,
          });
        } else {
          console.error("User data missing in response:", userResponse.data);
          setSnackbar({
            open: true,
            message: "User data incomplete",
            severity: "warning",
          });
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setSnackbar({
          open: true,
          message: error.response?.data?.error || "Failed to load user data",
          severity: "error",
        });
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  console.log("0000000000000000000000000000000000000000000000000000000000");
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/orgs");
      const orgsData = res.data.data || res.data || [];
      setUsers(Array.isArray(orgsData) ? orgsData : []);
    } catch (err) {
      console.error("Error fetching organizations:", err);
      setSnackbar({
        open: true,
        message: "Error fetching organizations",
        severity: "error",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      organizationName: "",
      domainName: "",
      firstName: "",
      lastName: "",
      ownerEmail: "",
      password: "",
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async () => {
    if (
      !formData.organizationName ||
      !formData.domainName ||
      !formData.ownerEmail ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.password
    ) {
      setSnackbar({
        open: true,
        message: "Please fill in all fields",
        severity: "error",
      });
      return;
    }

    try {
      const orgResponse = await axiosInstance.post("/orgs/add-org", {
        orgName: formData.organizationName.trim(),
        domain: formData.domainName.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.ownerEmail.trim().toLowerCase(),
        password: formData.password,
      });

      console.log("Full organization response:", orgResponse);
      console.log("Response data:", orgResponse.data);
      console.log("Organization ID:", orgResponse.data?.data?.orgId);

      setSnackbar({
        open: true,
        message: "Organization and owner created successfully",
        severity: "success",
      });

      await fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error("Error adding organization:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Error creating organization",
        severity: "error",
      });
    }
  };

  const handleOpenDeleteDialog = (userId) => {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleDeleteUser = async () => {
    try {
      const response = await axiosInstance.delete(`/orgs/delete-org`, {
        data: { orgName: userToDelete.orgName },
      });

      setSnackbar({
        open: true,
        message: "Organization deleted successfully",
        severity: "success",
      });

      setUsers((prevUsers) =>
        prevUsers.filter((org) => org.orgId !== userToDelete.orgId)
      );
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Error deleting organization:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Error deleting organization",
        severity: "error",
      });
      handleCloseDeleteDialog();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredUsers = users.filter(
    (org) =>
      (org.orgName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (org.domain?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const location = useLocation();

  // const drawer = (
  //   <div style={{ backgroundColor: "var(--bg-paper)" }}>
  //     <Toolbar>
  //       <Typography variant="h6" style={{ color: "var(--text-primary)" }}>
  //         1SPOC DAAS
  //       </Typography>
  //     </Toolbar>
  //     <Divider style={{ backgroundColor: "var(--border-color)" }} />
  //     <List>
  //       <ListItem
  //         button
  //         onClick={() => navigate("/superadmin-dashboard")}
  //         selected={location.pathname === "/superadmin-dashboard"}
  //         style={{
  //           color:
  //             location.pathname === "/superadmin-dashboard"
  //               ? "var(--primary-color)"
  //               : "var(--text-primary)",
  //           backgroundColor:
  //             location.pathname === "/superadmin-dashboard"
  //               ? "var(--primary-light)"
  //               : "transparent",
  //           cursor: "pointer",
  //         }}
  //       >
  //         <ListItemIcon>
  //           <DashboardIcon
  //             style={{
  //               color:
  //                 location.pathname === "/superadmin-dashboard"
  //                   ? "var(--primary-color)"
  //                   : "var(--text-secondary)",
  //             }}
  //           />
  //         </ListItemIcon>
  //         <ListItemText primary="Dashboard" />
  //       </ListItem>
  //     </List>
  //   </div>
  // );

  return (
    <Box
      sx={{
        display: "flex",
        backgroundColor: "var(--bg-secondary)",
        minHeight: "100vh",
      }}
    >
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "var(--primary-color)",
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          boxShadow: "none",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, color: "var(--primary-text)" }}
          >
            Dashboard - Super Admin
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "var(--primary-text)", mr: 2 }}
          >
            {currentUser?.email || "Loading..."}
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
            <LogoutIcon fontSize="small" />
          </Button>
        </Toolbar>
      </AppBar>

      {/* <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              backgroundColor: "var(--bg-paper)",
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              backgroundColor: "var(--bg-paper)",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box> */}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Grid>
          <StyledPaper>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
              }}
            >
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    color: "var(--text-primary)",
                    fontWeight: "bold",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  Welcome, {currentUser?.name || "Admin"}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  Organization: {currentUser?.orgName || "Not specified"}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={{
                  backgroundColor: "var(--primary-color)",
                  borderRadius: "12px",
                  px: 4,
                  py: 1.5,
                  fontSize: "1rem",
                  "&:hover": {
                    backgroundColor: "var(--primary-hover)",
                  },
                }}
              >
                Add organization
              </Button>
            </Box>
            <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <SearchIcon
                      sx={{ mr: 1, color: "var(--text-secondary)" }}
                    />
                  ),
                  sx: { borderRadius: "var(--border-radius)" },
                }}
              />
              <Button
                variant="outlined"
                sx={{
                  borderColor: "var(--primary-color)",
                  color: "var(--primary-color)",
                  borderRadius: "var(--border-radius)", // Fixed typo
                  "&:hover": {
                    backgroundColor: "var(--primary-light)",
                    borderColor: "var(--primary-hover)",
                  },
                }}
              >
                Filters
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Organization ID</TableCell>
                    <TableCell>Organization Name</TableCell>
                    <TableCell>Domain</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Loading organizations...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No organizations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((org) => (
                      <TableRow key={org.orgId}>
                        <TableCell>{org.orgId}</TableCell>
                        <TableCell>{org.orgName}</TableCell>
                        <TableCell>{org.domain}</TableCell>
                        <TableCell>
                          {org.createdAt
                            ? new Date(org.createdAt).toLocaleString()
                            : ""}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleOpenDeleteDialog(org)}
                            color="error"
                            aria-label="delete organization"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </StyledPaper>
          <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Add New Organization</DialogTitle>
            <DialogContent>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
              >
                <TextField
                  label="Organization Name"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Domain Name (e.g., hdfc.in)"
                  name="domainName"
                  value={formData.domainName}
                  onChange={handleChange}
                  fullWidth
                  required
                  helperText="Must be unique and in correct format (e.g., domain.com)"
                />
                <TextField
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Owner Email"
                  name="ownerEmail"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  fullWidth
                  required
                  helperText="Email domain must match organization domain"
                />
                <TextField
                  label="Password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <IconButton onClick={togglePasswordVisibility}>
                        {showPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    ),
                  }}
                  helperText="Password must be at least 8 characters long"
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                variant="contained"
                color="primary"
              >
                Add organization
              </Button>
            </DialogActions>
          </Dialog>
          <Dialog
            open={deleteDialogOpen}
            onClose={handleCloseDeleteDialog}
            fullWidth
            maxWidth="sm"
            slotProps={{
              paper: {
                sx: {
                  backgroundColor: "var(--bg-paper)",
                  borderRadius: "var(--border-radius)",
                  padding: 2,
                  boxShadow: "var(--shadow-lg)",
                },
              },
            }}
          >
            <DialogTitle
              sx={{
                color: "var(--text-primary)",
                fontWeight: "bold",
                fontSize: "1.25rem",
                pb: 2,
              }}
            >
              Confirm Deletion
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <DialogContentText
                sx={{
                  color: "var(--text-secondary)",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                }}
              >
                Are you sure you want to delete this organization? This action
                cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions
              sx={{
                padding: 2,
                gap: 2,
              }}
            >
              <Button
                onClick={handleCloseDeleteDialog}
                variant="outlined"
                sx={{
                  color: "var(--text-primary)",
                  borderColor: "var(--border-color)",
                  "&:hover": {
                    backgroundColor: "var(--primary-light-hover)",
                    borderColor: "var(--primary-color)",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteUser}
                variant="contained"
                startIcon={<DeleteIcon />}
                sx={{
                  backgroundColor: "var(--error-color)",
                  "&:hover": {
                    backgroundColor: "#d32f2f",
                  },
                }}
              >
                Delete Organization
              </Button>
            </DialogActions>
          </Dialog>
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;
