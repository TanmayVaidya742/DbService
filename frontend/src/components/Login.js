import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Snackbar,
  Alert,
  Grid,
  Paper,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';

const MainSection = styled('section')({
  minHeight: '100vh',
  position: 'relative',
  backgroundColor: 'var(--bg-primary)',
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

const StyledPaper = styled(Paper)({
  padding: '2rem',
  borderRadius: 'var(--border-radius)',
  boxShadow: 'var(--shadow-lg)',
});

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Check for email instead of username
    if (!formData.email.trim()) {
      setError('Please enter your email');
      return;
    }
  
    if (!formData.password) {
      setError('Please enter your password');
      return;
    }
  
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email: formData.email,
        password: formData.password
      });
  
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setSuccess(true);
  
      setTimeout(() => {
        const userType = res.data.user.user_type;
        if (userType === 'superadmin') {
          navigate('/superadmin-dashboard');
        } else {
          navigate('/dashboard');
        }
      }, 2000);
    } catch (err) {
      console.error('Login error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };
  return (
    <MainSection>
      <WaveBackground>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--secondary-color)" />
              <stop offset="100%" stopColor="var(--primary-color)" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wave-gradient)"
            fillOpacity="0.2"
            d="M0,128L48,122.7C96,117,192,107,288,122.7C384,139,480,181,576,170.7C672,160,768,96,864,80C960,64,1056,96,1152,106.7C1248,117,1344,107,1392,101.3L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
          />
        </svg>
      </WaveBackground>

      <ContentWrapper>
        <Container maxWidth="sm">
          <Grid container justifyContent="center">
            <Grid item xs={12}>
              <StyledPaper>
                <Typography
                  variant="h4"
                  align="center"
                  gutterBottom
                  sx={{ fontWeight: 600, color: 'var(--text-primary)' }}
                >
                  Login
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    value={formData.email}
                    onChange={handleChange}
                    error={Boolean(error)}
                    helperText={error}
                    placeholder="Enter your email"
                  />
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    type="password"
                    label="Password"
                    name="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    error={Boolean(error)}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{
                      mt: 3,
                      bgcolor: 'var(--primary-color)',
                      textTransform: 'none',
                      fontSize: 'var(--font-size-base)',
                      padding: '0.75rem',
                      borderRadius: 'var(--border-radius)',
                      '&:hover': { bgcolor: 'var(--primary-hover)' },
                    }}
                  >
                    Sign In
                  </Button>
                </Box>
              </StyledPaper>
            </Grid>
          </Grid>
        </Container>
      </ContentWrapper>

      <Snackbar open={success} autoHideDuration={4000}>
        <Alert severity="success" sx={{ width: '100%' }}>
          Login successful! Redirecting to dashboard...
        </Alert>
      </Snackbar>

      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </MainSection>
  );
};

export default Login;