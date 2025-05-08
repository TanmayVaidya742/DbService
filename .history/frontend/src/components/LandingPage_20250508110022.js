import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Grid } from '@mui/material';
import { styled } from '@mui/material/styles';

const MainSection = styled('section')({
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  overflowY: 'hidden',
  backgroundColor: 'rgba(250, 247, 247, 0.1)',
  backgroundImage: 'url(/assets/images/database.jpg)',
  backgroundPosition: 'center right',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'contain',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center', // Center content vertically
});

const WaveBackground = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 0,
  opacity: 0.8, // Slightly reduce opacity for better blending
});

const Navbar = styled('nav')({
  position: 'relative',
  zIndex: 2,
  padding: '1.5rem 0', // Increased padding for better spacing
});

const NavContent = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 1rem', // Add padding for better alignment
});

const LogoContainer = styled('div')({
  display: 'flex',
  alignItems: 'center',
});

const NavButtons = styled('div')({
  display: 'flex',
  gap: '1.5rem', // Increased gap for better spacing between buttons
  justifyContent: 'flex-end',
});

const MainContent = styled('main')({
  position: 'relative',
  zIndex: 1,
  marginTop: '4rem', // Reduced to bring content closer to navbar
  flexGrow: 1, // Allow content to take remaining space
});

const ButtonGroup = styled('div')({
  display: 'flex',
  gap: '1.5rem', // Increased gap for better spacing
  marginTop: '2.5rem', // Slightly increased for balance
});

const ContentContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  height: '100%',
  padding: '3rem', // Increased padding for better spacing
  borderRadius: 'var(--border-radius)',
  maxWidth: '600px', // Constrain width for better readability
});

const LandingPage = () => {
  const navigate = useNavigate();

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

      <Navbar>
        <Grid paddingLeft={10} marginTop={3}>
          <NavContent>
            <Typography
              variant="h5"
              sx={{
                color: 'var(--text-primary)',
                fontWeight: 900,
                
                cursor: 'pointer',
                '&:hover': { color: 'var(--primary-color)' }
              }}
              onClick={() => navigate('/')}
            >
              1SPOC Database as a Service (DAAS)
            </Typography>
            <NavButtons>
            <Button
                variant="outlined"
                sx={{
                  borderColor: 'var(--primary-color)',
                  color: 'var(--primary-color)',
                  textTransform: 'none',
                  px: 3,
                  borderRadius: 'var(--border-radius)',
                  '&:hover': {
                    borderColor: 'var(--primary-hover)',
                    backgroundColor: 'var(--primary-light)',
                  }
                }}
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
              <Button
                variant="contained"
                sx={{
                  bgcolor: 'var(--primary-color)',
                  color: 'var(--primary-text)',
                  textTransform: 'none',
                  px: 3,
                  borderRadius: 'var(--border-radius)',
                  '&:hover': {
                    bgcolor: 'var(--primary-hover)',
                  },
                  mr: '70px'


                }}
                onClick={() => navigate('/login')}
              >
                Log in
              </Button>
            </NavButtons>
          </NavContent>
        </Grid>
      </Navbar>

      <MainContent>
        <Grid maxWidth="lg">
          <Grid
            container
            spacing={4} // Reduced spacing for a tighter layout
            alignItems="center"
            justifyContent="flex-start"
            sx={{ minHeight: 'calc(100vh - 300px)' }}
          >
            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column' }}>
              <ContentContainer>
                <Typography
                  variant="h4"
                  component="h3"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    mb: 3,
                    
                    ml: 4,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    lineHeight: 1.2,
                  }}
                >
                  What is it?
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'var(--text-secondary)',
                    mb: 4,
                    ml:4,
                    fontSize: '1.3rem',
                    lineHeight: 1.7,
                    overflowWrap: 'break-word',
                    whiteSpace: 'normal',
                  }}
                >
                  A web-based platform to manage databases for organizations using an intuitive UI. 
                  Allowing organizations to create multiple databases with multiple tables within a database. 
                  Facilitating insert, update, delete, read using OData queries.

                </Typography>
                <ButtonGroup
                sx={{ml: 4}}>
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: 'var(--primary-color)',
                      color: 'var(--primary-text)',
                      textTransform: 'none',
                      px: 6,
                      py: 1.5,
                      fontSize: '1.25rem', // Increased font size for emphasis
                      fontWeight: 600, // Bold for emphasis
                      borderRadius: 'var(--border-radius)',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', // Add subtle shadow
                      '&:hover': {
                        bgcolor: 'var(--primary-hover)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', // Enhanced hover effect
                      },
                    }}
                    onClick={() => navigate('/login')}
                  >
                  Login
                  </Button>
                </ButtonGroup>
              </ContentContainer>
            </Grid>
          </Grid>
        </Grid>
      </MainContent>
    </MainSection>
  );
};

export default LandingPage;