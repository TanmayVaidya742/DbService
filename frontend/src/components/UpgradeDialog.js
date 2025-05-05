import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import { useNavigate } from 'react-router-dom';

const UpgradeDialog = ({ open, onClose }) => {
  const navigate = useNavigate();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
        Upgrade Required
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: 'var(--text-secondary)', mb: 2 }}>
          You've reached the limit of 3 tables per database. Upgrade to our Pro plan
          to create unlimited tables and access premium features.
        </DialogContentText>
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <StoreIcon sx={{ fontSize: 60, color: 'var(--primary-color)', mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Pro Plan Features:
          </Typography>
          <List>
            <ListItem>• Unlimited tables per database</ListItem>
            <ListItem>• Priority support</ListItem>
            <ListItem>• Advanced analytics</ListItem>
          </List>
        </Box>
      </DialogContent>
      <DialogActions sx={{ padding: 3, gap: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: 'var(--text-primary)',
            borderColor: 'var(--border-color)'
          }}
        >
          Later
        </Button>
        <Button
          onClick={() => {
            onClose();
            navigate('/pricing');
          }}
          variant="contained"
          sx={{
            backgroundColor: 'var(--primary-color)',
            '&:hover': {
              backgroundColor: 'var(--primary-hover)'
            }
          }}
        >
          Upgrade Now
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpgradeDialog;