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
  Grid,
  Box,
  InputAdornment
} from '@mui/material';
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
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

const FormField = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const AddDatabaseDialog = ({ open, onClose, formData, onChange, onSubmit }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [domainError, setDomainError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const validateDomain = (domain) => {
    const domainRegex = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      setDomainError('Please enter a valid domain name (e.g., example.com)');
      return false;
    }
    setDomainError('');
    return true;
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = () => {
    if (!formData.organizationName || !formData.domainName || 
        !formData.ownerEmail || !formData.fullName || !formData.password) {
      alert('All fields are required');
      return;
    }

    if (!validateDomain(formData.domainName)) {
      return;
    }

    if (!validatePassword(formData.password)) {
      return;
    }

    // Validate email domain matches
    const emailDomain = formData.ownerEmail.split('@')[1];
    if (emailDomain !== formData.domainName) {
      alert('Owner email domain must match the organization domain name');
      return;
    }

    onSubmit(formData);
  };

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
          marginTop: '5vh'
        }
      }}
    >
      <StyledDialogTitle>
        <Typography variant="h6" style={{ color: 'var(--primary-text)' }}>Create New Organization</Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: 'var(--primary-text)' }}
        >
          <CloseIcon />
        </IconButton>
      </StyledDialogTitle>
      <DialogContent dividers sx={{
        maxHeight: '70vh',
        overflowY: 'auto'
      }}>
        <Box component="form" noValidate>
          <Grid container spacing={2}>
            {/* Organization Information */}
            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Organization Name"
                name="organizationName"
                value={formData.organizationName || ''}
                onChange={onChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--border-radius)' } }}
              />
            </FormField>

            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Domain Name (e.g., hdfc.in)"
                name="domainName"
                value={formData.domainName || ''}
                onChange={onChange}
                required
                variant="outlined"
                error={!!domainError}
                helperText={domainError || "This will be your unique organization identifier"}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--border-radius)' } }}
                onBlur={(e) => validateDomain(e.target.value)}
              />
            </FormField>

            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Owner Email"
                name="ownerEmail"
                type="email"
                value={formData.ownerEmail || ''}
                onChange={onChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--border-radius)' } }}
                helperText={`Must be from ${formData.domainName || 'your domain'}`}
              />
            </FormField>

            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                name="fullName"
                value={formData.fullName || ''}
                onChange={onChange}
                required
                variant="outlined"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--border-radius)' } }}
              />
            </FormField>

            <FormField item xs={12}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={onChange}
                required
                variant="outlined"
                error={!!passwordError}
                helperText={passwordError || "Must be at least 8 characters"}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--border-radius)' } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormField>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          color="inherit"
          sx={{
            borderRadius: 'var(--border-radius)',
            borderColor: 'var(--primary-color)',
            color: 'var(--primary-color)',
            '&:hover': {
              borderColor: 'var(--primary-hover)',
              backgroundColor: 'var(--primary-light)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            backgroundColor: 'var(--primary-color)',
            borderRadius: 'var(--border-radius)',
            '&:hover': {
              backgroundColor: 'var(--primary-hover)',
            },
          }}
        >
          Create Organization
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default AddDatabaseDialog;