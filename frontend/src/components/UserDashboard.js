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
  Button,
  Paper,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  Grid,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ContentCopy as ContentCopyIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import AddDatabaseDialog from "./AddDatabaseDialog";
import { styled } from "@mui/material/styles";
import { FaDatabase } from "react-icons/fa";
import { CiViewTable } from "react-icons/ci";
import DashboardCustomizeRoundedIcon from "@mui/icons-material/DashboardCustomizeRounded";
import { useSelector } from "react-redux";

const drawerWidth = 240;

const EqualWidthTableCell = styled(TableCell)({
  width: "20%",
  textAlign: "center",
});

const UserDashboard = () => {
  const state = useSelector((store) => store.dbaasStore);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [databaseFormData, setDatabaseFormData] = useState({
    databaseName: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [databases, setDatabases] = useState([]);
  const [openApiKeyDialog, setOpenApiKeyDialog] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState("");
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    type: "",
    name: "",
    dbName: "",
  });
  const [currentUser, setCurrentUser] = useState({
    email: "",
    id: "",
    name: "",
    orgId: "",
    orgName: "",
  });

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user")) || state.userData;
      if (!user) {
        setSnackbar({
          open: true,
          message: "Not authenticated. Please log in.",
          severity: "error",
        });
        navigate("/login");
        return;
      }

      // First try to get orgName from localStorage
      const cachedOrgName = localStorage.getItem("orgName");

      // Fetch user data
      const userResponse = await axiosInstance.get("/users/get-user", {
        params: { orgId: user.orgId },
        headers: { Authorization: `${token}` },
      });

      if (userResponse.data?.data?.[0]) {
        const userData = userResponse.data.data[0];
        let orgName;
        // Fetch organization data to get orgName
        if (!state.userData.unitDetails) {
          const orgResponse = await axiosInstance.get("/orgs");
          const orgData = orgResponse.data.data.find(
            (org) => org.orgId === userData.orgId
          );
          orgName = orgData ? orgData.orgName : "Not specified";
        }

        // If we have cached orgName, use that
        if (cachedOrgName) {
          setCurrentUser({
            email: userData.email || "",
            id: userData.userId || "",
            name: `${userData.firstName || ""} ${
              userData.lastName || ""
            }`.trim(),
            orgId: userData.orgId || user.orgId || "",
            // orgName: cachedOrgName,
          });
          return;
        }

        // Store in localStorage if we found a proper name
        if (orgName && orgName !== userData.orgId) {
          localStorage.setItem("orgName", orgName);
        }

        setCurrentUser({
          email: userData.email || "",
          id: userData.userId || "",
          name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim(),
          orgId: userData.orgId || user.orgId || "",
          orgName: orgName,
        });
      } else {
        console.error("User data missing in response:", userResponse.data);
        setSnackbar({
          open: true,
          message: "User data incomplete",
          severity: "warning",
        });
        navigate("/login");
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Failed to load user data",
        severity: "error",
      });
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchDatabases = async () => {
    try {
      const response = await axiosInstance.get("/database", {
        params: { userId: currentUser.id },
        headers: {
          Authorization: `${localStorage.getItem("token")}`,
        },
      });

      if (response.data && response.data.success) {
        setDatabases(response.data.data || []);
      } else {
        setDatabases([]);
      }
    } catch (error) {
      console.error("Error fetching databases:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to fetch databases",
        severity: "error",
      });
      setDatabases([]);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [navigate]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchDatabases();
    }
  }, [currentUser?.id]);

  const handleDeleteDatabase = async () => {
    try {
      const response = await axiosInstance.delete(
        `/database/${deleteDialog.name}`,
        {
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data && response.data.success) {
        setSnackbar({
          open: true,
          message: response.data.message || "Database deleted successfully!",
          severity: "success",
        });
        setDeleteDialog({ ...deleteDialog, open: false });
        await fetchDatabases();
      } else {
        throw new Error(response.data.message || "Failed to delete database");
      }
    } catch (error) {
      console.error("Error deleting database:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to delete database",
        severity: "error",
      });
      setDeleteDialog({ ...deleteDialog, open: false });
    }
  };

  const handleDeleteClick = (type, name, dbName = "") => {
    setDeleteDialog({
      open: true,
      type,
      name,
      dbName,
    });
  };

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDatabaseFormData({
      databaseName: "",
    });
  };

  const handleDatabaseSubmit = async (formData) => {
    if (!formData.databaseName) {
      setSnackbar({
        open: true,
        message: "Database name is required",
        severity: "error",
      });
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(formData.databaseName)) {
      setSnackbar({
        open: true,
        message:
          "Database name can only contain letters, numbers, underscores, and hyphens",
        severity: "error",
      });
      return;
    }

    if (formData.databaseName.length > 63) {
      setSnackbar({
        open: true,
        message: "Database name must be 63 characters or less",
        severity: "error",
      });
      return;
    }

    try {
      setSnackbar({
        open: true,
        message: "Creating database...",
        severity: "info",
        autoHideDuration: null,
      });

      const response = await axiosInstance.post(
        "/database",
        { databaseName: formData.databaseName },
        { headers: { Authorization: `${localStorage.getItem("token")}` } }
      );

      setSnackbar({
        open: true,
        message: response.data.message || "Database created successfully!",
        severity: "success",
      });

      await fetchDatabases();
      handleCloseDialog();

      if (response.data.apiKey) {
        setCurrentApiKey(response.data.apiKey);
        setOpenApiKeyDialog(true);
      }
    } catch (error) {
      console.error("Error creating database:", error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message ||
          error.message ||
          "Failed to create database",
        severity: "error",
      });
    }
  };

  const handleShowApiKey = (apiKey) => {
    setCurrentApiKey(apiKey);
    setOpenApiKeyDialog(true);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(currentApiKey);
    setSnackbar({
      open: true,
      message: "API key copied to clipboard!",
      severity: "success",
    });
    setOpenApiKeyDialog(false);
  };

  const handleRowClick = (dbName, dbId) => {
    navigate(
      `/database/${encodeURIComponent(dbName)}/${encodeURIComponent(dbId)}`
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("orgName");
    setCurrentUser({
      email: "",
      id: "",
      name: "",
      orgId: "",
      orgName: "",
    });
    setSnackbar({
      open: true,
      message: "Logged out successfully",
      severity: "success",
    });
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

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
            sx={{ flexGrow: 1 }}
            style={{ color: "var(--primary-text)" }}
          >
            Databases
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

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        <Toolbar />
        <Grid>
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
                }}
              >
                Welcome, {currentUser?.name || "User"}
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
              startIcon={<FaDatabase />}
              onClick={handleOpenDialog}
              sx={{
                backgroundColor: "var(--primary-color)",
                borderRadius: "var(--border-radius)",
                px: 4,
                py: 1.5,
                fontSize: "var(--font-size-base)",
                "&:hover": {
                  backgroundColor: "var(--primary-hover)",
                },
              }}
            >
              Create Database
            </Button>
          </Box>

          <Paper
            elevation={3}
            sx={{
              mb: 3,
              backgroundColor: "var(--bg-paper)",
              borderRadius: "var(--border-radius)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <TableContainer
              sx={{
                maxHeight: "calc(100vh - 300px)",
                overflow: "auto",
                "&::-webkit-scrollbar": {
                  width: "8px",
                  height: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "var(--bg-secondary)",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "var(--primary-color)",
                  borderRadius: "4px",
                },
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <EqualWidthTableCell
                      style={{
                        color: "var(--text-primary)",
                        backgroundColor: "var(--primary-light)",
                        fontWeight: "bold",
                      }}
                    >
                      Database Name
                    </EqualWidthTableCell>

                    <EqualWidthTableCell
                      style={{
                        color: "var(--text-primary)",
                        backgroundColor: "var(--primary-light)",
                        fontWeight: "bold",
                      }}
                    >
                      Tables
                    </EqualWidthTableCell>

                    <EqualWidthTableCell
                      style={{
                        color: "var(--text-primary)",
                        backgroundColor: "var(--primary-light)",
                        fontWeight: "bold",
                      }}
                    >
                      Tables Count
                    </EqualWidthTableCell>

                    <EqualWidthTableCell
                      style={{
                        color: "var(--text-primary)",
                        backgroundColor: "var(--primary-light)",
                        fontWeight: "bold",
                      }}
                    >
                      API Key
                    </EqualWidthTableCell>

                    <EqualWidthTableCell
                      style={{
                        color: "var(--text-primary)",
                        backgroundColor: "var(--primary-light)",
                        fontWeight: "bold",
                      }}
                    >
                      Actions
                    </EqualWidthTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {databases.map((db) => (
                    <TableRow
                      key={db.dbName}
                      hover
                      sx={{
                        "&:hover": {
                          backgroundColor: "var(--primary-light-hover)",
                        },
                      }}
                    >
                      <EqualWidthTableCell
                        style={{ color: "var(--text-primary)" }}
                      >
                        {db.dbName}
                      </EqualWidthTableCell>

                      <EqualWidthTableCell>
                        <Button
                          variant="outlined"
                          startIcon={<CiViewTable />}
                          sx={{
                            fontWeight: "medium",
                            textTransform: "none",
                            borderColor: "var(--primary-color)",
                            color: "var(--primary-color)",
                            "&:hover": {
                              borderColor: "var(--primary-hover)",
                            },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(db.dbName, db.dbId);
                          }}
                        >
                          Tables
                        </Button>
                      </EqualWidthTableCell>

                      <EqualWidthTableCell
                        style={{ color: "var(--text-primary)" }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "var(--primary-light)",
                            borderRadius: "50%",
                            width: "32px",
                            height: "32px",
                            color: "var(--primary-color)",
                            fontWeight: "bold",
                            fontSize: "0.875rem",
                            margin: "0 auto",
                          }}
                        >
                          {db.tableCount || 0}
                        </Box>
                      </EqualWidthTableCell>

                      <EqualWidthTableCell>
                        {db.apiKey && (
                          <Button
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowApiKey(db.apiKey);
                            }}
                            sx={{
                              textTransform: "none",
                              borderColor: "var(--primary-color)",
                              color: "var(--primary-color)",
                              "&:hover": {
                                borderColor: "var(--primary-hover)",
                              },
                            }}
                          >
                            Show API Key
                          </Button>
                        )}
                      </EqualWidthTableCell>

                      <EqualWidthTableCell>
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "center",
                          }}
                        >
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick("database", db.dbName);
                            }}
                            sx={{ color: "var(--error-color)" }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </EqualWidthTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <AddDatabaseDialog
          open={openDialog}
          onClose={handleCloseDialog}
          onSubmit={handleDatabaseSubmit}
        />

        <Dialog
          open={openApiKeyDialog}
          onClose={() => setOpenApiKeyDialog(false)}
        >
          <DialogTitle style={{ color: "var(--text-primary)" }}>
            API Key
          </DialogTitle>
          <DialogContent>
            <DialogContentText style={{ color: "var(--text-primary)" }}>
              Here is your API key for this database. Keep it secure and don't
              share it with others.
            </DialogContentText>
            <Box
              sx={{
                mt: 2,
                p: 2,
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "var(--border-radius-sm)",
                wordBreak: "break-all",
                fontFamily: "monospace",
                color: "var(--text-primary)",
              }}
            >
              {currentApiKey}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setOpenApiKeyDialog(false)}
              sx={{
                color: "var(--text-primary)",
                "&:hover": {
                  backgroundColor: "var(--primary-light-hover)",
                },
              }}
            >
              Close
            </Button>
            <Button
              onClick={handleCopyApiKey}
              startIcon={<ContentCopyIcon />}
              variant="contained"
              sx={{
                backgroundColor: "var(--primary-color)",
                "&:hover": {
                  backgroundColor: "var(--primary-hover)",
                },
              }}
            >
              Copy
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={deleteDialog.open}
          onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
          fullWidth
          maxWidth="sm"
          slotProps={{
            paper: {
              sx: {
                backgroundColor: "var(--bg-paper)",
                borderRadius: "var(--border-radius)",
                padding: 2,
              },
            },
          }}
        >
          <DialogTitle
            sx={{ color: "var(--text-primary)", fontWeight: "bold" }}
          >
            Delete {deleteDialog.type === "database" ? "Database" : "Table"}
          </DialogTitle>

          <DialogContent>
            <DialogContentText sx={{ color: "var(--text-secondary)", mb: 2 }}>
              Are you sure you want to delete {deleteDialog.type} "
              {deleteDialog.name}"? This action cannot be undone.
            </DialogContentText>
          </DialogContent>

          <DialogActions sx={{ padding: 2, gap: 2 }}>
            <Button
              onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
              variant="outlined"
              sx={{
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
                "&:hover": {
                  backgroundColor: "var(--primary-light-hover)",
                },
              }}
            >
              Cancel
            </Button>

            <Button
              onClick={handleDeleteDatabase}
              variant="contained"
              startIcon={<DeleteIcon />}
              sx={{
                backgroundColor: "var(--error-color)",
                "&:hover": {
                  backgroundColor: "#d32f2f",
                },
              }}
            >
              Delete
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
            sx={{
              width: "100%",
              backgroundColor:
                snackbar.severity === "error"
                  ? "var(--error-color)"
                  : snackbar.severity === "success"
                  ? "var(--success-color)"
                  : snackbar.severity === "warning"
                  ? "var(--warning-color)"
                  : "var(--info-color)",
              color: "white",
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default UserDashboard;
