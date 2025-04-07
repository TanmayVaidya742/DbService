import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

const MainSection = styled('section')({
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#ffffff',
});

const WaveBackground = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 0,
});

const Navbar = styled('nav')({
  position: 'relative',
  zIndex: 1,
  padding: '1rem 0',
});

const NavContent = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const NavButtons = styled('div')({
  display: 'flex',
  gap: '1rem',
});

const MainContent = styled('main')({
  position: 'relative',
  zIndex: 1,
  marginTop: '4rem',
});

const ButtonGroup = styled('div')({
  display: 'flex',
  gap: '1rem',
  marginTop: '2rem',
});

const ImageContainer = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  '& img': {
    maxWidth: '90%',
    height: 'auto',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease',
    '&:hover': {
      transform: 'scale(1.02)',
    },
  },
});

const ContentContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '100%',
  padding: '2rem 0',
});

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <MainSection>
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

      {/* Navbar */}
      <Navbar>
        <Container maxWidth="lg">
          <NavContent>
            <Typography 
              variant="h5" 
              sx={{ 
                color: '#374151', 
                fontWeight: 600,
                cursor: 'pointer',
                '&:hover': { color: '#7C3AED' }
              }}
              onClick={() => navigate('/')}
            >
              1SPOC
            </Typography>
            <NavButtons>
              <Button
                variant="outlined"
                sx={{ 
                  borderColor: '#7C3AED',
                  color: '#7C3AED',
                  textTransform: 'none',
                  px: 3,
                  borderRadius: '8px',
                  '&:hover': {
                    borderColor: '#6D28D9',
                    backgroundColor: 'rgba(124, 58, 237, 0.04)',
                  }
                }}
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
              <Button
                variant="contained"
                sx={{ 
                  bgcolor: '#7C3AED',
                  color: 'white',
                  textTransform: 'none',
                  px: 3,
                  borderRadius: '8px',
                  '&:hover': {
                    bgcolor: '#6D28D9',
                  }
                }}
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
            </NavButtons>
          </NavContent>
        </Container>
      </Navbar>

      {/* Main Content */}
      <MainContent>
        <Container maxWidth="lg">
          <Grid 
            container 
            spacing={8} 
            alignItems="center" 
            justifyContent="space-between"
            sx={{ minHeight: 'calc(100vh - 200px)', flexWrap: 'nowrap',    marginRight: '244px'}}
          >
            {/* Left Content */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
              <ContentContainer>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  gutterBottom 
                  sx={{ 
                    fontWeight: 700,
                    color: '#111827',
                    mb: 3,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    lineHeight: 1.2,
                  }}
                >
                  Why do we use it?
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#6B7280',
                    mb: 4,
                    fontSize: '1.125rem',
                    lineHeight: 1.7,
                  }}
                >
                  A web-based platform that enables users to invite and manage users from other organizations. Invited users can create and manage databases through an intuitive UI, facilitating seamless collaboration and data management across organizations.
                </Typography>
                <ButtonGroup>
                  <Button
                    variant="contained"
                    sx={{ 
                      bgcolor: '#7C3AED',
                      color: 'white',
                      textTransform: 'none',
                      px: 6,
                      py: 1.5,
                      fontSize: '1.125rem',
                      borderRadius: '8px',
                      '&:hover': {
                        bgcolor: '#6D28D9',
                      },
                    }}
                    onClick={() => navigate('/login')}
                  >
                    Get Started
                  </Button>
                </ButtonGroup>
              </ContentContainer>
            </Grid>

            {/* Right Image */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ImageContainer>
                <img 
                  src="/assets/images/1.png" 
                  alt="Landing page illustration"
                  style={{ maxWidth: '160%', height: 'auto', animation: 'float 6s ease-in-out infinite' }}
                />
              </ImageContainer>
            </Grid>
          </Grid>
        </Container>
      </MainContent>
    </MainSection>
  );
};

export default LandingPage;

// Add this to your global CSS or create a new style tag
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-20px); }
  }
`;
document.head.appendChild(style);
