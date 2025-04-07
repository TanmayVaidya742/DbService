import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Add as AddIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AddUserDialog from './AddUserDialog';

const drawerWidth = 240;

const Dashboard = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    visits: 0,
    members: 0,
    domains: 3,
    domainStats: {
      Manhattan: 0,
      Queens: 0,
      Brooklyn: 0
    }
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    organization: '',
    password: '',
    domain: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    fetchUsers();
    // In a real app, you would fetch actual stats here
    setStats({
      visits: 98,
      members: 166,
      domains: 3,
      domainStats: {
        Manhattan: 63,
        Queens: 53,
        Brooklyn: 50
      }
    });
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      organization: '',
      password: '',
      domain: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users', formData);
      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    (user?.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user?.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user?.username?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );
-
  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Superadmin Panel
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button onClick={() => navigate('/dashboard')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <IconButton color="inherit">
            <AddIcon />
          </IconButton>
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
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
          {/* Header Stats */}
          <Paper sx={{ p: 3, mb: 4, marginLeft: -25 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6">Members per domain</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body2">Manhattan {stats.domainStats.Manhattan}</Typography>
                  <Typography variant="body2">Queens {stats.domainStats.Queens}</Typography>
                  <Typography variant="body2">Brooklyn {stats.domainStats.Brooklyn}</Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={{
                  bgcolor: '#7C3AED',
                  borderRadius: '8px',
                  '&:hover': {
                    bgcolor: '#6D28D9',
                  },
                }}
              >
                Add User
              </Button>
            </Box>

            {/* Search Bar */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search users..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                  sx: { borderRadius: '8px' }
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button
                variant="outlined"
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
                Filters
              </Button>
            </Box>

            {/* Users Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Domain</TableCell>
                    <TableCell>Time checked in</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: '#7C3AED',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                            }}
                          >
                            {user.first_name?.[0] || ''}
                          </Box>
                          {`${user.first_name || ''} ${user.last_name || ''}`}
                        </Box>
                      </TableCell>
                      <TableCell>{user.username || ''}</TableCell>
                      <TableCell>{user.domain || ''}</TableCell>
                      <TableCell>{user.created_at ? new Date(user.created_at).toLocaleTimeString() : ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Add User Dialog */}
          <AddUserDialog
            open={openDialog}
            onClose={handleCloseDialog}
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </Container>
      </Box>
    </Box>
  );
};

export default Dashboard; 