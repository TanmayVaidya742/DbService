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
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{ borderRadius: '8px', textTransform: 'none' }}
              >
                Upload CSV File
                <input
                  type="file"
                  name="csvFile"
                  accept=".csv"
                  hidden
                  onChange={onFileChange}
                />
              </Button>
            </FormField>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" sx={{ borderRadius: '8px' }}>
          Cancel
        </Button>
        <Button onClick={onSubmit} variant="contained" sx={{ backgroundColor: '#7C3AED', borderRadius: '8px' }}>
          Submit
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default AddDatabaseDialog;
