import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, useRoutes, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";
import "./styles/theme.css";
import { routes } from "./routes/routes";
import { Provider } from "react-redux";
import { store } from "./redux/store";

const theme = createTheme({
  typography: {
      primary:{
        text:
          "black"
      },
      h2: {
        fontSize: "20px"
      },
      h5: {
        fontSize: "20px"
      }
  },
  palette: {
    primary: {
      main: "#c55a11",
      light: "#eeb188",
      text: "#3d53fb",
      dark: "#000000"
    },
    secondary: {
      main: "#eeb188",
    },
    fontSize: {
      h5:"10px"
    },
    typography: {
      primary:{
        text:
          "black"
      },
      h2: {
        fontSize: "20px"
      },
    },
    button: {
      borderRadius: "5px"
    }
  },
  components:{
    MuiButton: {
      borderRadius: "5px"
    }
    
  }
});

// This should be a top-level component
function AppRoutes() {
  const element = useRoutes(routes);
  return element;
}

function App() {
  const [loading, setLoading] = useState(false); // Set to false or handle your async logic

  useEffect(() => {
    // You can fetch initial data here
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <ThemeProvider theme={theme}>
      <Provider store={store}>
        <Router>
          <AppRoutes />
        </Router>
      </Provider>
    </ThemeProvider>
  );
}

export default App;
