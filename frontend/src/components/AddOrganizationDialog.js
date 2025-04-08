import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import axios from 'axios';

const AddOrganizationDialog = ({ open, onClose, onSubmit }) => {
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    organizationName: '',
    ownerName: '',
    domain: '',
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/organizations');
      setOrganizations(response.data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'organizationName') {
      const selectedOrg = organizations.find(org => org.organization_name === e.target.value);
      if (selectedOrg) {
        setFormData({
          organizationName: selectedOrg.organization_name,
          ownerName: selectedOrg.owner_name,
          domain: selectedOrg.domain,
        });
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Organization</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Select Organization</InputLabel>
            <Select
              name="organizationName"
              value={formData.organizationName}
              onChange={handleChange}
              label="Select Organization"
            >
              {organizations.map((org) => (
                <MenuItem key={org.organization_name} value={org.organization_name}>
                  {org.organization_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Owner Name"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            fullWidth
            required
            disabled
          />
          <TextField
            label="Domain"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            fullWidth
            required
            disabled
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Add Organization
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddOrganizationDialog; 