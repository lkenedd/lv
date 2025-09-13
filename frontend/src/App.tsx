import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// VPN Pages
import Dashboard from './pages/Dashboard';
import ServerSelection from './pages/ServerSelection';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import Hotspot from './pages/Hotspot';
import SystemTools from './pages/SystemTools';

// Layout
import VpnLayout from './components/Layout/VpnLayout';

// Create Material-UI theme with dark mode
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5f5fff',
    },
    secondary: {
      main: '#8080ff',
    },
    background: {
      default: '#141525',
      paper: 'rgba(30, 41, 59, 0.5)',
    },
    text: {
      primary: '#ffffff',
      secondary: '#cbd5e1',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #141525 0%, #191820 100%)',
          minHeight: '100vh',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <VpnLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/servers" element={<ServerSelection />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/logs" element={<Logs />} />
            <Route path="/hotspot" element={<Hotspot />} />
            <Route path="/system" element={<SystemTools />} />
          </Routes>
        </VpnLayout>
      </Router>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </ThemeProvider>
  );
}

export default App;
