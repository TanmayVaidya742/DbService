import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Divider, Container,
  Button, Paper, Snackbar, Alert, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
  Menu as MenuIcon, Settings as SettingsIcon,
  Dashboard as DashboardIcon, Groups as GroupsIcon,
  Person as PersonIcon, Storage as StorageIcon, Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AddDatabaseDialog from './AddDatabaseDialog';
import AddOrganizationDialog from './AddOrganizationDialog';
import { styled } from '@mui/material/styles';

const drawerWidth = 240;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
  backgroundColor: '#ffffff',
}));

const UserDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState(false);
  const [openOrgDialog, setOpenOrgDialog] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    databaseName: '',
    tableName: '',
    csvFile: null,
    organization: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/organizations');
      setOrganizations(response.data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching organizations',
        severity: 'error'
      });
    }
  };

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      databaseName: '',
      tableName: '',
      csvFile: null,
      organization: '',
    });
  };

  const handleOpenOrgDialog = () => setOpenOrgDialog(true);
  const handleCloseOrgDialog = () => setOpenOrgDialog(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, csvFile: e.target.files[0] });
    }
  };

  const handleSubmit = async () => {
    if (!formData.databaseName || !formData.tableName || !formData.csvFile || !formData.organization) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields and upload a CSV file',
        severity: 'error'
      });
      return;
    }

    // Validate database and table names
    const nameRegex = /^[a-zA-Z0-9_]+$/;
    if (!nameRegex.test(formData.databaseName) || !nameRegex.test(formData.tableName)) {
      setSnackbar({
        open: true,
        message: 'Database and table names can only contain letters, numbers, and underscores',
        severity: 'error'
      });
      return;
    }

    const data = new FormData();
    data.append('databaseName', formData.databaseName);
    data.append('tableName', formData.tableName);
    data.append('csvFile', formData.csvFile);
    data.append('organization', formData.organization);

    try {
      const response = await axios.post('http://localhost:5000/api/databases', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setSnackbar({
        open: true,
        message: response.data.message,
        severity: response.status === 201 ? 'success' : 'info'
      });
      
      if (response.status === 201) {
        handleCloseDialog();
      }
    } catch (err) {
      console.error('Error creating database:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Error creating database';
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    }
  };

  const handleAddOrganization = async (orgData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/organizations', orgData);
      setSnackbar({
        open: true,
        message: 'Organization added successfully',
        severity: 'success'
      });
      fetchOrganizations();
    } catch (error) {
      console.error('Error adding organization:', error);
      setSnackbar({
        open: true,
        message: 'Error adding organization',
        severity: 'error'
      });
    }
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
        <ListItem button onClick={() => navigate('/dashboard')}>
          <ListItemIcon><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => navigate('/organizations')}>
          <ListItemIcon><GroupsIcon /></ListItemIcon>
          <ListItemText primary="Organizations" />
        </ListItem>
        <ListItem button onClick={() => navigate('/users')}>
          <ListItemIcon><PersonIcon /></ListItemIcon>
          <ListItemText primary="Users" />
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
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenOrgDialog}
              sx={{
                backgroundColor: '#7C3AED',
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                '&:hover': {
                  backgroundColor: '#6D28D9',
                },
              }}
            >
              Add Organization
            </Button>
            <Button
              variant="contained"
              startIcon={<StorageIcon />}
              onClick={handleOpenDialog}
              sx={{
                backgroundColor: '#7C3AED',
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                '&:hover': {
                  backgroundColor: '#6D28D9',
                },
              }}
            >
              Create Database
            </Button>
          </Box>
          <StyledPaper>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Organization</InputLabel>
              <Select
                value={formData.organization}
                name="organization"
                onChange={handleChange}
                label="Select Organization"
              >
                {organizations.map((org) => (
                  <MenuItem key={org.id} value={org.organization_name}>
                    {org.organization_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </StyledPaper>
        </Container>
        <AddDatabaseDialog
          open={openDialog}
          onClose={handleCloseDialog}
          formData={formData}
          onChange={handleChange}
          onFileChange={handleFileChange}
          onSubmit={handleSubmit}
        />
        <AddOrganizationDialog
          open={openOrgDialog}
          onClose={handleCloseOrgDialog}
          onSubmit={handleAddOrganization}
        />
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default UserDashboard;
