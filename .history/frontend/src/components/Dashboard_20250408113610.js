// Dashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, IconButton,
  List, ListItem, ListItemIcon, ListItemText, Divider, Container,
  Button, TextField, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Menu as MenuIcon, Add as AddIcon, Settings as SettingsIcon,
  Dashboard as DashboardIcon, Search as SearchIcon, Person as PersonIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AddUserDialog from './AddUserDialog';
import { styled } from '@mui/material/styles';
import OrganizationModal from './OrganizationModal';

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

  const [open, setOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', username: '', organization: '', password: '', domain: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleOpenDialog = () => setOpenDialog(true);
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      firstName: '', lastName: '', username: '', organization: '', password: '', domain: ''
    });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users', formData);
      handleCloseDialog();
      fetchUsers();
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.username?.toLowerCase() || '').includes(searchTerm.toLowerCase())
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
        <ListItem button onClick={() => navigate('/userdashboard')}>
          <ListItemIcon><PersonIcon /></ListItemIcon>
          <ListItemText primary="User Dashboard" />
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
                // onClick={handleOpenDialog}
                onClick={() => setOpen(true)}
                sx={{
                  backgroundColor: '#7C3AED',
                  borderRadius: '10px',
                  '&:hover': { backgroundColor: '#6D28D9' },
                }}
              >
                Add Or
              </Button>
            </Box>

            {/* Search */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search users..."
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
                    <TableCell>Domain</TableCell>
                    <TableCell>Time checked in</TableCell>
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
                            {user.first_name?.[0]}
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
          </StyledPaper>

          <AddUserDialog
            open={openDialog}
            onClose={handleCloseDialog}
            formData={formData}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </Container>
      </Box>
      <OrganizationModal open={open} onClose={() => setOpen(false)} />
    </Box>

  );
};

export default Dashboard;
