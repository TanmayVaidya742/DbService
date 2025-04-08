import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  ListItemAvatar,
} from '@mui/material';
import { Email as EmailIcon, Business as BusinessIcon, Person as PersonIcon } from '@mui/icons-material';
import axios from 'axios';

const Organizations = () => {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch organizations with their users
        const [orgsResponse, usersResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/organizations'),
          axios.get('http://localhost:5000/api/users')
        ]);

        // Group users by organization
        const usersByOrg = usersResponse.data.reduce((acc, user) => {
          if (!acc[user.organization]) {
            acc[user.organization] = [];
          }
          acc[user.organization].push(user);
          return acc;
        }, {});

        // Combine organization data with their users
        const orgsWithUsers = orgsResponse.data.map(org => ({
          ...org,
          users: usersByOrg[org.organization_name] || []
        }));

        setOrganizations(orgsWithUsers);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load organizations and users');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Organizations
      </Typography>
      
      <Grid container spacing={3}>
        {organizations.map((org) => (
          <Grid item xs={12} key={org.id}>
            <Card sx={{ mb: 3 }}>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <BusinessIcon />
                  </Avatar>
                }
                title={org.organization_name}
                subheader={`Owner: ${org.owner_name}`}
                action={
                  <Chip
                    label={`${org.users.length} Users`}
                    color="primary"
                    sx={{ ml: 1 }}
                  />
                }
              />
              <CardContent>
                <List sx={{ width: '100%' }}>
                  {org.users.map((user, index) => (
                    <React.Fragment key={user.id}>
                      <ListItem 
                        sx={{ 
                          py: 2,
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                        onClick={() => handleUserClick(user)}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={user.name}
                          secondary={
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                              <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                              {user.email}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={user.user_type}
                            color="secondary"
                            size="small"
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < org.users.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {org.users.length === 0 && (
                    <ListItem>
                      <ListItemText primary="No users in this organization" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* User Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        {selectedUser && (
          <>
            <DialogTitle>User Details</DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 56, height: 56 }}>
                    <PersonIcon fontSize="large" />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedUser.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedUser.email}
                    </Typography>
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">User Type</Typography>
                  <Typography variant="body1">{selectedUser.user_type}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Organization</Typography>
                  <Typography variant="body1">{selectedUser.organization}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Branch</Typography>
                  <Typography variant="body1">{selectedUser.branch}</Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                  <Typography variant="body1">{selectedUser.username}</Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Organizations; 