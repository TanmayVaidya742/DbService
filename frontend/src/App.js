import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import UserDashboard from './components/UserDashboard';
import Organizations from './components/Organizations';
import axios from 'axios';
import DatabaseDetails from './components/DatabaseDetails';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

function App() {
  const [hasUsers, setHasUsers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUsers = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/auth/check-users');
        setHasUsers(response.data.hasUsers);
      } catch (error) {
        console.error('Error checking users:', error);
        setHasUsers(false);
      } finally {
        setLoading(false);
      }
    };

    checkUsers();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/login" 
            element={<Login />} 
          />
          <Route 
            path="/register" 
            element={<Register />} 
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/userdashboard" element={<UserDashboard />} />
          <Route path="/organizations" element={<Organizations />} />
          <Route path="/database/:dbName" element={<DatabaseDetails />} />

        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
