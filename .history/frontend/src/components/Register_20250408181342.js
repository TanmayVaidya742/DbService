import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Typography,
  Button,
  Box,
  Snackbar,
  Alert,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

// Styled Components
const MainSection = styled('section')({
  minHeight: '100vh',
  position: 'relative',
  backgroundColor: '#ffffff',
  overflow: 'hidden',
});

const WaveBackground = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 0,
});

const ContentWrapper = styled('div')({
  position: 'relative',
  zIndex: 1,
  paddingTop: '5rem',
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
  backgroundColor: '#ffffff',
}));

// Static organization options
const ORGANIZATIONS = [
  { organization_name: 'pinnacle.in' },
  { organization_name: 'hdfc.in' },
  { organization_name: 'icici.in' },
  { organization_name: 'axis.in' },
  { organization_name: 'sbi.in' }
];

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    organization_name: '',
    owner_name: '',
    domain: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error && name !== 'password' && name !== 'confirmPassword') {
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        organization_name: formData.organization_name,
        owner_name: formData.owner_name,
        domain: formData.domain,
        email: formData.email,
        password: formData.password
      });

      if (response.data.message === 'Registration successful') {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <MainSection>
      {/* Wave background */}
      <WaveBackground>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#7C3AED" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wave-gradient)"
            fillOpacity="0.2"
            d="M0,128L48,122.7C96,117,192,107,288,122.7C384,139,480,181,576,170.7C672,160,768,96,864,80C960,64,1056,96,1152,106.7C1248,117,1344,107,1392,101.3L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>
      </WaveBackground>

      {/* Registration Form */}
      <ContentWrapper>
        <Container maxWidth="md">
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={10}>
              <StyledPaper>
                <Typography
                  variant="h4"
                  align="center"
                  gutterBottom
                  sx={{ fontWeight: 600, color: '#111827' }}
                >
                  Register Organization
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        required 
                        fullWidth 
                        label="Organization Name" 
                        name="organization_name" 
                        value={formData.organization_name} 
                        onChange={handleChange}
                        error={!!error}
                        helperText={error}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        required 
                        fullWidth 
                        label="Owner Name" 
                        name="owner_name" 
                        value={formData.owner_name} 
                        onChange={handleChange}
                        error={!!error}
                        helperText={error}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField 
                        required 
                        fullWidth 
                        label="Domain" 
                        name="domain" 
                        value={formData.domain} 
                        onChange={handleChange}
                        error={!!error}
                        helperText={error}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        required 
                        fullWidth 
                        label="Email" 
                        name="email" 
                        type="email" 
                        value={formData.email} 
                        onChange={handleChange}
                        error={!!error}
                        helperText={error}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        required 
                        fullWidth 
                        type="password" 
                        label="Password" 
                        name="password" 
                        value={formData.password} 
                        onChange={handleChange}
                        error={!!error}
                        helperText={error}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField 
                        required 
                        fullWidth 
                        type="password" 
                        label="Confirm Password" 
                        name="confirmPassword" 
                        value={formData.confirmPassword} 
                        onChange={handleChange}
                        error={!!error}
                        helperText={error}
                      />
                    </Grid>
                  </Grid>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 3,
                      bgcolor: '#7C3AED',
                      textTransform: 'none',
                      fontSize: '1rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      '&:hover': { bgcolor: '#6D28D9' },
                    }}
                  >
                    Register
                  </Button>
                </Box>
              </StyledPaper>
            </Grid>
          </Grid>
        </Container>
      </ContentWrapper>

      {/* Snackbar for success */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </MainSection>
  );
};

export default Register;
