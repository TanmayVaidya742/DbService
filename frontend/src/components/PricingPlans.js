import React, { useState, useEffect } from 'react';
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
 Chip,
 Avatar,
 AppBar,
 Toolbar,
 IconButton,
 Drawer,
 useMediaQuery,
 useTheme,
 Grow,
 Zoom,
 TableContainer,
 Paper,
 Table,
 TableHead,
 TableBody,
 TableRow,
 TableCell,
 ListItemText
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import {
 ArrowBack as ArrowBackIcon,
 Menu as MenuIcon,
 Settings as SettingsIcon,
 Store as StoreIcon,
 Person as PersonIcon,
 CheckCircle,
 Bolt,
 Diamond,
 Star,
 WorkspacePremium
} from '@mui/icons-material';

const drawerWidth = 240;

const PricingPlans = () => {
 const theme = useTheme();
 const isMobile = useMediaQuery(theme.breakpoints.down('md'));
 const navigate = useNavigate();
 const location = useLocation();
 const { dbName } = location.state || {};
 const [selectedPlan, setSelectedPlan] = useState(null);
 const [mobileOpen, setMobileOpen] = useState(false);
 const [animate, setAnimate] = useState(false);

 // Trigger animation on component mount
 useEffect(() => {
 setAnimate(true);
 }, []);

 const plans = [
 {
 title: 'Current',
 price: 'Free',
 period: 'Forever',
 features: ['3 Tables', 'Basic Support', '1 Member', '5GB Storage'],
 cta: 'Current Plan',
 recommended: false,
 icon: <Star fontSize="large" />,


 color: theme.palette.grey[500]
 },
 {
 title: 'Pro',
 price: '$29',
 period: '/month',
 features: [
 'Unlimited Tables', 
 'Priority Support',
 '5 Members',
 '50GB Storage',
 'Advanced Analytics',
 'API Access'
 ],
 cta: 'Upgrade Now',
 recommended: true,
 icon: <Bolt fontSize="large" />,
 color: theme.palette.primary.main,
 ribbon: 'Most Popular',
 savings: 'Save 20%'
 },
 {
 title: 'Enterprise',
 price: 'Custom',
 period: 'Tailored Solution',
 features: [
 'Unlimited Everything',
 '24/7 Premium Support',
 'Unlimited Members',
 '1TB+ Storage',
 'Dedicated Infrastructure',
 'Custom SLAs'
 ],
 cta: 'Contact Sales',
 recommended: false,
 icon: <Diamond fontSize="large" />,
 color: theme.palette.secondary.main,
 ribbon: 'Premium'
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

 const handleDrawerToggle = () => {
 setMobileOpen(!mobileOpen);
 };

 const drawer = (
 <div>
 <Toolbar>
 <Typography variant="h6">1SPOC</Typography>
 </Toolbar>
 <Divider />
 <List>
 <ListItem button onClick={() => navigate("/databases")}>
 <ListItemIcon>
 <PersonIcon />
 </ListItemIcon>
 <ListItemText primary="Databases" />
 </ListItem>
 <ListItem
 button
 selected
 sx={{ backgroundColor: 'var(--primary-light)' }}
 >
 <ListItemIcon>
 <StoreIcon />
 </ListItemIcon>
 <ListItemText primary="Upgrade plan" />
 </ListItem>
 </List>
 </div>
 );

 const handleCardClick = (index) => {
 setSelectedPlan(selectedPlan === index ? null : index);
 
 // Trigger card animation
 const cards = document.querySelectorAll('.pricing-card');
 cards.forEach((card, idx) => {
 if (idx === index) {
 card.classList.add('card-pulse');
 setTimeout(() => card.classList.remove('card-pulse'), 1000);
 }
 });
 };

 return (
 <Box sx={{ display: 'flex' }}>
 <AppBar
 position="fixed"
 sx={{
 zIndex: (theme) => theme.zIndex.drawer + 1,
 backgroundColor: 'var(--primary-color)',
 width: { sm: `calc(100% - ${drawerWidth}px)` },
 ml: { sm: `${drawerWidth}px` },
 }}
 >
 <Toolbar>
 <IconButton
 color="inherit"
 edge="start"
 onClick={handleDrawerToggle}
 sx={{ mr: 2, display: { sm: 'none' } }}
 >
 <MenuIcon />
 </IconButton>
 <Typography variant="h6" noWrap component="div">
 Pricing Plans
 </Typography>
 <IconButton color="inherit" sx={{ ml: 'auto' }}>
 <SettingsIcon />
 </IconButton>
 </Toolbar>
 </AppBar>

 <Box
 component="nav"
 sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
 >
 <Drawer
 variant="temporary"
 open={mobileOpen}
 onClose={handleDrawerToggle}
 ModalProps={{
 keepMounted: true,
 }}
 sx={{
 display: { xs: 'block', sm: 'none' },
 '& .MuiDrawer-paper': {
 boxSizing: 'border-box',
 width: drawerWidth,
 },
 }}
 >
 {drawer}
 </Drawer>
 <Drawer
 variant="permanent"
 sx={{
 display: { xs: 'none', sm: 'block' },
 '& .MuiDrawer-paper': {
 boxSizing: 'border-box',
 width: drawerWidth,
 },
 }}
 open
 >
 {drawer}
 </Drawer>
 </Box>

 <Box
 component="main"
 sx={{
 flexGrow: 1,
 p: 3,
 width: { sm: `calc(100% - ${drawerWidth}px)` },
 
 '@keyframes pulse': {
 '0%': { transform: 'scale(1)' },
 '50%': { transform: 'scale(1.05)' },
 '100%': { transform: 'scale(1)' }
 },
 '@keyframes cardGlow': {
 '0%': { boxShadow: '0 5px 15px rgba(0,0,0,0.05)' },
 '50%': { boxShadow: '0 5px 25px rgba(104, 109, 224, 0.5)' },
 '100%': { boxShadow: '0 5px 15px rgba(0,0,0,0.05)' },
 },
 '.card-float': {
 animation: 'float 3s ease-in-out infinite'
 },
 '.card-pulse': {
 animation: 'pulse 0.5s ease-in-out'
 },
 '.card-glow': {
 animation: 'cardGlow 2s infinite'
 }
 }}
 >
 <Toolbar />
 <Button
 startIcon={<ArrowBackIcon />}
 onClick={() => dbName ? navigate(`/database/${dbName}`) : navigate('/databases')}
 sx={{ mb: 4, color: 'text.primary' }}
 >
 Back to Databases
 </Button>

 <Container maxWidth="xl">
 <Box textAlign="center" mb={8}>
 <Typography
 variant="h3"
 sx={{
 fontWeight: 800,
 mb: 2,
 background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
 WebkitBackgroundClip: 'text',
 WebkitTextFillColor: 'transparent'
 }}
 >
 Power Up Your Database
 </Typography>
 <Typography variant="h6" color="text.secondary">
 Choose the plan that unlocks your full potential
 </Typography>
 </Box>

 {/* Equal size cards with improved animations */}
 <Grid container spacing={5} justifyContent="center" alignItems="stretch" sx={{ mb: 8 }}>
 {plans.map((plan, index) => (
 <Grid item xs={12} md={6} lg={4} key={plan.title} sx={{ display: 'flex', justifyContent: 'center' }}>
 <Grow 
 in={animate} 
 timeout={(index + 1) * 400}
 style={{ transformOrigin: '50% 10% 0' }}
 >
 <Card
 className={`pricing-card ${index === 1 ? 'card-glow' : 'card-float'}`}
 sx={{
 display: 'flex',
 flexDirection: 'column',
 width: '100%',
 minWidth: { xs: '320px', sm: '400px', md: '420px' },
 maxWidth: { xs: '100%', md: '450px' },
 height: '100%',
 position: 'relative',
 overflow: 'visible',
 border: `2px solid ${plan.recommended ? plan.color : theme.palette.divider}`,
 boxShadow: theme.shadows[4],
 transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
 cursor: 'pointer',
 borderRadius: '16px',
 '&:hover': {
 transform: 'translateY(-8px) scale(1.02)',
 boxShadow: `0 20px 30px -10px ${plan.color}33`
 },
 '&:active': {
 transform: 'translateY(-2px) scale(0.98)'
 }
 }}
 onClick={() => handleCardClick(index)}
 >
 {plan.ribbon && (
 <Zoom in={animate} timeout={1200}>
 <Chip
 icon={<WorkspacePremium />}
 label={plan.ribbon}
 color="primary"
 sx={{
 position: 'absolute',
 top: -16,
 right: 20,
 zIndex: 1,
 fontWeight: 800,
 fontSize: '0.75rem',
 height: 32,
 borderRadius: 16,
 bgcolor: plan.color,
 color: 'white'
 }}
 />
 </Zoom>
 )}

 {plan.savings && (
 <Chip
 label={plan.savings}
 color="success"
 size="small"
 sx={{
 position: 'absolute',
 top: 16,
 left: -10,
 zIndex: 1,
 transform: 'rotate(-15deg)',
 fontWeight: 'bold'
 }}
 />
 )}

 <CardContent sx={{
 p: 4,
 background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
 position: 'relative',
 overflow: 'hidden',
 flexGrow: 1,
 display: 'flex',
 flexDirection: 'column',
 '&:before': {
 content: '""',
 position: 'absolute',
 top: '-50%',
 left: '-50%',
 width: '200%',
 height: '200%',
 background: `radial-gradient(circle, ${plan.color}33 0%, transparent 70%)`,
 transform: 'rotate(45deg)',
 transition: 'all 0.5s'
 },
 '&:hover:before': {
 transform: 'rotate(135deg)'
 }
 }}>
 <Box textAlign="center" mb={4}>
 <Avatar sx={{
 bgcolor: `${plan.color}22`,
 color: plan.color,
 width: 80,
 height: 80,
 mb: 2,
 mx: 'auto',
 transition: 'all 0.5s',
 '&:hover': {
 transform: 'rotate(15deg) scale(1.1)',
 }
 }}>
 {plan.icon}
 </Avatar>
 <Typography variant="h4" fontWeight={800} gutterBottom>
 {plan.title}
 </Typography>
 <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
 <Typography variant="h3" fontWeight={800} sx={{ mr: 1 }}>
 {plan.price}
 </Typography>
 <Typography variant="subtitle1" color="text.secondary">
 {plan.period}
 </Typography>
 </Box>
 </Box>

 <List dense sx={{ mb: 3, flexGrow: 1 }}>
 {plan.features.map((feature) => (
 <ListItem
 key={feature}
 sx={{
 px: 0,
 py: 1,
 transition: 'all 0.3s',
 '&:hover': {
 transform: 'translateX(8px)',
 bgcolor: 'action.hover'
 }
 }}
 >
 <ListItemIcon sx={{ minWidth: 32 }}>
 <CheckCircle sx={{ color: plan.color }} />
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
 py: 1.5,
 borderRadius: 3,
 fontWeight: 700,
 fontSize: '1rem',
 position: 'relative',
 overflow: 'hidden',
 mt: 'auto',
 transition: 'all 0.3s',
 backgroundColor: plan.recommended ? plan.color : 'transparent',
 color: plan.recommended ? 'white' : plan.color,
 borderColor: plan.color,
 '&:after': {
 content: '""',
 position: 'absolute',
 top: '-50%',
 left: '-50%',
 width: '200%',
 height: '200%',
 background: `linear-gradient(45deg, transparent, ${plan.color}44, transparent)`,
 transform: 'rotate(45deg)',
 transition: 'all 0.5s'
 },
 '&:hover': {
 backgroundColor: plan.recommended ? `${plan.color}CC` : `${plan.color}10`,
 boxShadow: `0 4px 12px ${plan.color}33`
 },
 '&:hover:after': {
 left: '150%'
 }
 }}
 >
 {plan.cta}
 </Button>
 </CardContent>
 </Card>
 </Grow>
 </Grid>
 ))}
 </Grid>

 <Divider sx={{ my: 8, borderColor: 'divider' }} />

 <Typography variant="h4" sx={{
 mb: 4,
 textAlign: 'center',
 color: 'text.primary',
 fontWeight: 'bold'
 }}>
 Detailed Feature Comparison
 </Typography>

 <TableContainer
 component={Paper}
 sx={{
 borderRadius: '16px',
 border: '1px solid rgba(0, 0, 0, 0.08)',
 overflow: 'hidden',
 mb: 8,
 boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
 }}
 >
 <Table>
 <TableHead>
 <TableRow sx={{ 
 bgcolor: 'background.default',
 '& th': {
 fontWeight: 'bold',
 fontSize: '0.95rem',
 py: 2,
 borderBottom: '2px solid rgba(0, 0, 0, 0.12)'
 }
 }}>
 <TableCell>Feature</TableCell>
 <TableCell align="center">Current</TableCell>
 <TableCell align="center" sx={{ 
 bgcolor: `${plans[1].color}10`,
 position: 'relative',
 '&::after': {
 content: '""',
 position: 'absolute',
 top: 0,
 left: 0,
 right: 0,
 height: '4px',
 bgcolor: plans[1].color
 }
 }}>
 Professional
 </TableCell>
 <TableCell align="center">Enterprise</TableCell>
 </TableRow>
 </TableHead>
 <TableBody>
 {featuresComparison.map((row) => (
 <TableRow
 key={row.feature}
 sx={{ 
 '&:nth-of-type(odd)': { 
 bgcolor: 'action.hover' 
 },
 '&:hover': {
 bgcolor: 'action.selected'
 }
 }}
 >
 <TableCell component="th" scope="row" sx={{ 
 fontWeight: 'medium',
 py: 2
 }}>
 {row.feature}
 </TableCell>
 <TableCell align="center" sx={{ py: 2 }}>
 <Chip
 label={row.starter}
 variant="outlined"
 sx={{
 borderColor: row.starter === '✖' ? 'text.disabled' : plans[0].color,
 color: row.starter === '✖' ? 'text.disabled' : plans[0].color
 }}
 />
 </TableCell>
 <TableCell align="center" sx={{ py: 2 }}>
 <Chip
 label={row.pro}
 variant={row.pro === '✔' ? 'filled' : 'outlined'}
 sx={{
 bgcolor: row.pro === '✔' ? plans[1].color : 'transparent',
 color: row.pro === '✔' ? 'white' : plans[1].color,
 borderColor: plans[1].color
 }}
 />
 </TableCell>
 <TableCell align="center" sx={{ py: 2 }}>
 <Chip
 label={row.enterprise}
 variant={row.enterprise === '✔' ? 'filled' : 'outlined'}
 sx={{
 bgcolor: row.enterprise === '✔' ? plans[2].color : 'transparent',
 color: row.enterprise === '✔' ? 'white' : plans[2].color,
 borderColor: plans[2].color
 }}
 />
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </TableContainer>

 <Box sx={{
 mt: 6,
 p: 4,
 borderRadius: '16px',
 bgcolor: 'background.paper',
 border: '1px solid rgba(0, 0, 0, 0.08)',
 textAlign: 'center',
 boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
 }}>
 <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
 Need help choosing a plan?
 </Typography>
 <Typography variant="body1" sx={{ mb: 3, maxWidth: '600px', mx: 'auto' }}>
 Contact our sales team to discuss your specific needs and find the perfect solution for your business.
 </Typography>
 <Button
 variant="contained"
 size="large"
 sx={{
 px: 4,
 py: 1.5,
 borderRadius: '12px',
 fontWeight: 'bold',
 fontSize: '1rem',
 background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
 '&:hover': {
 boxShadow: `0 4px 20px ${theme.palette.primary.main}33`
 }
 }}
 >
 Contact Sales
 </Button>
 </Box>
 </Container>
 </Box>
 </Box>
 );
};
export default PricingPlans;