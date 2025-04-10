import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Divider, Container,
  Button, TextField, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Snackbar, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon, Add as AddIcon, Settings as SettingsIcon,
  Dashboard as DashboardIcon, Search as SearchIcon, Person as PersonIcon,
  Groups as GroupsIcon
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

const Dashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    organizationName: '',
    ownerName: '',
    domain: '',
    adminEmail: '',
    adminName: '',
    adminUsername: '',
    adminPassword: '',
    adminType: 'admin'
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  useEffect(() => {
    fetchOrganizations();
    fetchUsers();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/organizations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
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

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setSnackbar({
        open: true,
        message: 'Error fetching users',
        severity: 'error'
      });
    }
  };

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      organizationName: '',
      ownerName: '',
      domain: '',
      adminEmail: '',
      adminName: '',
      adminUsername: '',
      adminPassword: '',
      adminType: 'admin'
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // Check all required fields
    if (!formData.organizationName || !formData.ownerName || !formData.domain || 
        !formData.adminEmail || !formData.adminName || !formData.adminUsername || !formData.adminPassword) {
      setSnackbar({
        open: true,
        message: 'Please fill in all fields',
        severity: 'error'
      });
      return;
    }

    try {
      // First create the organization
      const orgResponse = await axios.post('http://localhost:5000/api/organizations', {
        organizationName: formData.organizationName,
        ownerName: formData.ownerName,
        domain: formData.domain
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      // Then create the admin user
      const userResponse = await axios.post('http://localhost:5000/api/users', {
        name: formData.adminName,
        email: formData.adminEmail,
        organization: formData.organizationName,
        user_type: formData.adminType,
        username: formData.adminUsername,
        password: formData.adminPassword
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setSnackbar({
        open: true,
        message: 'Organization and admin user created successfully',
        severity: 'success'
      });

      await fetchOrganizations();
      await fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error adding organization:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error adding organization',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const filteredUsers = users.filter(user =>
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.organization?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

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
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Dashboard</Typography>
          <IconButton color="inherit"><AddIcon /></IconButton>
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
          <StyledPaper>
            {/* Action Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
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
                Add Organization
              </Button>
            </Box>

            {/* Search */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search users or organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  sx: { borderRadius: '10px' },
                }}
              />
              <Button variant="outlined" sx={{
                borderColor: '#7C3AED',
                color: '#7C3AED',
                borderRadius: '10px',
                '&:hover': {
                  backgroundColor: 'rgba(124, 58, 237, 0.05)',
                  borderColor: '#6D28D9'
                }
              }}>Filters</Button>
            </Box>

            {/* User Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Organization</TableCell>
                    <TableCell>User Type</TableCell>
                    <TableCell>Time Created</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{
                            width: 32, height: 32, borderRadius: '50%',
                            backgroundColor: '#7C3AED', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {user.name?.[0] || 'U'}
                          </Box>
                          {user.name || 'N/A'}
                        </Box>
                      </TableCell>
                      <TableCell>{user.username || 'N/A'}</TableCell>
                      <TableCell>{user.organization || 'N/A'}</TableCell>
                      <TableCell>{user.user_type || 'N/A'}</TableCell>
                      <TableCell>{user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </StyledPaper>

          {/* Add Organization Dialog */}
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Organization</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
               <FormControl fullWidth>
                  <InputLabel>Select Organization</InputLabel>
                  <Select
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    label="Select Organization"
                  >
                    {organizations.length > 0 ? (
                      organizations.map((org) => (
                        <MenuItem key={org.organization_name} value={org.organization_name}>
                          {org.organization_name}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No organizations available</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <TextField
                  label="Owner Name"
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Domain"
                  name="domain"
                  value={formData.domain}
                  onChange={handleChange}
                  fullWidth
                  required
                  placeholder="e.g., @example.com"
                />
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1">Admin User Details</Typography>
                <TextField
                  label="Admin Email"
                  name="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Admin Full Name"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Admin Username"
                  name="adminUsername"
                  value={formData.adminUsername}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <TextField
                  label="Admin Password"
                  name="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={handleChange}
                  fullWidth
                  required
                />
                <FormControl fullWidth>
                  <InputLabel>Admin Type</InputLabel>
                  <Select
                    name="adminType"
                    value={formData.adminType}
                    onChange={handleChange}
                    label="Admin Type"
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="superadmin">Super Admin</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button onClick={handleSubmit} variant="contained" color="primary">
                Add Organization
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
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard;