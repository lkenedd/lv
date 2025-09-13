import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Chip,
  Paper,
  IconButton,
  Fade,
  Zoom,
} from '@mui/material';
import {
  PlayArrow as ConnectIcon,
  Stop as DisconnectIcon,
  Language as ServerIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Refresh as RefreshIcon,
  Shield as ShieldIcon,
  Wifi as WifiIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  getVpnState,
  getNetworkInfo,
  getSystemInfo,
  startVpn,
  stopVpn,
  getDefaultConfig,
  setupEventListeners,
  VpnState,
  NetworkInfo,
  SystemInfo,
  VpnConfig,
} from '../utils/dtunnel';

const Dashboard: React.FC = () => {
  const [vpnState, setVpnState] = useState<VpnState>({
    connected: false,
    status: 'disconnected',
  });
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    localIP: 'Loading...',
    networkName: 'Loading...',
  });
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    appVersion: '1.0.0',
    configVersion: '1.0.0',
    statusBarHeight: 0,
    navigationBarHeight: 0,
  });
  const [currentConfig, setCurrentConfig] = useState<VpnConfig | null>(null);
  const [connectionTime, setConnectionTime] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    setupEventListeners({
      onVpnStateChange: (state) => {
        setVpnState(prev => ({
          ...prev,
          status: state as VpnState['status'],
          connected: state === 'connected',
        }));
      },
      onError: (error) => {
        toast.error(`VPN Error: ${error.error}`);
      },
    });

    // Connection timer
    const timer = setInterval(() => {
      if (vpnState.connected) {
        setConnectionTime(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [vpnState.connected]);

  const loadDashboardData = async () => {
    try {
      const [vpn, network, system, config] = await Promise.all([
        getVpnState(),
        getNetworkInfo(),
        getSystemInfo(),
        getDefaultConfig(),
      ]);

      setVpnState(vpn);
      setNetworkInfo(network);
      setSystemInfo(system);
      setCurrentConfig(config);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    }
  };

  const handleVpnToggle = async () => {
    setIsLoading(true);
    try {
      if (vpnState.connected) {
        const success = await stopVpn();
        if (success) {
          setConnectionTime(0);
          toast.success('VPN disconnected successfully');
        } else {
          toast.error('Failed to disconnect VPN');
        }
      } else {
        const success = await startVpn();
        if (success) {
          toast.success('VPN connected successfully');
        } else {
          toast.error('Failed to connect VPN');
        }
      }
      // Refresh VPN state
      const newState = await getVpnState();
      setVpnState(newState);
    } catch (error) {
      toast.error('VPN operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (): 'success' | 'error' | 'warning' | 'info' => {
    switch (vpnState.status) {
      case 'connected': return 'success';
      case 'connecting': return 'warning';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Grid container spacing={3}>
        {/* Main VPN Control Panel */}
        <Grid item xs={12} md={8}>
          <Card 
            className="card"
            sx={{ 
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              {/* VPN Status Display */}
              <Box sx={{ mb: 4 }}>
                <Zoom in={true} timeout={1000}>
                  <Box
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 3,
                      borderRadius: '50%',
                      background: vpnState.connected
                        ? 'linear-gradient(45deg, #10b981 30%, #34d399 90%)'
                        : 'linear-gradient(45deg, #6b7280 30%, #9ca3af 90%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: vpnState.connected
                        ? '0 0 30px rgba(16, 185, 129, 0.4)'
                        : '0 0 20px rgba(107, 114, 128, 0.2)',
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    {isLoading ? (
                      <CircularProgress sx={{ color: 'white' }} />
                    ) : (
                      <ShieldIcon 
                        sx={{ 
                          fontSize: 48, 
                          color: 'white',
                          filter: vpnState.connected ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none',
                        }} 
                      />
                    )}
                    {vpnState.connected && (
                      <Box
                        sx={{
                          position: 'absolute',
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          border: '2px solid rgba(16, 185, 129, 0.6)',
                          animation: 'pulse 2s infinite',
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(1)', opacity: 1 },
                            '100%': { transform: 'scale(1.2)', opacity: 0 },
                          },
                        }}
                      />
                    )}
                  </Box>
                </Zoom>

                <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {vpnState.status.charAt(0).toUpperCase() + vpnState.status.slice(1)}
                </Typography>

                <Chip
                  label={vpnState.connected ? 'Protected' : 'Unprotected'}
                  color={getStatusColor()}
                  sx={{ mb: 3, fontWeight: 'medium' }}
                />

                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
                  {vpnState.connected
                    ? 'Your connection is secure and encrypted'
                    : 'Click to connect and secure your connection'}
                </Typography>

                {/* Connection Time */}
                {vpnState.connected && (
                  <Fade in={vpnState.connected}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
                      <TimerIcon sx={{ color: 'success.main' }} />
                      <Typography variant="h6" sx={{ color: 'success.main', fontFamily: 'monospace' }}>
                        {formatTime(connectionTime)}
                      </Typography>
                    </Box>
                  </Fade>
                )}
              </Box>

              {/* VPN Control Button */}
              <Button
                variant="contained"
                size="large"
                onClick={handleVpnToggle}
                disabled={isLoading || vpnState.status === 'connecting'}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={20} sx={{ color: 'inherit' }} />
                  ) : vpnState.connected ? (
                    <DisconnectIcon />
                  ) : (
                    <ConnectIcon />
                  )
                }
                sx={{
                  py: 2,
                  px: 4,
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  borderRadius: 3,
                  background: vpnState.connected
                    ? 'linear-gradient(45deg, #dc2626 30%, #ef4444 90%)'
                    : 'linear-gradient(45deg, #5f5fff 30%, #8080ff 90%)',
                  boxShadow: '0 4px 20px rgba(95, 95, 255, 0.3)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 25px rgba(95, 95, 255, 0.4)',
                  },
                }}
              >
                {isLoading ? 'Processing...' : vpnState.connected ? 'Disconnect' : 'Connect'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Side Information Panel */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={2}>
            {/* Current Server */}
            <Grid item xs={12}>
              <Card 
                className="card"
                sx={{ 
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ServerIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Server</Typography>
                    <IconButton size="small" onClick={loadDashboardData} sx={{ ml: 'auto' }}>
                      <RefreshIcon />
                    </IconButton>
                  </Box>
                  {currentConfig ? (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {currentConfig.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {currentConfig.server}:{currentConfig.port}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No server selected
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Network Information */}
            <Grid item xs={12}>
              <Card 
                className="card"
                sx={{ 
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WifiIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">Network</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Name:</strong> {networkInfo.networkName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>IP:</strong> {networkInfo.localIP}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* System Information */}
            <Grid item xs={12}>
              <Card 
                className="card"
                sx={{ 
                  background: 'rgba(30, 41, 59, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6">System</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Version:</strong> {systemInfo.appVersion}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Config:</strong> {systemInfo.configVersion}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;