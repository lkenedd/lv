import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  Grid,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Wifi as HotspotIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Devices as DevicesIcon,
  SignalWifi4Bar as SignalIcon,
  Security as SecurityIcon,
  Refresh as RefreshIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  getHotspotStatus,
  startHotspot,
  stopHotspot,
  HotspotStatus,
} from '../utils/dtunnel';

interface HotspotConfig {
  ssid: string;
  password: string;
  securityType: 'WPA2' | 'WPA3' | 'Open';
  maxClients: number;
}

const Hotspot: React.FC = () => {
  const [hotspotStatus, setHotspotStatus] = useState<HotspotStatus>({
    enabled: false,
    clients: 0,
  });
  const [config, setConfig] = useState<HotspotConfig>({
    ssid: 'MISTERVPN-Hotspot',
    password: 'mistervpn123',
    securityType: 'WPA2',
    maxClients: 8,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectedDevices] = useState([
    { name: 'iPhone 13', mac: '00:1B:44:11:3A:B7', ip: '192.168.43.2', connected: '2 min ago' },
    { name: 'MacBook Pro', mac: '00:14:22:01:23:45', ip: '192.168.43.3', connected: '5 min ago' },
  ]);

  useEffect(() => {
    loadHotspotStatus();
    
    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('mistervpn-hotspot-config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }

    // Refresh status every 10 seconds when hotspot is enabled
    const interval = setInterval(() => {
      if (hotspotStatus.enabled) {
        loadHotspotStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [hotspotStatus.enabled]);

  const loadHotspotStatus = async () => {
    try {
      const status = await getHotspotStatus();
      setHotspotStatus(status);
    } catch (error) {
      toast.error('Failed to load hotspot status');
    }
  };

  const handleToggleHotspot = async () => {
    setIsLoading(true);
    try {
      let success = false;
      
      if (hotspotStatus.enabled) {
        success = await stopHotspot();
        if (success) {
          setHotspotStatus({ enabled: false, clients: 0 });
          toast.success('Hotspot stopped successfully');
        }
      } else {
        // Save config before starting
        localStorage.setItem('mistervpn-hotspot-config', JSON.stringify(config));
        success = await startHotspot();
        if (success) {
          setHotspotStatus(prev => ({ ...prev, enabled: true }));
          toast.success('Hotspot started successfully');
        }
      }

      if (!success) {
        toast.error('Failed to toggle hotspot');
      }
    } catch (error) {
      toast.error('Hotspot operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (field: keyof HotspotConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const password = Array.from({ length: 12 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    
    handleConfigChange('password', password);
    toast.success('New password generated');
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Wi-Fi Hotspot
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Share your VPN connection with other devices through a secure Wi-Fi hotspot.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Hotspot Control */}
        <Grid item xs={12} md={8}>
          <Card 
            sx={{ 
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <CardContent>
              {/* Status Display */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    mx: 'auto',
                    mb: 2,
                    borderRadius: '50%',
                    background: hotspotStatus.enabled
                      ? 'linear-gradient(45deg, #10b981 30%, #34d399 90%)'
                      : 'linear-gradient(45deg, #6b7280 30%, #9ca3af 90%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: hotspotStatus.enabled
                      ? '0 0 30px rgba(16, 185, 129, 0.4)'
                      : '0 0 20px rgba(107, 114, 128, 0.2)',
                  }}
                >
                  <HotspotIcon 
                    sx={{ 
                      fontSize: 40, 
                      color: 'white',
                    }} 
                  />
                </Box>

                <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Hotspot {hotspotStatus.enabled ? 'Active' : 'Inactive'}
                </Typography>

                <Chip
                  label={hotspotStatus.enabled ? 'Broadcasting' : 'Stopped'}
                  color={hotspotStatus.enabled ? 'success' : 'default'}
                  sx={{ mb: 2 }}
                />

                {hotspotStatus.enabled && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <DevicesIcon sx={{ color: 'success.main' }} />
                    <Typography variant="body1" sx={{ color: 'success.main' }}>
                      {hotspotStatus.clients} device(s) connected
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Control Button */}
              <Box sx={{ textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleToggleHotspot}
                  disabled={isLoading}
                  startIcon={
                    isLoading ? undefined :
                    hotspotStatus.enabled ? <StopIcon /> : <StartIcon />
                  }
                  sx={{
                    py: 1.5,
                    px: 4,
                    fontSize: '1.1rem',
                    borderRadius: 2,
                    background: hotspotStatus.enabled
                      ? 'linear-gradient(45deg, #dc2626 30%, #ef4444 90%)'
                      : 'linear-gradient(45deg, #5f5fff 30%, #8080ff 90%)',
                    boxShadow: '0 4px 20px rgba(95, 95, 255, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {isLoading ? 'Processing...' : hotspotStatus.enabled ? 'Stop Hotspot' : 'Start Hotspot'}
                </Button>
              </Box>

              {/* Warning */}
              {hotspotStatus.enabled && (
                <Alert 
                  severity="info" 
                  sx={{ 
                    mt: 3,
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    border: '1px solid rgba(33, 150, 243, 0.3)',
                  }}
                >
                  Your VPN connection is being shared. All connected devices will route through the VPN server.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Hotspot Configuration */}
        <Grid item xs={12} md={4}>
          <Card 
            sx={{ 
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Configuration</Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Network Name (SSID)"
                  value={config.ssid}
                  onChange={(e) => handleConfigChange('ssid', e.target.value)}
                  disabled={hotspotStatus.enabled}
                  size="small"
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={config.password}
                  onChange={(e) => handleConfigChange('password', e.target.value)}
                  disabled={hotspotStatus.enabled}
                  size="small"
                  InputProps={{
                    endAdornment: (
                      <Box sx={{ display: 'flex' }}>
                        <IconButton
                          size="small"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                        <Button
                          size="small"
                          onClick={generateRandomPassword}
                          disabled={hotspotStatus.enabled}
                        >
                          Generate
                        </Button>
                      </Box>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Max Clients"
                  type="number"
                  value={config.maxClients}
                  onChange={(e) => handleConfigChange('maxClients', parseInt(e.target.value) || 1)}
                  disabled={hotspotStatus.enabled}
                  inputProps={{ min: 1, max: 16 }}
                  size="small"
                />
              </Box>

              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Configuration can only be changed when hotspot is stopped.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Connected Devices */}
        {hotspotStatus.enabled && (
          <Grid item xs={12}>
            <Card 
              sx={{ 
                background: 'rgba(30, 41, 59, 0.5)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DevicesIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Connected Devices</Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <IconButton size="small" onClick={loadHotspotStatus}>
                    <RefreshIcon />
                  </IconButton>
                </Box>

                {connectedDevices.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 3 }}>
                    <DevicesIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No devices connected yet
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {connectedDevices.map((device, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <SignalIcon sx={{ color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={device.name}
                          secondary={
                            <Box>
                              <Typography variant="caption" sx={{ display: 'block' }}>
                                MAC: {device.mac}
                              </Typography>
                              <Typography variant="caption" sx={{ display: 'block' }}>
                                IP: {device.ip} • Connected {device.connected}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Hotspot;