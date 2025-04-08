import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Divider, Container,
  Button, Paper, Snackbar, Alert
} from '@mui/material';
import {
  Menu as MenuIcon, Settings as SettingsIcon,
  Dashboard as DashboardIcon, Groups as GroupsIcon,
  Person as PersonIcon, Storage as StorageIcon
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
}));

const UserDashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    databaseName: '',
    tableName: '',
    csvFile: null,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      databaseName: '',
      tableName: '',
      csvFile: null,
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, csvFile: e.target.files[0] });
    }
  };

  const handleSubmit = async () => {
    if (!formData.databaseName || !formData.tableName || !formData.csvFile) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields and upload a CSV file',
        severity: 'error'
      });
      return;
    }

    const data = new FormData();
    data.append('databaseName', formData.databaseName);
    data.append('tableName', formData.tableName);
    data.append('csvFile', formData.csvFile);

    try {
      const response = await axios.post('http://localhost:5000/api/databases', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setSnackbar({
        open: true,
        message: response.data.message || 'Database created successfully!',
        severity: 'success'
      });
      handleCloseDialog();
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
          <StyledPaper sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10 }}>
            <Box sx={{ mb: 3 }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="#7C3AED" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 3.79 2 6v12c0 2.21 4.48 4 10 4s10-1.79 10-4V6c0-2.21-4.48-4-10-4zm0 2c4.97 0 8 .98 8 2s-3.03 2-8 2-8-.98-8-2 3.03-2 8-2zm0 16c-4.97 0-8-.98-8-2v-2c1.74 1.06 5.02 1.5 8 1.5s6.26-.44 8-1.5v2c0 1.02-3.03 2-8 2zm0-4c-4.97 0-8-.98-8-2v-2c1.74 1.06 5.02 1.5 8 1.5s6.26-.44 8-1.5v2c0 1.02-3.03 2-8 2zm0-4c-4.97 0-8-.98-8-2V8c1.74 1.06 5.02 1.5 8 1.5s6.26-.44 8-1.5v2c0 1.02-3.03 2-8 2z" />
              </svg>
            </Box>
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
