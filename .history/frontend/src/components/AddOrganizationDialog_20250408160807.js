import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Grid,
} from '@mui/material';
import axios from 'axios';

const AddOrganizationDialog = ({ open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    organizationName: '',
    ownerName: '',
    domain: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.organizationName || !formData.ownerName || !formData.domain) {
        setError('All fields are required');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/organizations', {
        organizationName: formData.organizationName,
        ownerName: formData.ownerName,
        domain: formData.domain,
      });

      onSuccess(response.data);
      onClose();
      setFormData({ organizationName: '', ownerName: '', domain: '' });
      setError('');
    } catch (err) {
      console.error('Error creating organization:', err);
      setError(err.response?.data?.message || 'Failed to create organization');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Organization</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Organization Name"
                name="organizationName"
                value={formData.organizationName}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                placeholder="Enter organization name"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Owner Name"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                placeholder="Enter owner's full name"
                helperText="Enter the name of the organization owner"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Domain"
                name="domain"
                value={formData.domain}
                onChange={handleChange}
                fullWidth
                required
                variant="outlined"
                placeholder="e.g., example.com"
                helperText="Enter the organization's domain name"
              />
            </Grid>
          </Grid>
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!formData.organizationName || !formData.ownerName || !formData.domain}
        >
          Add Organization
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddOrganizationDialog; 