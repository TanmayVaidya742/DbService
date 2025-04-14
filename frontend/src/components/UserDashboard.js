import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Divider, Container,
  Button, Paper, Snackbar, Alert, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Menu, MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon, Settings as SettingsIcon,
  Groups as GroupsIcon, Storage as StorageIcon,
  Visibility as VisibilityIcon, ContentCopy as ContentCopyIcon,
  MoreVert as MoreVertIcon
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
    csvFile: null,
    columns: []
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [databases, setDatabases] = useState([]);
  const [openApiKeyDialog, setOpenApiKeyDialog] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDb, setSelectedDb] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuClick = (event, db) => {
    setAnchorEl(event.currentTarget);
    setSelectedDb(db);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDb(null);
  };

  useEffect(() => {
    fetchDatabases();
  }, []);

  const fetchDatabases = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/databases', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDatabases(response.data);
    } catch (error) {
      console.error('Error fetching databases:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to fetch databases',
        severity: 'error'
      });
      setDatabases([]);
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

  const handleDatabaseSubmit = async (formDataWithColumns) => {
    if (!formDataWithColumns.databaseName || !formDataWithColumns.tableName) {
      setSnackbar({
        open: true,
        message: 'Database name and table name are required',
        severity: 'error'
      });
      return;
    }
  
    const hasColumns = formDataWithColumns.columns && formDataWithColumns.columns.some(col => col.name.trim());
    if (!hasColumns && !formDataWithColumns.csvFile) {
      setSnackbar({
        open: true,
        message: 'Either define columns or upload a CSV file',
        severity: 'error'
      });
      return;
    }
  
    if (hasColumns) {
      for (const column of formDataWithColumns.columns) {
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column.name)) {
          setSnackbar({
            open: true,
            message: 'Column names must start with a letter or underscore and contain only letters, numbers, and underscores',
            severity: 'error'
          });
          return;
        }
      }
    }
  
    try {
      const formData = new FormData();
      formData.append('databaseName', formDataWithColumns.databaseName);
      formData.append('tableName', formDataWithColumns.tableName);
      
      if (formDataWithColumns.csvFile) {
        formData.append('csvFile', formDataWithColumns.csvFile);
      }
      
      if (formDataWithColumns.columns && formDataWithColumns.columns.length > 0) {
        formData.append('columns', JSON.stringify(formDataWithColumns.columns));
      }
  
      setSnackbar({
        open: true,
        message: 'Creating database...',
        severity: 'info',
        autoHideDuration: null
      });
  
      const response = await axios.post('http://localhost:5000/api/databases', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        timeout: 30000
      });
  
      setSnackbar({
        open: true,
        message: 'Database created successfully!',
        severity: 'success'
      });
  
      await fetchDatabases();
      handleCloseDialog();
  
      if (response.data.apiKey) {
        setCurrentApiKey(response.data.apiKey);
        setOpenApiKeyDialog(true);
      }
  
    } catch (error) {
      console.error('Error creating database:', error);
      
      let errorMessage = 'Error creating database';
      if (error.response) {
        errorMessage = error.response.data.error || error.response.data.message || errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
  
      setSnackbar({
        open: true,
        message: errorMessage,
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

  const handleInsert = (db) => {
    handleMenuClose();
    console.log('Insert action for', db.name);
    setSnackbar({
      open: true,
      message: `Insert action initiated for ${db.name}`,
      severity: 'info'
    });
    // Implement your insert logic here
  };

  const handleDelete = (db) => {
    handleMenuClose();
    console.log('Delete action for', db.name);
    setSnackbar({
      open: true,
      message: `Delete action initiated for ${db.name}`,
      severity: 'warning'
    });
    // Implement your delete logic here
  };

  const handleUpdate = (db) => {
    handleMenuClose();
    console.log('Update action for', db.name);
    setSnackbar({
      open: true,
      message: `Update action initiated for ${db.name}`,
      severity: 'info'
    });
    // Implement your update logic here
  };

  const handleRead = (db) => {
    handleMenuClose();
    console.log('Read action for', db.name);
    setSnackbar({
      open: true,
      message: `Read action initiated for ${db.name}`,
      severity: 'info'
    });
    // Implement your read logic here
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6">1SPOC</Typography>
      </Toolbar>
      <Divider />
      <List>
        {/* Navigation items would go here */}
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

          <StyledPaper>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
              Your Databases
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Database Name</TableCell>
                    <TableCell>Tables</TableCell>
                    <TableCell>API Key</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {databases.map((db) => (
                    <TableRow key={db.name}>
                      <TableCell>{db.name}</TableCell>
                      <TableCell>
                        {db.tables.map((table) => (
                          <Chip
                            key={table}
                            label={table}
                            sx={{ mr: 1, mb: 1 }}
                            color="primary"
                          />
                        ))}
                      </TableCell>
                      <TableCell>
                        {db.apiKey && (
                          <Button
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleShowApiKey(db.apiKey)}
                            sx={{
                              textTransform: 'none',
                              borderColor: '#7C3AED',
                              color: '#7C3AED',
                              '&:hover': {
                                borderColor: '#6D28D9',
                              },
                            }}
                          >
                            Show API Key
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          aria-label="more"
                          aria-controls="long-menu"
                          aria-haspopup="true"
                          onClick={(e) => handleMenuClick(e, db)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </StyledPaper>
        </Container>

        <Menu
          anchorEl={anchorEl}
          open={openMenu}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleInsert(selectedDb)}>Insert</MenuItem>
          <MenuItem onClick={() => handleDelete(selectedDb)}>Delete</MenuItem>
          <MenuItem onClick={() => handleUpdate(selectedDb)}>Update</MenuItem>
          <MenuItem onClick={() => handleRead(selectedDb)}>Read</MenuItem>
        </Menu>

        <AddDatabaseDialog
          open={openDialog}
          onClose={handleCloseDialog}
          formData={databaseFormData}
          onChange={handleDatabaseChange}
          onFileChange={handleDatabaseFileChange}
          onSubmit={handleDatabaseSubmit}
        />

        <Dialog open={openApiKeyDialog} onClose={() => setOpenApiKeyDialog(false)}>
          <DialogTitle>API Key</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Here is your API key for this database. Keep it secure and don't share it with others.
            </DialogContentText>
            <Box sx={{
              mt: 2,
              p: 2,
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              wordBreak: 'break-all',
              fontFamily: 'monospace'
            }}>
              {currentApiKey}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenApiKeyDialog(false)}>Close</Button>
            <Button
              onClick={handleCopyApiKey}
              startIcon={<ContentCopyIcon />}
              variant="contained"
              sx={{
                backgroundColor: '#7C3AED',
                '&:hover': {
                  backgroundColor: '#6D28D9',
                },
              }}
            >
              Copy
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