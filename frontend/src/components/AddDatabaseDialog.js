import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(2),
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: 'var(--primary-color)',
  color: 'var(--primary-text)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
}));

const AddDatabaseDialog = ({ open, onClose, onSubmit }) => {
  const [databaseName, setDatabaseName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!databaseName.trim()) {
      alert('Database name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ databaseName });
      setDatabaseName(''); // Reset form on success
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <StyledDialogTitle>
        <Typography variant="h6" style={{ color: 'var(--primary-text)' }}>Create New Database</Typography>
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon style={{ color: 'var(--primary-text)' }} />
        </IconButton>
      </StyledDialogTitle>
      <DialogContent dividers>
        <Box component="form" noValidate>
          <TextField
            fullWidth
            label="Database Name"
            value={databaseName}
            onChange={(e) => setDatabaseName(e.target.value)}
            required
            variant="outlined"
            margin="normal"
            disabled={isSubmitting}
            helperText="Enter a unique name for your database"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={isSubmitting || !databaseName.trim()}
        >
          {isSubmitting ? 'Creating...' : 'Create Database'}
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default AddDatabaseDialog;