import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Container,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Snackbar,
  Alert,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Storage as StorageIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from "@mui/icons-material";
import EditTableDialog from "./EditTableDialog";
import AddIcon from "@mui/icons-material/Add";
import CreateTableDialog from "./CreateTableDialog";


const drawerWidth = 240;

const DatabaseDetails = () => {
  const { dbName } = useParams();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [database, setDatabase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentTable, setCurrentTable] = useState(null);
  const [openTableDialog, setOpenTableDialog] = useState(false);

  const [editDialog, setEditDialog] = useState({
    open: false,
    dbName: "",
    tableName: "",
    columns: [],
  });
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    tableName: "",
  });

  // Add this handler function:
  const handleCreateTable = async (dbName, formData) => {
    try {
      setSnackbar({
        open: true,
        message: "Creating table...",
        severity: "info",
        autoHideDuration: null,
      });

      const response = await axios.post(
        `http://localhost:5000/api/databases/${dbName}/create-table`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSnackbar({
        open: true,
        message: "Table created successfully!",
        severity: "success",
      });

      // Refresh the database details
      await fetchDatabaseDetails();
      setOpenTableDialog(false);
    } catch (error) {
      console.error("Error creating table:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Failed to create table",
        severity: "error",
      });
    }
  };

  const handleEditTable = (dbName, tableName) => {
    axios
      .get(
        `http://localhost:5000/api/databases/${dbName}/tables/${tableName}/columns`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )
      .then((response) => {
        setEditDialog({
          open: true,
          dbName,
          tableName,
          columns: response.data,
        });
      })
      .catch((error) => {
        console.error("Error fetching table columns:", error);
        setSnackbar({
          open: true,
          message:
            error.response?.data?.error || "Failed to fetch table columns",
          severity: "error",
        });
      });
  };

  const handleSaveTableChanges = async (dbName, tableName, columns) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/databases/${dbName}/${tableName}`,
        { columns },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Update the local state
      const updatedDatabase = JSON.parse(JSON.stringify(database));
      const tableIndex = updatedDatabase.tables.findIndex(
        table => table.tablename === tableName
      );

      if (tableIndex !== -1) {
        const newSchema = {};
        columns.forEach(col => {
          newSchema[col.column_name] = col.data_type;
        });
        updatedDatabase.tables[tableIndex].schema = newSchema;
        updatedDatabase.tables[tableIndex].columns = columns;
      }

      setDatabase(updatedDatabase);

      setSnackbar({
        open: true,
        message: response.data?.message || "Table updated successfully!",
        severity: "success",
      });

      // Close the dialog by resetting the editDialog state
      setEditDialog({
        open: false,
        dbName: "",
        tableName: "",
        columns: []
      });

    } catch (error) {
      console.error("Error updating table:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Failed to update table",
        severity: "error",
      });
      throw error; // Re-throw to prevent dialog from closing
    }
  };

  const fetchDatabaseDetails = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/databases/${dbName}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setDatabase(response.data);
    } catch (error) {
      console.error("Error fetching database details:", error);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.error || "Failed to fetch database details",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseDetails();
  }, [dbName]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleMenuOpen = (event, table) => {
    setAnchorEl(event.currentTarget);
    setCurrentTable(table);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setCurrentTable(null);
  };

  const generateandCopyUrlByActionType = (dbName, tableName, action) => {
    const baseUrl = process.env.REACT_APP_SERVER_BASE_URL;
    const queryRoute = process.env.REACT_APP_QUERY_ROUTE || "/api/query";

    let url = "";
    let method = "";

    switch (action) {
      case "read":
        url = `${baseUrl}${queryRoute}/${dbName}/${tableName}/get`;
        method = "POST";
        break;
      case "insert":
        url = `${baseUrl}${queryRoute}/${dbName}/${tableName}/insert`;
        method = "POST";
        break;
      case "update":
        url = `${baseUrl}${queryRoute}/${dbName}/${tableName}/update`;
        method = "POST";
        break;
      case "delete":
        url = `${baseUrl}${queryRoute}/${dbName}/${tableName}/delete`;
        method = "POST";
        break;
      default:
        console.error("Invalid action!!");
        return;
    }

    navigator.clipboard
      .writeText(url)
      .then(() => {
        setSnackbar({
          open: true,
          message: `${method} ${url} copied to clipboard!`,
          severity: "success",
        });
      })
      .catch((err) => {
        console.error("Failed to copy URL: ", err);
        setSnackbar({
          open: true,
          message: "Failed to copy URL to clipboard",
          severity: "error",
        });
      });

    return url;
  };

  const handleMenuAction = (action) => {
    generateandCopyUrlByActionType(dbName, currentTable.tablename, action);
    handleMenuClose();

    let message = "";
    switch (action) {
      case "read":
        message = "Send a POST request with filter object in body";
        break;
      case "insert":
        message = "Send a POST request with data object in body";
        break;
      case "update":
        message = "Send a POST request with filter and data objects in body";
        break;
      case "delete":
        message = "Send a POST request with filter object in body";
        break;
      default:
        message = "";
    }

    setSnackbar((prev) => ({
      ...prev,
      message: `${prev.message}\n${message}`,
    }));
  };

  const handleDeleteTable = async () => {
    try {
      await axios.delete(
        `http://localhost:5000/api/databases/${dbName}/tables/${deleteDialog.tableName}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setSnackbar({
        open: true,
        message: "Table deleted successfully!",
        severity: "success",
      });

      setDeleteDialog({ open: false, tableName: "" });
      await fetchDatabaseDetails();
    } catch (error) {
      console.error("Error deleting table:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Failed to delete table",
        severity: "error",
      });
    }
  };

  const handleDeleteClick = (table) => {
    setDeleteDialog({
      open: true,
      tableName: table.tablename
    });
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6">1SPOC</Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button onClick={() => navigate("/UserDashboard")}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="Users Dashboard" />
        </ListItem>
      </List>
    </div>
  );

  if (loading) {
    return (
      <Box sx={{ display: "flex" }}>
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: "var(--primary-color)",
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
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
            <Typography variant="h6" noWrap component="div">
              Database Details
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
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
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
                boxSizing: "border-box",
                width: drawerWidth,
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
          }}
        >
          <Toolbar />
          <Container maxWidth="lg">
            <Typography variant="h6">Loading database details...</Typography>
          </Container>
        </Box>
      </Box>
    );
  }

  if (!database) {
    return (
      <Box sx={{ display: "flex" }}>
        <AppBar
          position="fixed"
          sx={{
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: "var(--primary-color)",
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
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
            <Typography variant="h6" noWrap component="div">
              Database Details
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
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
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
                boxSizing: "border-box",
                width: drawerWidth,
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
          }}
        >
          <Toolbar />
          <Container maxWidth="lg">
            <Typography variant="h6">Database not found</Typography>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "var(--primary-color)",
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
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
          <Typography variant="h6" noWrap component="div">
            Database: {database.dbname}
          </Typography>
          <IconButton color="inherit" sx={{ ml: "auto" }}>
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
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
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
              boxSizing: "border-box",
              width: drawerWidth,
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
        }}
      >
        <Toolbar />
        <Container maxWidth="lg">
          <Box sx={{ mt: 4, mb: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
                width: "100%",
              }}
            >
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/UserDashboard")}
                sx={{
                  color: "var(--text-primary)",
                  "&:hover": {
                    backgroundColor: "var(--primary-light-hover)",
                  },
                }}
              >
                Back to Dashboard
              </Button>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenTableDialog(true)}
                sx={{
                  backgroundColor: "var(--primary-color)",
                  "&:hover": {
                    backgroundColor: "var(--primary-hover)",
                  },
                }}
              >
                Create Table
              </Button>
            </Box>
            <Paper elevation={3} sx={{
              p: 3,
              mb: 3,
              backgroundColor: 'var(--bg-paper)',
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--shadow-lg)'
            }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <StorageIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Typography variant="h4">{database.dbname}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <TableContainer
                sx={{
                  maxHeight: 'calc(100vh - 300px)',
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                    height: '8px'
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'var(--bg-secondary)'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'var(--primary-color)',
                    borderRadius: '4px'
                  }
                }}
              >
                <Table stickyHeader> {/* stickyHeader keeps the header visible while scrolling */}
                  <TableHead >
                    <TableRow>
                      <TableCell sx={{ backgroundColor: "var(--primary-light)" }}>Table Name</TableCell>
                      <TableCell sx={{ backgroundColor: "var(--primary-light)" }}>Columns</TableCell>
                      <TableCell sx={{ backgroundColor: "var(--primary-light)" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {database.tables.map((table) => (
                      <TableRow key={table.tablename}>
                        <TableCell>{table.tablename}</TableCell>
                        <TableCell>
                          {Object.entries(table.schema).map(
                            ([colName, colType]) => (
                              <Chip
                                key={colName}
                                label={`${colName}: ${colType}`}
                                sx={{ mr: 1, mb: 1, backgroundColor: "var(--primary-light)" }}
                                variant="outlined"
                              />
                            )
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                              aria-label="more"
                              aria-controls={`table-menu-${table.tablename}`}
                              aria-haspopup="true"
                              onClick={(e) => handleMenuOpen(e, table)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                            <IconButton
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTable(dbName, table.tablename);
                              }}
                              sx={{
                                color: "var(--primary-color)",
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(table);
                              }}
                              sx={{
                                color: 'var(--error-color)',
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>

          <EditTableDialog
            open={editDialog.open}
            onClose={() => setEditDialog({
              open: false,
              dbName: "",
              tableName: "",
              columns: []
            })}
            dbName={editDialog.dbName}
            tableName={editDialog.tableName}
            columns={editDialog.columns}
            onSave={handleSaveTableChanges}
          />
          <Menu
            id="table-actions-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleMenuAction("read")}>
              Read Data
            </MenuItem>
            <MenuItem onClick={() => handleMenuAction("insert")}>
              Insert Data
            </MenuItem>
            <MenuItem onClick={() => handleMenuAction("update")}>
              Update Data
            </MenuItem>
            <MenuItem onClick={() => handleMenuAction("delete")}>
              Delete Data
            </MenuItem>
          </Menu>
          <CreateTableDialog
            open={openTableDialog}
            onClose={() => setOpenTableDialog(false)}
            dbName={dbName}
            onSubmit={handleCreateTable}
          />

          <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}>
            <DialogTitle style={{ color: 'var(--text-primary)' }}>
              Delete Table
            </DialogTitle>
            <DialogContent>
              <DialogContentText style={{ color: 'var(--text-primary)' }}>
                Are you sure you want to delete table "{deleteDialog.tableName}"?
                This action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setDeleteDialog({ ...deleteDialog, open: false })}
                sx={{
                  color: 'var(--text-primary)',
                  '&:hover': {
                    backgroundColor: 'var(--primary-light-hover)'
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTable}
                sx={{
                  backgroundColor: 'var(--error-color)',
                  '&:hover': {
                    backgroundColor: '#d32f2f',
                  },
                }}
                variant="contained"
                startIcon={<DeleteIcon />}
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
              sx={{ width: "100%" }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>
        </Container>
      </Box>
    </Box>
  );
};

export default DatabaseDetails;