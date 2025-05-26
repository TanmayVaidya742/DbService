import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, data } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LinkIcon from "@mui/icons-material/Link";
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
  DialogActions,
  TextField,
  InputAdornment,
  TablePagination,
  Popover,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import {
  ArrowBack as ArrowBackIcon,
  Storage as StorageIcon,
  Menu as MenuIcon,
  Settings as SettingsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import EditTableDialog from "./EditTableDialog";
import CreateTableDialog from "./CreateTableDialog";
import { FaDatabase } from "react-icons/fa";
import { CiViewTable } from "react-icons/ci";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import UpgradeDialog from "./UpgradeDialog";
import StoreIcon from "@mui/icons-material/Store";
import DashboardIcon from "@mui/icons-material/Dashboard";
import StorageRoundedIcon from "@mui/icons-material/StorageRounded";

const drawerWidth = 240;

const DatabaseDetails = () => {
  const { dbName, dbId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [database, setDatabase] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState({});
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
  const [viewDataDialog, setViewDataDialog] = useState({
    open: false,
    tableName: "",
    data: [],
    columns: [],
    searchTerm: "",
    page: 0,
    rowsPerPage: 10,
  });
  const [columnsAnchorEl, setColumnsAnchorEl] = useState(null);
  const [expandedTable, setExpandedTable] = useState(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [tableHasData, setTableHasData] = useState(false);

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

      const response = await axiosInstance.get("/users/get-user", {
        params: { orgId: user.orgId },
        headers: { Authorization: `${token}` },
      });

      if (response.data && response.data.data) {
        const userData = response.data.data[0];
        setCurrentUser({
          email: userData.email,
          id: userData.userId,
          name: `${userData.firstName} ${userData.lastName}`,
        });
      } else {
        console.error("User data missing in response:", response.data);
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

  useEffect(() => {
    fetchCurrentUser();
  }, [navigate]);


  // const getAllTablesByDbId = async () => {
  //   try {
  //     const response = await axiosInstance.get(`/table/${dbId}/tables`, {
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //       },
  //     });
  //     setTableData(response.data || []);
  //   } catch (error) {
  //     console.error("Error fetching tables:", error);
  //     setSnackbar({
  //       open: true,
  //       message: error.response?.data?.error || "Failed to fetch tables",
  //       severity: "error",
  //     });
  //     setTableData([]);
  //   }
  // };

  useEffect(() => {
    Promise.all([fetchDatabaseDetails(), getAllTablesByDbId()])
      .catch((error) => {
        console.error("Error fetching initial data:", error);
        setSnackbar({
          open: true,
          message: error.response?.data?.error || "Failed to load data",
          severity: "error",
        });
      });
  }, [dbName, dbId]);

  const handleShowMoreColumns = (event, table) => {
    setColumnsAnchorEl(event.currentTarget);   
    setExpandedTable(table);
  };

  const handleCloseColumnsPopup = () => {
    setColumnsAnchorEl(null);
    setExpandedTable(null);
  };

  const handleCreateTable = async (dbName, formData) => {
    setSnackbar({ open: false, message: "" });
    try {
      setSnackbar({
        open: true,
        message: "Creating table...",
        severity: "info",
        autoHideDuration: null,
      });

      const response = await axiosInstance.post(
        `/table/${dbName}/tables`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `${localStorage.getItem("token")}`,
          },
        }
      );

      setSnackbar({
        open: true,
        message: response.data.message || "Table created successfully!",
        severity: "success",
      });
      await fetchDatabaseDetails();
      await getAllTablesByDbId();
      setOpenTableDialog(false);
    } catch (error) {
      setSnackbar({ open: false, message: "" });
      if (error.response?.status === 403) {
        setUpgradeDialogOpen(true);
      } else {
        console.error("Error creating table:", error);
        setSnackbar({
          open: true,
          message: error.response?.data?.error || "Failed to create table",
          severity: "error",
        });
      }
    }
  };

  const handleEditTable = async (dbName, tableName) => {
    try {
      const response = await axiosInstance.get(
        `/table/${dbName}/tables/${tableName}/columns`,
        {
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
          },
        }
      );

      // Transform the API response into the expected format
      const columns = response.data.map((column) => ({
        column_name: column.name,
        data_type: column.type,
        column_default: column.defaultValue || null,
        is_nullable: column.isNullable ? "YES" : "NO",
        is_primary: column.isPrimary || false,
        is_unique: column.isUnique || false,
      }));

      setEditDialog({
        open: true,
        dbName,
        tableName,
        columns,
      });
    } catch (error) {
      console.error("Error fetching table columns:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Failed to fetch table columns",
        severity: "error",
      });
    }
  };

  // Updated handleSaveTableChanges function
  const handleSaveTableChanges = async (dbName, tableName, columns) => {
    try {
      // Transform columns to match backend expected format
      const formattedColumns = columns.map((column) => ({
        name: column.column_name,
        type: column.data_type,
        isNullable: column.is_nullable === "YES",
        isUnique: column.is_unique || false,
        isPrimary: column.is_primary || false,
        defaultValue: column.column_default || null,
      }));

      const response = await axiosInstance.put(
        `/table/${dbName}/tables/${tableName}`,
        {
          columns: JSON.stringify(formattedColumns), // Stringify as backend expects
        },
        {
          params: { dbId: dbId },
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Refresh the table data after successful update
      await fetchDatabaseDetails();

      setSnackbar({
        open: true,
        message: "Table updated successfully!",
        severity: "success",
      });
      await Promise.all([fetchDatabaseDetails(), getAllTablesByDbId()]);
      return true;
    } catch (error) {
      console.error("Error updating table:", error);
      let errorMessage = "Failed to update table";

      if (error.response) {
        errorMessage =
          error.response.data?.details ||
          error.response.data?.error ||
          errorMessage;

        // Handle specific error cases
        if (error.response.status === 403) {
          setUpgradeDialogOpen(true);
          errorMessage = "Upgrade required to modify table structure";
        }
      }

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
      return false;
    }
  };

  const fetchDatabaseDetails = async () => {
    try {
      const response = await axiosInstance.get(`/database/get-by-dbid`, {
        params: { dbId, dbName },
        headers: {
          Authorization: `${localStorage.getItem("token")}`,
        },
      });
      const data = response.data;
      data.tables = data.tables || [];
      if (data.tables) {
        data.tables = data.tables.map((table) => ({
          ...table,
          schema: table.schema || {},
        }));
      }
      setDatabase(data);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    navigate("/login");
  };

  const generateandCopyUrlByActionType = (dbName, tableName, action) => {
    const baseUrl = process.env.REACT_APP_SERVER_BASE_URL;
    const queryRoute = process.env.REACT_APP_QUERY_ROUTE_ODATA || "/api/query";
    let url = "";

    switch (action) {
      case "read":
        url = `${baseUrl}${queryRoute}/${dbName}/${tableName}?$filter=name eq 'John'&$select=id,name&$orderby=created_at desc&$top=10&$skip=0&$count=true`;
        break;
      case "insert":
        url = `${baseUrl}${queryRoute}/${dbName}/${tableName}/insert`;
        break;
      case "update":
        url = `${baseUrl}${queryRoute}/${dbName}/${tableName}?$filter=id eq 1&$update=name=Jane,age=31`;
        break;
      case "delete":
        url = `${baseUrl}${queryRoute}/${dbName}/${tableName}?$filter=id eq 1`;
        break;
      default:
        console.error("Invalid action!");
        return;
    }

    navigator.clipboard
      .writeText(url)
      .then(() => {
        setSnackbar({
          open: true,
          message: (
            <div>
              <div>{`${
                action.charAt(0).toUpperCase() + action.slice(1)
              } URL copied to clipboard!`}</div>
              <div
                style={{
                  fontFamily: "monospace",
                  padding: "8px",
                  borderRadius: "4px",
                  marginTop: "8px",
                  wordBreak: "break-all",
                  fontSize: "0.9em",
                }}
              >
                {url}
              </div>
            </div>
          ),
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
    generateandCopyUrlByActionType(dbName, currentTable.tableName, action);
    handleMenuClose();
  };

  const handleViewData = async (table) => {
    try {
      const columnsResponse = await axiosInstance.get(
        `/table/${dbId}/view-table-column`,
        {
          params: {dbName: dbName, tableName: table.tableName},
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
          },
        }
      );

      const dataResponse = await axiosInstance.get(
        `/table/${dbId}/view-table-data`,
        {
          params: {dbName: dbName, tableName: table.tableName},
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
          },
        }
      );

      setViewDataDialog({
        open: true,
        tableName: table.tableName,
        data: dataResponse.data || [],
        columns: columnsResponse.data || [],
        searchTerm: "",
        page: 0,
        rowsPerPage: 10,
      });
    } catch (error) {
      console.error("Error fetching table data:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Failed to fetch table data",
        severity: "error",
      });
    }
  };

  const handleSearchChange = (event) => {
    setViewDataDialog((prev) => ({
      ...prev,
      searchTerm: event.target.value,
      page: 0,
    }));
  };

  const handleChangePage = (event, newPage) => {
    setViewDataDialog((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleChangeRowsPerPage = (event) => {
    setViewDataDialog((prev) => ({
      ...prev,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0,
    }));
  };

  const handleCloseViewData = () => {
    setViewDataDialog({
      open: false,
      tableName: "",
      data: [],
      columns: [],
      searchTerm: "",
      page: 0,
      rowsPerPage: 10,
    });
  };

  const checkTableHasData = async (dbName, tableName) => {
    try {
      // You can implement an API call to check if the table has data
      // For now, defaulting to false for simplicity
      setTableHasData(false);

      // Example API call (uncomment and modify if you have such an endpoint):
      /*
      const response = await axiosInstance.get(
        `/table/${dbName}/tables/${tableName}/has-data`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setTableHasData(response.data.hasData);
      */
    } catch (error) {
      console.error("Error checking if table has data:", error);
      setTableHasData(false);
    }
  };

  const handleOpenEditDialog = async (dbName, tableName, columns) => {
    // First check if table has data
    await checkTableHasData(dbName, tableName);

    setEditDialog({
      open: true,
      dbName,
      tableName,
      columns,
    });
  };

  const handleDeleteTable = async () => {
    const tableName = deleteDialog.tableName;
    setDeleteLoading((prev) => ({ ...prev, [tableName]: true }));
    try {
      const response = await axiosInstance.delete(
        `/table/${dbId}/tables/${tableName}`,
        {
          params: {dbName: dbName},
          headers: {
            Authorization: `${localStorage.getItem("token")}`,
          },
        }
      );

      setSnackbar({
        open: true,
        message: response.data.message || `Table "${tableName}" deleted successfully!`,
        severity: "success",
      });
      setDeleteDialog({ open: false, tableName: "" });
      await fetchDatabaseDetails();
      await getAllTablesByDbId();
    } catch (error) {
      console.error("Error deleting table:", error);
      let errorMessage = "Failed to delete table";
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = `Table "${tableName}" not found`;
        } else if (error.response.status === 403) {
          errorMessage = "Unauthorized to delete table";
          setUpgradeDialogOpen(true);
        } else if (error.response.status === 500) {
          errorMessage = error.response.data?.details || "Server error while deleting table";
        } else {
          errorMessage = error.response.data?.details || error.response.data?.error || errorMessage;
        }
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
    } finally {
      setDeleteLoading((prev) => ({ ...prev, [tableName]: false }));
    }
  };

  const handleDeleteClick = (table) => {
    setDeleteDialog({
      open: true,
      tableName: table.tableName,
    });
  };

  const filteredData = viewDataDialog.data.filter((row) => {
    if (!viewDataDialog.searchTerm) return true;
    return Object.values(row).some((value) =>
      String(value)
        .toLowerCase()
        .includes(viewDataDialog.searchTerm.toLowerCase())
    );
  });

  const paginatedData = filteredData.slice(
    viewDataDialog.page * viewDataDialog.rowsPerPage,
    (viewDataDialog.page + 1) * viewDataDialog.rowsPerPage
  );

  const getAllTablesByDbId = async () => {
    const response = await axiosInstance.get(`/table/${dbId}/tables`);
    setTableData(response.data)
    console.log(response.data)
  }
  useEffect(() => {
    getAllTablesByDbId();
  }, [])

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
  //         onClick={() => navigate(`/database/${dbName}/${dbId}`)}
  //         selected={location.pathname === `/database/${dbName}/${dbId}`}
  //         style={{
  //           color:
  //             location.pathname === `/database/${dbName}/${dbId}`
  //               ? "var(--primary-color)"
  //               : "var(--text-primary)",
  //           backgroundColor:
  //             location.pathname === `/database/${dbName}/${dbId}`
  //               ? "var(--primary-light)"
  //               : "transparent",
  //           cursor: "pointer",
  //         }}
  //       >
  //         <ListItemIcon>
  //           <DashboardIcon
  //             style={{
  //               color:
  //                 location.pathname === `/database/${dbName}/${dbId}`
  //                   ? "var(--primary-color)"
  //                   : "var(--text-secondary)",
  //             }}
  //           />
  //         </ListItemIcon>
  //         <ListItemText primary="Database Details" />
  //       </ListItem>
  //       <ListItem
  //         button
  //         onClick={() => navigate("/databases")}
  //         selected={location.pathname === "/databases"}
  //         style={{
  //           color:
  //             location.pathname === "/databases"
  //               ? "var(--primary-color)"
  //               : "var(--text-primary)",
  //           backgroundColor:
  //             location.pathname === "/databases"
  //               ? "var(--primary-light)"
  //               : "transparent",
  //           cursor: "pointer",
  //         }}
  //       >
  //         <ListItemIcon>
  //           <StorageRoundedIcon
  //             style={{
  //               color:
  //                 location.pathname === "/databases"
  //                   ? "var(--primary-color)"
  //                   : "var(--text-secondary)",
  //             }}
  //           />
  //         </ListItemIcon>
  //         <ListItemText primary="Databases" />
  //       </ListItem>
  //       <ListItem
  //         button
  //         onClick={() => navigate("/pricing", { state: { dbName } })}
  //         selected={location.pathname === "/pricing"}
  //         style={{
  //           color:
  //             location.pathname === "/pricing"
  //               ? "var(--primary-color)"
  //               : "var(--text-primary)",
  //           backgroundColor:
  //             location.pathname === "/pricing"
  //               ? "var(--primary-light)"
  //               : "transparent",
  //           cursor: "pointer",
  //         }}
  //       >
  //         <ListItemIcon>
  //           <StoreIcon
  //             style={{
  //               color:
  //                 location.pathname === "/pricing"
  //                   ? "var(--primary-color)"
  //                   : "var(--text-secondary)",
  //             }}
  //           />
  //         </ListItemIcon>
  //         <ListItemText primary="Pricing Plans" />
  //       </ListItem>
  //     </List>
  //   </div>
  // );

  // if (loading) {
  //   return (
  //     <Box sx={{ display: "flex" }}>
  //       <AppBar
  //         position="fixed"
  //         sx={{
  //           zIndex: (theme) => theme.zIndex.drawer + 1,
  //           backgroundColor: "var(--primary-color)",
  //           width: { sm: `calc(100% - ${drawerWidth}px)` },
  //           ml: { sm: `${drawerWidth}px` },
  //         }}
  //       >
  //         <Toolbar>
  //           <IconButton
  //             color="inherit"
  //             edge="start"
  //             onClick={handleDrawerToggle}
  //             sx={{ mr: 2, display: { sm: "none" } }}
  //           >
  //             <MenuIcon />
  //           </IconButton>
  //           <Typography variant="h6" noWrap component="div">
  //             Database Details
  //           </Typography>
  //           <Box sx={{ flexGrow: 1 }} />
  //           <Typography
  //             variant="body1"
  //             sx={{ color: "var(--primary-text)", mr: 2 }}
  //           >
  //             {currentUser?.email || "Loading..."}
  //           </Typography>
  //           <Button
  //             variant="outlined"
  //             onClick={handleLogout}
  //             sx={{
  //               color: "var(--primary-text)",
  //               borderColor: "var(--primary-text)",
  //               borderRadius: "20%",
  //               minWidth: 40,
  //               width: 40,
  //               height: 40,
  //               p: 0,
  //               backgroundColor: "rgba(255, 255, 255, 0.1)",
  //               "&:hover": {
  //                 backgroundColor: "rgba(255, 255, 255, 0.2)",
  //                 borderColor: "var(--primary-text)",
  //                 boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  //                 transform: "scale(1.05)",
  //               },
  //               transition: "all 0.3s ease",
  //             }}
  //           >
  //             <LogoutIcon fontSize="small" />
  //           </Button>
  //         </Toolbar>
  //       </AppBar>
  //       <Box
  //         component="nav"
  //         sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
  //       >
  //         <Drawer
  //           variant="temporary"
  //           open={mobileOpen}
  //           onClose={handleDrawerToggle}
  //           ModalProps={{
  //             keepMounted: true,
  //           }}
  //           sx={{
  //             display: { xs: "block", sm: "none" },
  //             "& .MuiDrawer-paper": {
  //               boxSizing: "border-box",
  //               width: drawerWidth,
  //             },
  //           }}
  //         >
  //           {drawer}
  //         </Drawer>
  //         <Drawer
  //           variant="permanent"
  //           sx={{
  //             display: { xs: "none", sm: "block" },
  //             "& .MuiDrawer-paper": {
  //               boxSizing: "border-box",
  //               width: drawerWidth,
  //             },
  //           }}
  //           open
  //         >
  //           {drawer}
  //         </Drawer>
  //       </Box>
  //       <Box
  //         component="main"
  //         sx={{
  //           flexGrow: 1,
  //           p: 3,
  //           width: { sm: `calc(100% - ${drawerWidth}px)` },
  //         }}
  //       >
  //         <Toolbar />
  //         <Container maxWidth="lg">
  //           <Typography variant="h6">Loading database details...</Typography>
  //         </Container>
  //       </Box>
  //     </Box>
  //   );
  // }

  // if (!database) {
  //   return (
  //     <Box sx={{ display: "flex" }}>
  //       <AppBar
  //         position="fixed"
  //         sx={{
  //           zIndex: (theme) => theme.zIndex.drawer + 1,
  //           backgroundColor: "var(--primary-color)",
  //           width: { sm: `calc(100% - ${drawerWidth}px)` },
  //           ml: { sm: `${drawerWidth}px` },
  //         }}
  //       >
  //         <Toolbar>
  //           <IconButton
  //             color="inherit"
  //             edge="start"
  //             onClick={handleDrawerToggle}
  //             sx={{ mr: 2, display: { sm: "none" } }}
  //           >
  //             <MenuIcon />
  //           </IconButton>
  //           <Typography variant="h6" noWrap component="div">
  //             Database Details
  //           </Typography>
  //           <Box sx={{ flexGrow: 1 }} />
  //           <Typography
  //             variant="body1"
  //             sx={{ color: "var(--primary-text)", mr: 2 }}
  //           >
  //             {currentUser?.email || "Loading..."}
  //           </Typography>
  //           <Button
  //             variant="outlined"
  //             onClick={handleLogout}
  //             sx={{
  //               color: "var(--primary-text)",
  //               borderColor: "var(--primary-text)",
  //               borderRadius: "20%",
  //               minWidth: 40,
  //               width: 40,
  //               height: 40,
  //               p: 0,
  //               backgroundColor: "rgba(255, 255, 255, 0.1)",
  //               "&:hover": {
  //                 backgroundColor: "rgba(255, 255, 255, 0.2)",
  //                 borderColor: "var(--primary-text)",
  //                 boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
  //                 transform: "scale(1.05)",
  //               },
  //               transition: "all 0.3s ease",
  //             }}
  //           >
  //             <LogoutIcon fontSize="small" />
  //           </Button>
  //         </Toolbar>
  //       </AppBar>
  //       <Box
  //         component="nav"
  //         sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
  //       >
  //         <Drawer
  //           variant="temporary"
  //           open={mobileOpen}
  //           onClose={handleDrawerToggle}
  //           ModalProps={{
  //             keepMounted: true,
  //           }}
  //           sx={{
  //             display: { xs: "block", sm: "none" },
  //             "& .MuiDrawer-paper": {
  //               boxSizing: "border-box",
  //               width: drawerWidth,
  //             },
  //           }}
  //         >
  //           {drawer}
  //         </Drawer>
  //         <Drawer
  //           variant="permanent"
  //           sx={{
  //             display: { xs: "none", sm: "block" },
  //             "& .MuiDrawer-paper": {
  //               boxSizing: "border-box",
  //               width: drawerWidth,
  //             },
  //           }}
  //           open
  //         >
  //           {drawer}
  //         </Drawer>
  //       </Box>
  //       <Box
  //         component="main"
  //         sx={{
  //           flexGrow: 1,
  //           p: 3,
  //           width: { sm: `calc(100% - ${drawerWidth}px)` },
  //         }}
  //       >
  //         <Toolbar />
  //         <Container maxWidth="lg">
  //           <Typography variant="h6">Database not found</Typography>
  //         </Container>
  //       </Box>
  //     </Box>
  //   );
  // }

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
          <Box sx={{ display: "flex", alignItems: "center", mb: 1, ml: 2 }}>
            <FaDatabase size={24} />
            <Typography
              variant="h5"
              sx={{ ml: 2, color: "var(--primary-text)" }}
            >
              {/* Database: {database ? database.data.dbName : dbName || "Unnamed Database"} */}
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
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
        <Container maxWidth={false}>
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
                onClick={() => navigate("/databases")}
                sx={{
                  color: "var(--text-primary)",
                  "&:hover": {
                    backgroundColor: "var(--primary-light-hover)",
                  },
                }}
              >
                Back to Databases
              </Button>
              <Button
                variant="contained"
                startIcon={<CiViewTable />}
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

            <Paper
              elevation={3}
              sx={{
                p: 3,
                mb: 3,
                backgroundColor: "var(--bg-paper)",
                borderRadius: "var(--border-radius)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1, ml: 2 }}>
                <FaDatabase size={24} />
                <Typography variant="h4" sx={{ ml: 2 }}>
                  { dbName }
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <TableContainer
                sx={{
                  maxHeight: "calc(100vh - 300px)",
                  width: "100%",
                  overflow: "auto",
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="left"
                        sx={{
                          backgroundColor: "var(--primary-light)",
                          fontWeight: "bold",
                        }}
                      >
                        Table Name
                      </TableCell>
                      <TableCell
                        align="left"
                        sx={{
                          backgroundColor: "var(--primary-light)",
                          fontWeight: "bold",
                        }}
                      >
                        Columns
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: "var(--primary-light)",
                          fontWeight: "bold",
                        }}
                      >
                        URL
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: "var(--primary-light)",
                          fontWeight: "bold",
                        }}
                      >
                        Edit Table
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: "var(--primary-light)",
                          fontWeight: "bold",
                        }}
                      >
                        Delete Table
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          backgroundColor: "var(--primary-light)",
                          fontWeight: "bold",
                        }}
                      >
                        View Data
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tableData && tableData.length > 0 ? (
                      tableData.map((table) => (
                        <TableRow key={table.tableName}>
                          <TableCell align="left">{table.tableName}</TableCell>
                          <TableCell align="left">
                            {/* Show first 2 columns */}
                            {table.schema?.slice(0, 2).map((item) => (
                              <Chip
                                key={item.name}
                                label={`${item.name}: ${item.type}`}
                                sx={{
                                  mr: 1,
                                  mb: 1,
                                  backgroundColor: "var(--primary-light)",
                                }}
                                variant="outlined"
                              />
                            ))}

                            {/* Show "+N more" button if more than 2 */}
                            {table.schema?.length > 2 && (
                              <>
                                <Chip
                                  label={`+${table.schema.length - 2} more`}
                                  onClick={(e) =>
                                    handleShowMoreColumns(e, table)
                                  }
                                  sx={{
                                    mr: 1,
                                    mb: 1,
                                    backgroundColor: "var(--primary-light)",
                                    cursor: "pointer",
                                    "&:hover": {
                                      backgroundColor: "var(--primary-hover)",
                                    },
                                  }}
                                  variant="outlined"
                                />
                                <Popover
                                  open={Boolean(columnsAnchorEl) && expandedTable?.tableName === table.tableName}
                                  anchorEl={columnsAnchorEl}
                                  onClose={handleCloseColumnsPopup}
                                  anchorOrigin={{
                                    vertical: "bottom",
                                    horizontal: "center",
                                  }}
                                  transformOrigin={{
                                    vertical: "top",
                                    horizontal: "center",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      p: 2,
                                      maxWidth: 400,
                                      backgroundColor: "var(--bg-paper)",
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle2"
                                      sx={{ mb: 1, fontWeight: "bold" }}
                                    >
                                      All columns in {expandedTable?.tableName}
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 1,
                                      }}
                                    >
                                      {expandedTable?.schema?.map((item) => (
                                        <Chip
                                          key={item.name}
                                          label={`${item.name}: ${item.type}`}
                                          sx={{
                                            backgroundColor:
                                              "var(--primary-light)",
                                            "&:hover": {
                                              backgroundColor:
                                                "var(--primary-hover)",
                                            },
                                          }}
                                          variant="outlined"
                                        />
                                      ))}
                                    </Box>
                                  </Box>
                                </Popover>
                              </>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {table.tableName && (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <Button
                                  variant="outlined"
                                  aria-controls={`table-menu-${table.tableName}`}
                                  aria-haspopup="true"
                                  onClick={(e) => handleMenuOpen(e, table)}
                                  sx={{
                                    textTransform: "none",
                                    borderColor: "var(--primary-color)",
                                    color: "var(--primary-color)",
                                    borderRadius: "8px",
                                    padding: "8px 16px",
                                    transition: "all 0.3s ease",
                                    gap: 1,
                                    "&:hover": {
                                      borderColor: "var(--primary-hover)",
                                      backgroundColor: "rgba(var(--primary-rgb), 0.08)",
                                      transform: "translateY(-1px)",
                                    },
                                    "&:active": {
                                      transform: "translateY(0)",
                                      backgroundColor: "rgba(var(--primary-rgb), 0.12)",
                                    },
                                    "& .MuiSvgIcon-root": {
                                      fontSize: "1.2rem",
                                      marginLeft: "4px",
                                    },
                                  }}
                                >
                                  <LinkIcon sx={{ fontSize: "1.1rem", opacity: 0.9 }} />
                                  URLs
                                  <KeyboardArrowDownIcon sx={{ fontSize: "1.2rem" }} />
                                </Button>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {table.tableName && (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <IconButton
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTable(dbName, table.tableName);
                                  }}
                                  sx={{
                                    color: "var(--primary-color)",
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {table.tableName && (
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  gap: 1,
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(table);
                                  }}
                                  sx={{
                                    color: "var(--error-color)",
                                  }}
                                  disabled={deleteLoading[table.tableName]}
                                >
                                  {deleteLoading[table.tableName] ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <DeleteIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {table.tableName && (
                              <Button
                                variant="outlined"
                                startIcon={<VisibilityIcon />}
                                onClick={() => handleViewData(table)}
                                disabled={deleteLoading[table.tableName]}
                              >
                                View Data
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body1" color="textSecondary">
                            No tables present in the database
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>

          <EditTableDialog
            open={editDialog.open}
            onClose={() =>
              setEditDialog({
                open: false,
                dbName: "",
                tableName: "",
                columns: [],
              })
            }
            dbName={editDialog.dbName}
            tableName={editDialog.tableName}
            columns={editDialog.columns}
            hasData={tableHasData}
            onSave={handleSaveTableChanges}
          />

          <Menu
            id="table-actions-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                minWidth: "220px",
                marginTop: "8px",
              },
            }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                }}
              >
                API Endpoints
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "var(--text-secondary)",
                  lineHeight: 1.2,
                }}
              >
                Click to copy URLs
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            {["read", "insert", "update", "delete"].map((action) => (
              <MenuItem
                key={action}
                onClick={() => handleMenuAction(action)}
                sx={{
                  py: 1.5,
                  px: 2,
                  "&:hover": {
                    backgroundColor: "var(--primary-light-hover)",
                  },
                  transition: "background-color 0.2s ease",
                }}
              >
                <ContentCopyIcon
                  fontSize="small"
                  sx={{
                    color: "var(--primary-color)",
                    mr: 1.5,
                    fontSize: "18px",
                  }}
                />
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      textTransform: "capitalize",
                    }}
                  >
                    {action} Data Url
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "var(--text-secondary)",
                      display: "block",
                      fontSize: "0.75rem",
                    }}
                  >
                    {action === "read" && "GET query"}
                    {action === "insert" && "POST query"}
                    {action === "update" && "PATCH query"}
                    {action === "delete" && "DELETE query"}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>

          <CreateTableDialog
            open={openTableDialog}
            onClose={() => setOpenTableDialog(false)}
            dbName={dbName}
            onSubmit={handleCreateTable}
          />

          <Dialog
            open={deleteDialog.open}
            onClose={() => setDeleteDialog({ open: false, tableName: "" })}
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
            <DialogTitle sx={{ color: "var(--text-primary)", fontWeight: "bold" }}>
              Delete Table
            </DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ color: "var(--text-secondary)", mb: 2 }}>
                Are you sure you want to delete table "{deleteDialog.tableName}
                "? This action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ padding: 2, gap: 2 }}>
              <Button
                onClick={() =>
                  setDeleteDialog({ ...deleteDialog, open: false })
                }
                sx={{
                  color: "var(--text-primary)",
                  "&:hover": {
                    backgroundColor: "var(--primary-light-hover)",
                  },
                }}
                disabled={deleteLoading[deleteDialog.tableName]}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTable}
                sx={{
                  backgroundColor: "var(--error-color)",
                  "&:hover": {
                    backgroundColor: "#d32f2f",
                  },
                }}
                variant="contained"
                startIcon={
                  deleteLoading[deleteDialog.tableName] ? (
                    <CircularProgress size={20} />
                  ) : (
                    <DeleteIcon />
                  )
                }
                disabled={deleteLoading[deleteDialog.tableName]}
              >
                {deleteLoading[deleteDialog.tableName] ? "Deleting..." : "Delete"}
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={viewDataDialog.open}
            onClose={handleCloseViewData}
            maxWidth="lg"
            fullWidth
            scroll="paper"
            PaperProps={{
              sx: {
                backgroundColor: "var(--bg-paper)",
                borderRadius: "var(--border-radius)",
                maxHeight: "80vh",
                display: "flex",
                flexDirection: "column",
              },
            }}
          >
            <DialogTitle
              sx={{
                backgroundColor: "var(--primary-light)",
                color: "var(--text-primary)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px",
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Data from {viewDataDialog.tableName}
              </Typography>
              <IconButton
                onClick={handleCloseViewData}
                sx={{ color: "var(--text-primary)" }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ flex: 1, padding: 0 }}>
              <Box sx={{ padding: "16px 24px" }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search data..."
                  value={viewDataDialog.searchTerm}
                  onChange={handleSearchChange}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <TableContainer sx={{ flex: 1, maxHeight: "100%" }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {viewDataDialog.columns.map((column) => (
                        <TableCell
                          key={column.column_name}
                          sx={{
                            backgroundColor: "var(--primary-light)",
                            fontWeight: "bold",
                            padding: "8px 16px",
                          }}
                        >
                          {column.column_name}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {viewDataDialog.columns.map((column) => (
                            <TableCell
                              key={`${rowIndex}-${column.column_name}`}
                              sx={{ padding: "8px 16px" }}
                            >
                              {String(row[column.column_name] ?? '')}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={viewDataDialog.columns.length}
                          align="center"
                          sx={{ padding: "16px" }}
                        >
                          <Typography variant="body1">
                            {viewDataDialog.searchTerm
                              ? "No matching data found"
                              : "No data available"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </DialogContent>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredData.length}
              rowsPerPage={viewDataDialog.rowsPerPage}
              page={viewDataDialog.page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                backgroundColor: "var(--primary-light)",
                borderTop: "1px solid var(--divider-color)",
              }}
            />
          </Dialog>

          <UpgradeDialog
            open={upgradeDialogOpen}
            onClose={() => setUpgradeDialogOpen(false)}
          />

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
