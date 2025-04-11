import React, { useState } from 'react';
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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
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
        </Container>
        
        <AddDatabaseDialog
          open={openDialog}
          onClose={handleCloseDialog}
          formData={databaseFormData}
          onChange={handleDatabaseChange}
          onFileChange={handleDatabaseFileChange}
          onSubmit={handleDatabaseSubmit}
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