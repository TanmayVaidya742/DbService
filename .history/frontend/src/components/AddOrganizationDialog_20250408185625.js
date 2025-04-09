import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  Alert
} from '@mui/material';
import axios from 'axios';

const AddOrganizationDialog = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    domain: '',
    organization: '' // This will be populated from superadmin table
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchSuperadminData();
    }
  }, [open]);

  const fetchSuperadminData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      console.log('Fetching superadmin data...');
      const response = await axios.get('http://localhost:5000/api/superadmin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Superadmin data received:', response.data);
      if (response.data && response.data.organization) {
        setFormData(prev => ({
          ...prev,
          organization: response.data.organization
        }));
      }
    } catch (err) {
      console.error('Error fetching superadmin data:', err);
      setError(err.response?.data?.message || 'Failed to fetch organization details');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/organizations',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        onSuccess(response.data);
        handleClose();
      }
    } catch (err) {
      console.error('Error adding organization:', err);
      setError(err.response?.data?.message || 'Failed to add organization');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      ownerName: '',
      domain: '',
      organization: ''
    });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Add New Organization
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Organization Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                helperText="Enter the name of the organization"
                placeholder="e.g., Pinnacle Solutions"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Owner Name"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                required
                helperText="Enter the name of the organization owner"
                placeholder="e.g., John Doe"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                required
                helperText="Enter the organization's domain"
                placeholder="e.g., pinnacle.in"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Superadmin Organization"
                name="organization"
                value={formData.organization}
                disabled
                helperText="This is your superadmin organization name"
              />
            </Grid>
          </Grid>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !formData.name || !formData.ownerName || !formData.domain}
        >
          {loading ? 'Adding...' : 'Add Organization'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddOrganizationDialog; 