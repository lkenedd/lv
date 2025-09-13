import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  SystemUpdate as UpdateIcon,
  Wifi as ApnIcon,
  BatteryChargingFull as BatteryIcon,
  CleaningServices as CleanIcon,
  Info as InfoIcon,
  Launch as LaunchIcon,
  Warning as WarningIcon,
  CheckCircle as SuccessIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  startAppUpdate,
  startApnActivity,
  ignoreBatteryOptimizations,
  cleanApp,
  getSystemInfo,
  SystemInfo,
} from '../utils/dtunnel';

interface SystemTool {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  action: () => Promise<void>;
  category: 'update' | 'network' | 'optimization' | 'maintenance';
  status?: 'idle' | 'running' | 'success' | 'error';
}

const SystemTools: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    appVersion: '1.0.0',
    configVersion: '1.0.0',
    statusBarHeight: 0,
    navigationBarHeight: 0,
  });
  const [tools, setTools] = useState<SystemTool[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    tool: SystemTool | null;
  }>({ open: false, tool: null });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSystemInfo();
    initializeTools();
  }, []);

  const loadSystemInfo = async () => {
    try {
      const info = await getSystemInfo();
      setSystemInfo(info);
    } catch (error) {
      toast.error('Failed to load system information');
    }
  };

  const initializeTools = () => {
    const toolsData: SystemTool[] = [
      {
        id: 'app-update',
        title: 'Check for Updates',
        description: 'Check and install the latest version of MISTERVPN',
        icon: UpdateIcon,
        category: 'update',
        status: 'idle',
        action: async () => {
          const success = await startAppUpdate();
          if (success) {
            toast.success('Update check completed');
          } else {
            toast.error('Failed to check for updates');
          }
        },
      },
      {
        id: 'apn-settings',
        title: 'APN Settings',
        description: 'Configure Access Point Name settings for mobile data',
        icon: ApnIcon,
        category: 'network',
        status: 'idle',
        action: async () => {
          const success = await startApnActivity();
          if (success) {
            toast.info('APN settings opened');
          } else {
            toast.error('Failed to open APN settings');
          }
        },
      },
      {
        id: 'battery-optimization',
        title: 'Battery Optimization',
        description: 'Disable battery optimization to prevent VPN disconnections',
        icon: BatteryIcon,
        category: 'optimization',
        status: 'idle',
        action: async () => {
          const success = await ignoreBatteryOptimizations();
          if (success) {
            toast.success('Battery optimization settings updated');
          } else {
            toast.error('Failed to update battery optimization');
          }
        },
      },
      {
        id: 'clean-app',
        title: 'Clean Application Data',
        description: 'Clear temporary files and reset app to default state',
        icon: CleanIcon,
        category: 'maintenance',
        status: 'idle',
        action: async () => {
          const success = await cleanApp();
          if (success) {
            toast.success('Application data cleaned successfully');
          } else {
            toast.error('Failed to clean application data');
          }
        },
      },
    ];

    setTools(toolsData);
  };

  const handleToolAction = async (tool: SystemTool) => {
    if (tool.category === 'maintenance') {
      setConfirmDialog({ open: true, tool });
      return;
    }

    await executeToolAction(tool);
  };

  const executeToolAction = async (tool: SystemTool) => {
    setIsLoading(true);
    
    // Update tool status to running
    setTools(prev => prev.map(t => 
      t.id === tool.id ? { ...t, status: 'running' } : t
    ));

    try {
      await tool.action();
      
      // Update tool status to success
      setTools(prev => prev.map(t => 
        t.id === tool.id ? { ...t, status: 'success' } : t
      ));

      // Reset status after 3 seconds
      setTimeout(() => {
        setTools(prev => prev.map(t => 
          t.id === tool.id ? { ...t, status: 'idle' } : t
        ));
      }, 3000);
    } catch (error) {
      // Update tool status to error
      setTools(prev => prev.map(t => 
        t.id === tool.id ? { ...t, status: 'error' } : t
      ));

      // Reset status after 3 seconds
      setTimeout(() => {
        setTools(prev => prev.map(t => 
          t.id === tool.id ? { ...t, status: 'idle' } : t
        ));
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    if (confirmDialog.tool) {
      await executeToolAction(confirmDialog.tool);
    }
    setConfirmDialog({ open: false, tool: null });
  };

  const getCategoryTitle = (category: SystemTool['category']): string => {
    switch (category) {
      case 'update': return 'Updates';
      case 'network': return 'Network Tools';
      case 'optimization': return 'Optimization';
      case 'maintenance': return 'Maintenance';
      default: return 'Tools';
    }
  };

  const getCategoryColor = (category: SystemTool['category']) => {
    switch (category) {
      case 'update': return 'primary.main';
      case 'network': return 'info.main';
      case 'optimization': return 'success.main';
      case 'maintenance': return 'warning.main';
      default: return 'text.primary';
    }
  };

  const getStatusIcon = (status?: SystemTool['status']) => {
    switch (status) {
      case 'running':
        return <LinearProgress sx={{ width: 20 }} />;
      case 'success':
        return <SuccessIcon sx={{ color: 'success.main' }} />;
      case 'error':
        return <WarningIcon sx={{ color: 'error.main' }} />;
      default:
        return <LaunchIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  // Group tools by category
  const toolsByCategory = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, SystemTool[]>);

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          System Tools
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          System utilities and maintenance tools for optimal VPN performance.
        </Typography>
      </Box>

      {/* System Information */}
      <Card 
        sx={{ 
          mb: 3,
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6">System Information</Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                App Version
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {systemInfo.appVersion}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Config Version
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {systemInfo.configVersion}
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Status Bar Height
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {systemInfo.statusBarHeight}px
              </Typography>
            </Grid>
            <Grid item xs={6} md={3}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Navigation Bar Height
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {systemInfo.navigationBarHeight}px
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tools by Category */}
      {Object.entries(toolsByCategory).map(([category, categoryTools]) => (
        <Card 
          key={category}
          sx={{ 
            mb: 3,
            background: 'rgba(30, 41, 59, 0.5)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: getCategoryColor(category as SystemTool['category']),
                  mr: 1,
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                {getCategoryTitle(category as SystemTool['category'])}
              </Typography>
              <Chip
                label={`${categoryTools.length} tool${categoryTools.length > 1 ? 's' : ''}`}
                size="small"
                variant="outlined"
                sx={{ ml: 2 }}
              />
            </Box>

            <List>
              {categoryTools.map((tool) => (
                <ListItem key={tool.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <tool.icon sx={{ color: getCategoryColor(tool.category) }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={tool.title}
                    secondary={tool.description}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                  <ListItemSecondaryAction>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(tool.status)}
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleToolAction(tool)}
                        disabled={tool.status === 'running' || isLoading}
                      >
                        {tool.status === 'running' ? 'Running...' : 'Run'}
                      </Button>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      ))}

      {/* Warning Alert */}
      <Alert 
        severity="warning" 
        sx={{ 
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          border: '1px solid rgba(255, 152, 0, 0.3)',
        }}
      >
        <Typography variant="body2">
          <strong>Important:</strong> Some system tools may require administrative permissions or 
          cause temporary interruptions to your VPN connection. Use these tools when you're not 
          actively using the VPN for critical tasks.
        </Typography>
      </Alert>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, tool: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Action
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action will reset the application to its default state and clear all data.
          </Alert>
          <Typography>
            Are you sure you want to run "{confirmDialog.tool?.title}"?
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
            {confirmDialog.tool?.description}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ open: false, tool: null })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAction}
            color="warning"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemTools;