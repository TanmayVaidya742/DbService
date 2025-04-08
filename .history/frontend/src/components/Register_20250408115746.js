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

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    mobileNo: '',
    address: '',
    email: '',
    organization: '',
    username: '',
    password: '',
    confirmPassword: '',
  });

  const [organizations, setOrganizations] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/organizations');
      setOrganizations(response.data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching organizations',
        severity: 'error'
      });
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setSnackbar({
        open: true,
        message: 'Passwords do not match',
        severity: 'error'
      });
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      const dataToSend = {
        ...registerData,
        mobile_no: registerData.mobileNo,
      };
      delete dataToSend.mobileNo;

      await axios.post('http://localhost:5000/api/auth/register', dataToSend);
      setSnackbar({
        open: true,
        message: 'Registration successful! Please login.',
        severity: 'success'
      });
      setFormData({
        name: '',
        mobileNo: '',
        address: '',
        email: '',
        organization: '',
        username: '',
        password: '',
        confirmPassword: '',
      });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Registration failed',
        severity: 'error'
      });
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
                  Superadmin Registration
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField required fullWidth label="Full Name" name="name" value={formData.name} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField required fullWidth label="Mobile Number" name="mobileNo" value={formData.mobileNo} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField required fullWidth label="Address" name="address" multiline rows={3} value={formData.address} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField required fullWidth label="Email Address" name="email" value={formData.email} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth margin="normal" required>
                        <InputLabel>Organization</InputLabel>
                        <Select
                          name="organization"
                          value={formData.organization}
                          onChange={handleChange}
                          label="Organization"
                        >
                          {organizations.map((org) => (
                            <MenuItem key={org.organization_name} value={org.organization_name}>
                              {org.organization_name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField required fullWidth label="Username" name="username" value={formData.username} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField required fullWidth type="password" label="Password" name="password" value={formData.password} onChange={handleChange} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField required fullWidth type="password" label="Confirm Password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
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
