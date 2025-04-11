import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Divider, Container,
  Button, Paper, Snackbar, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, Chip
} from '@mui/material';
import {
  Menu as MenuIcon, Settings as SettingsIcon,
  Groups as GroupsIcon, Storage as StorageIcon,
  Close as CloseIcon, CloudUpload as CloudUploadIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  const [apiKeys, setApiKeys] = useState([]);
  const [showApiKey, setShowApiKey] = useState(null);

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
      
      setApiKeys(prev => [...prev, { 
        database: response.data.database, 
        key: response.data.apiKey 
      }]);
      
      setSnackbar({
        open: true,
        message: `${response.data.message}. API Key: ${response.data.apiKey}`,
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

  const handleCopyApiKey = (key) => {
    navigator.clipboard.writeText(key);
    setSnackbar({
      open: true,
      message: 'API key copied to clipboard!',
      severity: 'success'
    });
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

          {apiKeys.length > 0 && (
            <StyledPaper sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Your API Keys
              </Typography>
              <List>
                {apiKeys.map((item, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={item.database}
                        secondary={showApiKey === index ? item.key : '••••••••••••••••••••••••••••••••'}
                        secondaryTypographyProps={{
                          style: {
                            wordBreak: 'break-all',
                            fontFamily: 'monospace',
                            cursor: 'pointer'
                          },
                          onClick: () => setShowApiKey(showApiKey === index ? null : index)
                        }}
                      />
                      <IconButton onClick={() => handleCopyApiKey(item.key)}>
                        <ContentCopyIcon />
                      </IconButton>
                    </ListItem>
                    {index < apiKeys.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </StyledPaper>
          )}
        </Container>

        {/* Add Database Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          sx={{
            '& .MuiDialogContent-root': { padding: 3 },
            '& .MuiDialogActions-root': { padding: 2 },
          }}
        >
          <DialogTitle sx={{
            backgroundColor: '#7C3AED',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 2,
          }}>
            <Typography variant="h6">Create New Database</Typography>
            <IconButton onClick={handleCloseDialog} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <Box component="form" noValidate>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Database Name"
                    name="databaseName"
                    value={databaseFormData.databaseName}
                    onChange={handleDatabaseChange}
                    required
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Table Name"
                    name="tableName"
                    value={databaseFormData.tableName}
                    onChange={handleDatabaseChange}
                    required
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <input
                    type="file"
                    accept=".csv"
                    id="csv-upload"
                    hidden
                    onChange={handleDatabaseFileChange}
                  />
                  <label htmlFor="csv-upload">
                    <Button
                      component="span"
                      fullWidth
                      variant="outlined"
                      startIcon={<CloudUploadIcon />}
                      sx={{
                        border: '2px dashed #7C3AED',
                        backgroundColor: 'rgba(124, 58, 237, 0.04)',
                        borderRadius: '8px',
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: 'rgba(124, 58, 237, 0.08)',
                          border: '2px dashed #6D28D9',
                        },
                      }}
                    >
                      Upload CSV File
                    </Button>
                  </label>
                  {databaseFormData.csvFile && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <Chip
                        label={databaseFormData.csvFile.name}
                        onDelete={() => setDatabaseFormData({ ...databaseFormData, csvFile: null })}
                        sx={{ backgroundColor: '#7C3AED', color: 'white' }}
                      />
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseDialog} 
              color="inherit" 
              sx={{ 
                borderRadius: '8px',
                borderColor: '#7C3AED',
                color: '#7C3AED',
                '&:hover': {
                  borderColor: '#6D28D9',
                  backgroundColor: 'rgba(124, 58, 237, 0.04)',
                },
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDatabaseSubmit} 
              variant="contained" 
              sx={{ 
                backgroundColor: '#7C3AED', 
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#6D28D9',
                },
              }}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

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