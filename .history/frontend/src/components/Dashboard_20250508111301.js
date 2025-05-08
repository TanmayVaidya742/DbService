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
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Groups as GroupsIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { styled } from "@mui/material/styles";

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
    fullName: "",
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

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/users", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setSnackbar({
        open: true,
        message: "Error fetching users",
        severity: "error",
      });
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
      ownerEmail: "",
      fullName: "",
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
    // Validate all fields are filled
    if (
      !formData.organizationName ||
      !formData.domainName ||
      !formData.ownerEmail ||
      !formData.fullName ||
      !formData.password
    ) {
      setSnackbar({
        open: true,
        message: "Please fill in all fields",
        severity: "error",
      });
      return;
    }

    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(formData.domainName)) {
      setSnackbar({
        open: true,
        message: "Invalid domain name format",
        severity: "error",
      });
      return;
    }

    // Validate email matches domain
    const emailDomain = formData.ownerEmail.split("@")[1];
    if (emailDomain !== formData.domainName) {
      setSnackbar({
        open: true,
        message: "Owner email domain must match organization domain",
        severity: "error",
      });
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/users",
        {
          organizationName: formData.organizationName,
          domainName: formData.domainName,
          ownerEmail: formData.ownerEmail,
          fullName: formData.fullName,
          password: formData.password,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSnackbar({
        open: true,
        message: "Organization created successfully",
        severity: "success",
      });

      await fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error("Error adding organization:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Error creating organization",
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
      const response = await axios.delete(
        `http://localhost:5000/api/users/${userToDelete}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSnackbar({
        open: true,
        message: "User deleted successfully",
        severity: "success",
      });

      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.user_id !== userToDelete)
      );
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Error deleting user:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Error deleting user",
        severity: "error",
      });
      handleCloseDeleteDialog();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredUsers = users.filter((user) =>
    (user.username?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6">1SPOC DAAS</Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button onClick={() => navigate("/superadmin-dashboard")}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => navigate("/organizations")}>
          <ListItemIcon>
            <GroupsIcon />
          </ListItemIcon>
          <ListItemText primary="Organizations" />
        </ListItem>
      </List>
    </div>
  );

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
            sx={{
              color: "var(--primary-text)",
              mr: 2,
            }}
          >
            {superadmins.length > 0 ? superadmins[0].email : "Loading..."}
          </Typography>
        </Toolbar>


      </AppBar>

      <Box
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
            "& .MuiDrawer-paper": { width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

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
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
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
                placeholder="Search users..."
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
                  borderRadius: "var(--border-radius)",
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
                    <TableCell>Full Name</TableCell>
                    <TableCell>Domain Name</TableCell>
                    <TableCell>Owner Email</TableCell>
                    <TableCell>Organization Name</TableCell>
                    <TableCell>Date And Time</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                backgroundColor: "var(--primary-color)",
                                color: "var(--primary-text)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {user.full_name?.[0]?.toUpperCase()}
                            </Box>
                            {user.full_name || ""}
                          </Box>
                        </TableCell>
                        <TableCell>{user.domain_name || ""}</TableCell>
                        <TableCell>{user.owner_email || ""}</TableCell>
                        <TableCell>{user.organization_name || ""}</TableCell>
                        <TableCell>
                          {user.created_at
                            ? (() => {
                                const date = new Date(user.created_at);
                                const day = String(date.getDate()).padStart(
                                  2,
                                  "0"
                                );
                                const month = String(
                                  date.getMonth() + 1
                                ).padStart(2, "0"); // months are 0-indexed
                                const year = String(date.getFullYear()).slice(
                                  -2
                                ); // last 2 digits of year
                                const time = date.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }); // HH:MM format
                                return `${day}/${month}/${year} ${time}`;
                              })()
                            : ""}
                        </TableCell>{" "}
                        <TableCell>
                          <IconButton
                            onClick={() => handleOpenDeleteDialog(user.user_id)}
                            color="error"
                            aria-label="delete user"
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

          {/* Organization Creation Dialog */}
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
                  label="Full Name"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  fullWidth
                  required
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

          {/* Delete Confirmation Dialog */}
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
