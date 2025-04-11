import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Divider, Container,
  Button, Paper, Snackbar, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import {
  Menu as MenuIcon, Settings as SettingsIcon,
  Groups as GroupsIcon, Storage as StorageIcon,
  Visibility as VisibilityIcon, ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AddDatabaseDialog from './AddDatabaseDialog';
import { styled } from '@mui/material/styles';

const drawerWidth = 240;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
  backgroundColor: '#ffffff',
  marginTop: theme.spacing(3),
}));

const UserDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [databaseFormData, setDatabaseFormData] = useState({
    databaseName: '',
    tableName: '',
    csvFile: null
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [databases, setDatabases] = useState([]);
  const [openApiKeyDialog, setOpenApiKeyDialog] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState('');

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/databases');
      setDatabases(response.data);
    } catch (error) {
      console.error('Error fetching databases:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch databases',
        severity: 'error'
      });
    }
  };

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setDatabaseFormData({
      databaseName: '',
      tableName: '',
      csvFile: null
    });
  };

  const handleDatabaseChange = (e) => {
    setDatabaseFormData({ ...databaseFormData, [e.target.name]: e.target.value });
  };

  const handleDatabaseFileChange = (e) => {
    setDatabaseFormData({ ...databaseFormData, csvFile: e.target.files[0] });
  };

  const handleDatabaseSubmit = async () => {
    if (!databaseFormData.databaseName || !databaseFormData.tableName || !databaseFormData.csvFile) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields and upload a CSV file',
        severity: 'error'
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('databaseName', databaseFormData.databaseName);
      formData.append('tableName', databaseFormData.tableName);
      formData.append('csvFile', databaseFormData.csvFile);

      const response = await axios.post('http://localhost:5000/api/databases', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: 'success'
      });
      
      fetchDatabases();
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating database:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error creating database',
        severity: 'error'
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
      message: 'API key copied to clipboard!',
      severity: 'success'
    });
    setOpenApiKeyDialog(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6">1SPOC</Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button onClick={() => navigate('/organizations')}>
          <ListItemIcon><GroupsIcon /></ListItemIcon>
          <ListItemText primary="Organizations" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: '#7C3AED',
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          boxShadow: 'none'
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>User Dashboard</Typography>
          <IconButton color="inherit"><SettingsIcon /></IconButton>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
       