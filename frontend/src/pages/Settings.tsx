import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Save as SaveIcon,
  Person as UserIcon,
  Lock as PasswordIcon,
  Key as KeyIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  getUsername,
  setUsername,
  getPassword,
  setPassword,
  getUuid,
  setUuid,
} from '../utils/dtunnel';

const Settings: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    uuid: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [appSettings, setAppSettings] = useState({
    autoConnect: false,
    notifications: true,
    darkTheme: true,
    autoReconnect: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const username = getUsername();
      const password = getPassword();
      const uuid = getUuid();
      
      setCredentials({
        username,
        password,
        uuid,
      });

      // Load app settings from localStorage
      const savedSettings = localStorage.getItem('mistervpn-settings');
      if (savedSettings) {
        setAppSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      toast.error('Failed to load settings');
    }
  };

  const handleCredentialChange = (field: keyof typeof credentials, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingChange = (field: keyof typeof appSettings, value: boolean) => {
    setAppSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveCredentials = async () => {
    setIsSaving(true);
    try {
      setUsername(credentials.username);
      setPassword(credentials.password);
      setUuid(credentials.uuid);
      
      // Save app settings to localStorage
      localStorage.setItem('mistervpn-settings', JSON.stringify(appSettings));
      
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Settings
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Configure your VPN authentication and application preferences.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Authentication Settings */}
        <Grid item xs={12}>
          <Card 
            sx={{ 
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <UserIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  Authentication
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={credentials.username}
                    onChange={(e) => handleCredentialChange('username', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <UserIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => handleCredentialChange('password', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PasswordIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      },
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="UUID (Device Identifier)"
                    value={credentials.uuid}
                    onChange={(e) => handleCredentialChange('uuid', e.target.value)}
                    helperText="Unique identifier for this device"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyIcon />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Application Settings */}
        <Grid item xs={12}>
          <Card 
            sx={{ 
              background: 'rgba(30, 41, 59, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SettingsIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  Application Settings
                </Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={appSettings.autoConnect}
                        onChange={(e) => handleSettingChange('autoConnect', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Auto-connect on startup"
                  />
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                    Automatically connect to the last used server when the app starts
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={appSettings.autoReconnect}
                        onChange={(e) => handleSettingChange('autoReconnect', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Auto-reconnect"
                  />
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                    Automatically reconnect if the VPN connection is lost
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={appSettings.notifications}
                        onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Notifications"
                  />
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                    Show notifications for connection status and events
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={appSettings.darkTheme}
                        onChange={(e) => handleSettingChange('darkTheme', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Dark theme"
                  />
                  <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                    Use dark theme for the application interface
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Info Alert */}
        <Grid item xs={12}>
          <Alert 
            severity="info" 
            sx={{ 
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              border: '1px solid rgba(33, 150, 243, 0.3)',
            }}
          >
            <Typography variant="body2">
              <strong>Security Note:</strong> Your credentials are stored locally and used only for VPN authentication. 
              Make sure to keep your login information secure and never share it with others.
            </Typography>
          </Alert>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              size="large"
              onClick={saveCredentials}
              disabled={isSaving}
              startIcon={<SaveIcon />}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: 2,
                background: 'linear-gradient(45deg, #5f5fff 30%, #8080ff 90%)',
                boxShadow: '0 4px 20px rgba(95, 95, 255, 0.3)',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 25px rgba(95, 95, 255, 0.4)',
                },
              }}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Settings;