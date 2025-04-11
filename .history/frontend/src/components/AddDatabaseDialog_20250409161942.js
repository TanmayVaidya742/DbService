import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Typography,
  Grid,
  Box,
  Chip
} from '@mui/material';
import { Close as CloseIcon, CloudUpload as CloudUploadIcon } from '@mui/icons-material';
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
  backgroundColor: '#7C3AED',
  color: 'white',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(2),
}));

const FormField = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const UploadButton = styled(Button)(({ theme }) => ({
  border: '2px dashed #7C3AED',
  backgroundColor: 'rgba(124, 58, 237, 0.04)',
  '&:hover': {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    border: '2px dashed #6D28D9',
  },
}));

const AddDatabaseDialog = ({ open, onClose, formData, onChange, onFileChange, onSubmit }) => {
  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <StyledDialogTitle>
        <Typography variant="h6">Create New Database</Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <DialogContent dividers>
        <Box component="form" noValidate>
          <Grid container spacing={2}>
            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Database Name"
                name="databaseName"
                value={formData.databaseName}
                onChange={onChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </FormField>
            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Table Name"
                name="tableName"
                value={formData.tableName}
                onChange={onChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
              />
            </FormField>
            <FormField item xs={12}>
              <input
                type="file"
                accept=".csv"
                id="csv-upload"
                hidden
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (file.type !== 'text/csv') {
                      alert('Please upload a CSV file');
                      return;
                    }
                    onFileChange(e);
                  }
                }}
              />
              <label htmlFor="csv-upload">
                <UploadButton
                  component="span"
                  fullWidth
                  startIcon={<CloudUploadIcon />}
                  sx={{ borderRadius: '8px', textTransform: 'none' }}
                >
                  Upload CSV File
                </UploadButton>
              </label>
              {formData.csvFile && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Chip
                    label={formData.csvFile.name}
                    onDelete={() => onChange({ target: { name: 'csvFile', value: null } })}
                    sx={{ backgroundColor: '#7C3AED', color: 'white' }}
                  />
                </Box>
              )}
            </FormField>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit" 
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
          Cancel
        </Button>
        <Button 
          onClick={onSubmit} 
          variant="contained" 
          sx={{ 
            backgroundColor: '#7C3AED', 
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#6D28D9',
            },
          }}
        >
          Create Database
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default AddDatabaseDialog;
