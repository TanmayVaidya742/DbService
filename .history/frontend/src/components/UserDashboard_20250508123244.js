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
  Paper,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  Grid,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Storage as StorageIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ContentCopy as ContentCopyIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AddDatabaseDialog from "./AddDatabaseDialog";
import { styled } from "@mui/material/styles";
import { Person as PersonIcon } from "@mui/icons-material";
import { FaDatabase } from "react-icons/fa";

import { CiViewTable } from "react-icons/ci";


const drawerWidth = 240;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: "var(--spacing-unit) * 3",
  borderRadius: "var(--border-radius)",
  boxShadow: "var(--shadow-lg)",
  backgroundColor: "var(--bg-paper)",
  marginTop: "var(--spacing-unit) * 3",
}));

// Custom styled TableCell for equal width
const EqualWidthTableCell = styled(TableCell)({
  width: '20%', // 5 columns = 20% each
  textAlign: 'center',
});

const UserDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [openTableDialog, setOpenTableDialog] = useState(false);
  const [currentDbForTable, setCurrentDbForTable] = useState('');
  const [tableFormData, setTableFormData] = useState({
    tableName: '',
  });
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

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/databases", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const transformedData = response.data.map((db) => ({
        name: db.dbname,
        tables: db.tables.filter((t) => t.tablename).map((t) => t.tablename),
        apiKey: db.apikey,
        dbid: db.dbid,
      }));

      setDatabases(transformedData);
    } catch (error) {
      console.error("Error fetching databases:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Failed to fetch databases",
        severity: "error",
      });
      setDatabases([]);
    }
  };

  const handleDeleteDatabase = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/databases/${deleteDialog.name}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSnackbar({
        open: true,
        message: "Database deleted successfully!",
        severity: "success",
      });

      setDeleteDialog({ ...deleteDialog, open: false });
      fetchDatabases();
    } catch (error) {
      console.error("Error deleting database:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Failed to delete database",
        severity: "error",
      });
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

  const handleOpenTableDialog = (dbName) => {
    setCurrentDbForTable(dbName);
    setOpenTableDialog(true);
  };

  const handleCloseTableDialog = () => {
    setOpenTableDialog(false);
    setTableFormData({
      tableName: '',
    });
    setCurrentDbForTable('');
  };

  const handleDatabaseSubmit = async (formData) => {
    try {
      if (!formData.databaseName) {
        setSnackbar({
          open: true,
          message: "Database name is required",
          severity: "error",
        });
        return;
      }

      setSnackbar({
        open: true,
        message: "Creating database...",
        severity: "info",
        autoHideDuration: null,
      });

      const response = await axios.post(
        "http://localhost:5000/api/databases",
        {
          databaseName: formData.databaseName,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          timeout: 30000,
        }
      );

      setSnackbar({
        open: true,
        message: "Database created successfully!",
        severity: "success",
      });

      await fetchDatabases();
      handleCloseDialog();

      if (response.data.apiKey) {
        setCurrentApiKey(response.data.apiKey);
        setOpenApiKeyDialog(false);
      }
    } catch (error) {
      console.error("Error creating database:", error);

      let errorMessage = "Error creating database";
      if (error.response) {
        errorMessage =
          error.response.data.error ||
          error.response.data.message ||
          errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setSnackbar({
        open: true,
        message: errorMessage,
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

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRowClick = (dbName) => {
    navigate(`/database/${encodeURIComponent(dbName)}`);
  };

  const drawer = (
    <div style={{ backgroundColor: "var(--bg-paper)" }}>
      <Toolbar>
        <Typography variant="h6" style={{ color: "var(--text-primary)" }}>
          1SPOC
        </Typography>
      </Toolbar>
      <Divider style={{ backgroundColor: "var(--border-color)" }} />
      <List>
        <ListItem
          button
          onClick={() => navigate("/dashboard")}
          style={{ color: "var(--text-primary)" }}
        >
          <ListItemIcon>
            <PersonIcon style={{ color: "var(--primary-color)" }} />
          </ListItemIcon>
          <ListItemText primary="Databases" />
          
        </ListItem>

      </List>
       <List>
              <ListItem
                button
                onClick={() => navigate("/pricing", { state: { dbName: dbName } })}
                style={{ color: "var(--text-primary)" }}
              >
                <ListItemIcon>
                  <StoreIcon />
                </ListItemIcon>
                <ListItemText primary="Pricing Plans" />
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
            sx={{ flexGrow: 1 }}
            style={{ color: "var(--primary-text)" }}
          >
            Databases
          </Typography>

          <IconButton color="inherit">
            <SettingsIcon />
          </IconButton>
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
      </Box>

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
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
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
                      key={db.name}
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
                        {db.name}
                      </EqualWidthTableCell>

                      <EqualWidthTableCell>
                        <Button
                          variant="outlined"
                          startIcon={<CiViewTable />}
                          sx={{
                            fontWeight:"medium",
                            textTransform: "none",
                            borderColor: "var(--primary-color)",
                            color: "var(--primary-color)",
                            "&:hover": {
                              borderColor: "var(--primary-hover)",
                            },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(db.name);
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
                          {db.tables.length}
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
                              handleDeleteClick("database", db.name);
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