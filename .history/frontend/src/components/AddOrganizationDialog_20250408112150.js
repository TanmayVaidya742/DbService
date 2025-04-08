import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';

const AddOrganizationDialog = ({ open, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    organizationName: '',
    ownerName: '',
    domain: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
          <TextField
            label="Organization Name"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleChange}
            fullWidth
            required
          />
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