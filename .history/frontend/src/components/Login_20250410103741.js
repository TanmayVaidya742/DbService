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

const StyledPaper = styled(Paper)({
  padding: '2rem',
  borderRadius: '16px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
});

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (error) setError('');
  };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Validate username is not empty
//     if (!formData.username.trim()) {
//       setError('Please enter your username');
//       return;
//     }

//     try {
//       console.log('Attempting login with:', formData);
//       const res = await axios.post('http://localhost:5000/api/auth/login', formData);
//       console.log('Login response:', res.data);
//       localStorage.setItem('token', res.data.token);
//       localStorage.setItem('user', JSON.stringify(res.data.user));
//       // setSuccess(true);
//       // setTimeout(() => navigate('/dashboard'), 2000);
//       setSuccess(true);

// // Redirect based on user_type
// setTimeout(() => {
//   if (res.data.user.user_type === 'superadmin') {
//     navigate('/dashboard');
//   } else if (res.data.user.user_type === 'user') {
//     navigate('/userdashboard');
//   } else {
//     setError('Unknown user type');
//   }
// }, 2000);

//     } catch (err) {
//       console.error('Login error details:', {
//         message: err.message,
//         response: err.response?.data,
//         status: err.response?.status
//       });
//       setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
//     }
//   };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.username.trim()) {
    setError('Please enter your username');
    return;
  }

  try {
    const res = await axios.post('http://localhost:5000/api/auth/login', formData);

    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    setSuccess(true);

    // Redirect based on user_type
    setTimeout(() => {
      const userType = res.data.user.user_type;
      if (userType === 'superadmin') {
        navigate('/dashboard');
      } else if (userType === 'user') {
        navigate('/userdashboard');
      } else {
        setError('Unknown user type');
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

      {/* Login Form */}
      <ContentWrapper>
        <Container maxWidth="sm">
          <Grid container justifyContent="center">
            <Grid item xs={12}>
              <StyledPaper>
                <Typography
                  variant="h4"
                  align="center"
                  gutterBottom
                  sx={{ fontWeight: 600, color: '#111827' }}
                >
                  Superadmin Login
                </Typography>

                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Username"
                    name="username"
                    autoComplete="username"
                    autoFocus
                    value={formData.username}
                    onChange={handleChange}
                    error={Boolean(error)}
                    helperText={error}
                    placeholder="Enter your username"
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
                      bgcolor: '#7C3AED',
                      textTransform: 'none',
                      fontSize: '1rem',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      '&:hover': { bgcolor: '#6D28D9' },
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

      {/* Snackbar for success */}
      <Snackbar open={success} autoHideDuration={4000}>
        <Alert severity="success" sx={{ width: '100%' }}>
          Login successful! Redirecting to dashboard...
        </Alert>
      </Snackbar>

      {/* Snackbar for error */}
      <Snackbar open={Boolean(error)} autoHideDuration={4000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </MainSection>
  );
};

export default Login;
