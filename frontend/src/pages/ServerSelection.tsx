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
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  TextField,
  InputAdornment,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Language as ServerIcon,
  Speed as PingIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as ConnectedIcon,
  RadioButtonUnchecked as DisconnectedIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  getVpnConfigs,
  setVpnConfig,
  getDefaultConfig,
  VpnConfig,
} from '../utils/dtunnel';

const ServerSelection: React.FC = () => {
  const [servers, setServers] = useState<VpnConfig[]>([]);
  const [filteredServers, setFilteredServers] = useState<VpnConfig[]>([]);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadServers();
  }, []);

  useEffect(() => {
    // Filter servers based on search query
    const filtered = servers.filter(server =>
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.server.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredServers(filtered);
  }, [servers, searchQuery]);

  const loadServers = async () => {
    setIsLoading(true);
    try {
      const [configs, defaultConfig] = await Promise.all([
        getVpnConfigs(),
        getDefaultConfig(),
      ]);

      // Add some mock data if no servers are available
      const mockServers: VpnConfig[] = [
        {
          id: 'us-east-1',
          name: 'United States - East',
          server: 'us-east.mistervpn.com',
          port: 443,
          protocol: 'TCP',
          flag: '🇺🇸',
          ping: 45,
        },
        {
          id: 'uk-london-1',
          name: 'United Kingdom - London',
          server: 'uk-london.mistervpn.com',
          port: 443,
          protocol: 'TCP',
          flag: '🇬🇧',
          ping: 78,
        },
        {
          id: 'de-frankfurt-1',
          name: 'Germany - Frankfurt',
          server: 'de-frankfurt.mistervpn.com',
          port: 443,
          protocol: 'TCP',
          flag: '🇩🇪',
          ping: 89,
        },
        {
          id: 'jp-tokyo-1',
          name: 'Japan - Tokyo',
          server: 'jp-tokyo.mistervpn.com',
          port: 443,
          protocol: 'TCP',
          flag: '🇯🇵',
          ping: 145,
        },
        {
          id: 'au-sydney-1',
          name: 'Australia - Sydney',
          server: 'au-sydney.mistervpn.com',
          port: 443,
          protocol: 'TCP',
          flag: '🇦🇺',
          ping: 189,
        },
      ];

      const allServers = configs.length > 0 ? configs : mockServers;
      setServers(allServers);
      setFilteredServers(allServers);

      if (defaultConfig) {
        setSelectedServer(defaultConfig.id);
      }
    } catch (error) {
      toast.error('Failed to load servers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServerSelect = async (serverId: string) => {
    setIsConnecting(true);
    try {
      const success = await setVpnConfig(serverId);
      if (success) {
        setSelectedServer(serverId);
        const server = servers.find(s => s.id === serverId);
        toast.success(`Selected server: ${server?.name}`);
      } else {
        toast.error('Failed to select server');
      }
    } catch (error) {
      toast.error('Server selection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const getPingColor = (ping?: number): 'success' | 'warning' | 'error' => {
    if (!ping) return 'error';
    if (ping < 100) return 'success';
    if (ping < 200) return 'warning';
    return 'error';
  };

  const getPingLabel = (ping?: number): string => {
    if (!ping) return 'N/A';
    if (ping < 100) return 'Excellent';
    if (ping < 200) return 'Good';
    return 'Slow';
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Server Selection
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Choose the best server location for optimal performance and privacy.
        </Typography>
      </Box>

      {/* Search and Refresh */}
      <Card 
        sx={{ 
          mb: 3,
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                },
              }}
            />
            <Button
              variant="outlined"
              onClick={loadServers}
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              Refresh
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Server List */}
      <Card 
        sx={{ 
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {isLoading ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Loading servers...</Typography>
            </Box>
          ) : (
            <List>
              {filteredServers.map((server, index) => (
                <React.Fragment key={server.id}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleServerSelect(server.id)}
                      disabled={isConnecting}
                      sx={{
                        py: 2,
                        px: 3,
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: 'rgba(95, 95, 255, 0.1)',
                        },
                        ...(selectedServer === server.id && {
                          backgroundColor: 'rgba(95, 95, 255, 0.2)',
                          borderLeft: '4px solid #5f5fff',
                        }),
                      }}
                    >
                      <ListItemIcon>
                        {selectedServer === server.id ? (
                          <ConnectedIcon sx={{ color: 'success.main' }} />
                        ) : (
                          <DisconnectedIcon sx={{ color: 'text.secondary' }} />
                        )}
                      </ListItemIcon>

                      <ListItemIcon>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: 'transparent',
                            fontSize: '1.2rem',
                          }}
                        >
                          {server.flag || <FlagIcon />}
                        </Avatar>
                      </ListItemIcon>

                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                              {server.name}
                            </Typography>
                            {selectedServer === server.id && (
                              <Chip 
                                label="Selected" 
                                size="small" 
                                color="success" 
                                variant="outlined"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {server.server}:{server.port} ({server.protocol})
                            </Typography>
                          </Box>
                        }
                      />

                      <Box sx={{ textAlign: 'right' }}>
                        <Chip
                          label={`${server.ping || 'N/A'}ms`}
                          size="small"
                          color={getPingColor(server.ping)}
                          variant="outlined"
                          sx={{ mb: 0.5 }}
                        />
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block',
                            color: `${getPingColor(server.ping)}.main`,
                          }}
                        >
                          {getPingLabel(server.ping)}
                        </Typography>
                      </Box>

                      {isConnecting && selectedServer === server.id && (
                        <Box sx={{ ml: 2 }}>
                          <CircularProgress size={20} />
                        </Box>
                      )}
                    </ListItemButton>
                  </ListItem>
                  {index < filteredServers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {!isLoading && filteredServers.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <ServerIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                No servers found
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Try adjusting your search query or refresh the server list.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={4}>
          <Card 
            sx={{ 
              textAlign: 'center',
              background: 'rgba(30, 41, 59, 0.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <CardContent>
              <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                {servers.length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Available Servers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card 
            sx={{ 
              textAlign: 'center',
              background: 'rgba(30, 41, 59, 0.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <CardContent>
              <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                {servers.filter(s => s.ping && s.ping < 100).length}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Fast Servers
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={4}>
          <Card 
            sx={{ 
              textAlign: 'center',
              background: 'rgba(30, 41, 59, 0.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <CardContent>
              <Typography variant="h4" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                {new Set(servers.map(s => s.server.split('.')[0])).size}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Countries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ServerSelection;