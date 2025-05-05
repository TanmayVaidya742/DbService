import React from 'react';
import {
    Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';

const PricingPlans = () => {
  const navigate = useNavigate();
  const plans = [
    {
      title: 'Starter',
      price: 'Free',
      features: [
        '3 Tables per Database',
        'Basic Support',
        '1 Team Member',
        '5GB Storage'
      ],
      buttonText: 'Current Plan',
      recommended: false
    },
    {
      title: 'Professional',
      price: '$29/month',
      features: [
        'Unlimited Tables',
        'Priority Support',
        '5 Team Members',
        '50GB Storage',
        'Advanced Analytics',
        'API Access'
      ],
      buttonText: 'Upgrade to Professional',
      recommended: true
    },
    {
      title: 'Enterprise',
      price: 'Custom',
      features: [
        'Unlimited Everything',
        '24/7 Premium Support',
        'Unlimited Team Members',
        '1TB+ Storage',
        'Dedicated Infrastructure',
        'Custom SLAs'
      ],
      buttonText: 'Contact Sales',
      recommended: false
    }
  ];

  const featuresComparison = [
    { feature: 'Tables per Database', starter: '3', pro: 'Unlimited', enterprise: 'Unlimited' },
    { feature: 'Support', starter: 'Basic', pro: 'Priority', enterprise: '24/7 Premium' },
    { feature: 'Storage', starter: '5GB', pro: '50GB', enterprise: '1TB+' },
    { feature: 'Team Members', starter: '1', pro: '5', enterprise: 'Unlimited' },
    { feature: 'Advanced Analytics', starter: '✖', pro: '✔', enterprise: '✔' },
    { feature: 'API Access', starter: '✖', pro: '✔', enterprise: '✔' },
    { feature: 'Custom SLAs', starter: '✖', pro: '✖', enterprise: '✔' }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" sx={{ 
        mb: 4, 
        textAlign: 'center',
        color: 'var(--text-primary)'
      }}>
        Choose Your Plan
      </Typography>

      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} md={4} key={plan.title}>
            <Card sx={{ 
              height: '100%',
              border: plan.recommended ? '2px solid var(--primary-color)' : 'none',
              boxShadow: plan.recommended ? '0 8px 24px rgba(25, 118, 210, 0.2)' : 'none'
            }}>
              <CardContent sx={{ p: 3 }}>
                {plan.recommended && (
                  <Typography variant="overline" sx={{
                    color: 'var(--primary-color)',
                    fontWeight: 'bold',
                    display: 'block',
                    mb: 1
                  }}>
                    RECOMMENDED
                  </Typography>
                )}
                <Typography variant="h5" sx={{ mb: 1 }}>
                  {plan.title}
                </Typography>
                <Typography variant="h3" sx={{ 
                  mb: 2,
                  color: 'var(--primary-color)'
                }}>
                  {plan.price}
                </Typography>
                
                <List dense>
                  {plan.features.map((feature) => (
                    <ListItem key={feature} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: '32px' }}>
                        <CheckIcon color="primary" />
                      </ListItemIcon>
                      <Typography variant="body1">
                        {feature}
                      </Typography>
                    </ListItem>
                  ))}
                </List>

                <Button
                  fullWidth
                  variant={plan.recommended ? 'contained' : 'outlined'}
                  size="large"
                  sx={{
                    mt: 2,
                    ...(plan.recommended ? {
                      backgroundColor: 'var(--primary-color)',
                      '&:hover': {
                        backgroundColor: 'var(--primary-hover)'
                      }
                    } : {
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)'
                    })
                  }}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 6 }} />

      <Typography variant="h4" sx={{ 
        mb: 3, 
        textAlign: 'center',
        color: 'var(--text-primary)'
      }}>
        Feature Comparison
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'var(--bg-paper)' }}>Feature</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'var(--bg-paper)' }}>Starter</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'var(--bg-paper)' }}>Professional</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'var(--bg-paper)' }}>Enterprise</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {featuresComparison.map((row) => (
              <TableRow key={row.feature}>
                <TableCell component="th" scope="row" sx={{ color: 'var(--text-primary)' }}>
                  {row.feature}
                </TableCell>
                <TableCell align="center" sx={{ color: 'var(--text-secondary)' }}>{row.starter}</TableCell>
                <TableCell align="center" sx={{ color: 'var(--text-secondary)' }}>{row.pro}</TableCell>
                <TableCell align="center" sx={{ color: 'var(--text-secondary)' }}>{row.enterprise}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          sx={{
            color: 'var(--text-primary)',
            borderColor: 'var(--border-color)'
          }}
        >
          Back to Database
        </Button>
      </Box>
    </Container>
  );
};

export default PricingPlans;