import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  IconButton,
  Grid,
  Button,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  maxHeight: '80vh',
  overflowY: 'auto',
  backgroundColor: 'white',
  boxShadow: 24,
  padding: 20,
  borderRadius: 8,
};

const OrganizationModal = ({ open, onClose }) => {
  const [organizationName, setOrganizationName] = useState('');
  const [users, setUsers] = useState([
    { first_name: '', last_name: '', username: '', password: '', branch: '' },
  ]);
  const [feedback, setFeedback] = useState(null);

  const handleUserChange = (index, key, value) => {
    const updatedUsers = [...users];
    updatedUsers[index][key] = value;
    setUsers(updatedUsers);
  };

  const addUser = () => {
    setUsers([
      ...users,
      { first_name: '', last_name: '', username: '', password: '', branch: '' },
    ]);
  };

  const removeUser = (index) => {
    setUsers(users.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post('/api/organizations/with-users', {
        organization_name: organizationName,
        users,
      });

      setFeedback({
        success: true,
        message: response.data.message,
        skippedUsers: response.data.skippedUsers || [],
      });

      setOrganizationName('');
      setUsers([
        { first_name: '', last_name: '', username: '', password: '', branch: '' },
      ]);
    } catch (error) {
      setFeedback({
        success: false,
        message:
          error.response?.data?.message ||
          'Something went wrong while creating organization',
      });
    }
  };

  const handleClose = () => {
    setFeedback(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Create Organization & Users</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>

        {feedback && (
          <Alert
            severity={feedback.success ? 'success' : 'error'}
            sx={{ my: 2 }}
          >
            {feedback.message}
            {feedback.skippedUsers?.length > 0 && (
              <ul style={{ margin: '8px 0 0 16px' }}>
                {feedback.skippedUsers.map((user, idx) => (
                  <li key={idx}>
                    {user.username} — {user.reason}
                  </li>
                ))}
              </ul>
            )}
          </Alert>
        )}

        <TextField
          label="Organization Name"
          fullWidth
          margin="normal"
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
        />

        <Typography variant="subtitle1" sx={{ mt: 2 }}>
          Users:
        </Typography>

        {users.map((user, index) => (
          <Box
            key={index}
            sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2, mb: 2 }}
          >
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={user.first_name}
                  onChange={(e) =>
                    handleUserChange(index, 'first_name', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={user.last_name}
                  onChange={(e) =>
                    handleUserChange(index, 'last_name', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Username"
                  fullWidth
                  value={user.username}
                  onChange={(e) =>
                    handleUserChange(index, 'username', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={user.password}
                  onChange={(e) =>
                    handleUserChange(index, 'password', e.target.value)
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Branch"
                  fullWidth
                  value={user.branch}
                  onChange={(e) =>
                    handleUserChange(index, 'branch', e.target.value)
                  }
                />
              </Grid>
            </Grid>
            {users.length > 1 && (
              <Button
                color="error"
                size="small"
                onClick={() => removeUser(index)}
                sx={{ mt: 1 }}
              >
                Remove User
              </Button>
            )}
          </Box>
        ))}

        <Button onClick={addUser} variant="outlined" sx={{ mb: 2 }}>
          + Add Another User
        </Button>

        <Button variant="contained" fullWidth onClick={handleSubmit}>
          Submit
        </Button>
      </Box>
    </Modal>
  );
};

export default OrganizationModal;
