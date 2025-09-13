import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Description as LogIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import {
  getLogs,
  clearLogs,
  setupEventListeners,
  LogEntry,
} from '../utils/dtunnel';

type LogLevel = 'all' | 'info' | 'warning' | 'error';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<LogLevel>('all');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadLogs();
    
    // Setup event listeners for real-time log updates
    setupEventListeners({
      onNewLog: () => {
        if (autoRefresh) {
          loadLogs();
        }
      },
    });

    // Auto-refresh every 5 seconds if enabled
    const interval = setInterval(() => {
      if (autoRefresh) {
        loadLogs();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    // Filter logs based on search query and log level
    let filtered = logs;

    if (filterLevel !== 'all') {
      filtered = filtered.filter(log => log.level === filterLevel);
    }

    if (searchQuery) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, searchQuery, filterLevel]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const logEntries = await getLogs();
      
      // Add some mock logs for demonstration if no logs are available
      if (logEntries.length === 0) {
        const mockLogs: LogEntry[] = [
          {
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'VPN service started successfully',
          },
          {
            timestamp: new Date(Date.now() - 30000).toISOString(),
            level: 'info',
            message: 'Connected to server: us-east.mistervpn.com:443',
          },
          {
            timestamp: new Date(Date.now() - 60000).toISOString(),
            level: 'warning',
            message: 'Network change detected, reconnecting...',
          },
          {
            timestamp: new Date(Date.now() - 120000).toISOString(),
            level: 'info',
            message: 'Configuration loaded: Default config v1.0.0',
          },
          {
            timestamp: new Date(Date.now() - 180000).toISOString(),
            level: 'error',
            message: 'Failed to connect to server: timeout after 30 seconds',
          },
        ];
        setLogs(mockLogs);
      } else {
        setLogs(logEntries);
      }
    } catch (error) {
      toast.error('Failed to load logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      const success = await clearLogs();
      if (success) {
        setLogs([]);
        toast.success('Logs cleared successfully');
      } else {
        toast.error('Failed to clear logs');
      }
    } catch (error) {
      toast.error('Failed to clear logs');
    }
  };

  const handleExportLogs = () => {
    const logText = filteredLogs
      .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
      .join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mistervpn-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Logs exported successfully');
  };

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return <InfoIcon sx={{ color: 'info.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <InfoIcon sx={{ color: 'text.secondary' }} />;
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
          Connection Logs
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Real-time VPN connection logs and system messages.
        </Typography>
      </Box>

      {/* Controls */}
      <Card 
        sx={{ 
          mb: 3,
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <TextField
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                minWidth: 200,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                },
              }}
            />

            {/* Filter */}
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
              size="small"
            >
              {filterLevel === 'all' ? 'All Levels' : filterLevel.charAt(0).toUpperCase() + filterLevel.slice(1)}
            </Button>

            <Menu
              anchorEl={filterMenuAnchor}
              open={Boolean(filterMenuAnchor)}
              onClose={() => setFilterMenuAnchor(null)}
            >
              <MenuItem onClick={() => { setFilterLevel('all'); setFilterMenuAnchor(null); }}>
                All Levels
              </MenuItem>
              <MenuItem onClick={() => { setFilterLevel('info'); setFilterMenuAnchor(null); }}>
                Info
              </MenuItem>
              <MenuItem onClick={() => { setFilterLevel('warning'); setFilterMenuAnchor(null); }}>
                Warning
              </MenuItem>
              <MenuItem onClick={() => { setFilterLevel('error'); setFilterMenuAnchor(null); }}>
                Error
              </MenuItem>
            </Menu>

            <Box sx={{ flexGrow: 1 }} />

            {/* Actions */}
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportLogs}
              size="small"
              disabled={filteredLogs.length === 0}
            >
              Export
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadLogs}
              disabled={isLoading}
              size="small"
            >
              Refresh
            </Button>

            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearLogs}
              size="small"
              sx={{ color: 'error.main', borderColor: 'error.main' }}
            >
              Clear
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Log Statistics */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Chip 
          label={`Total: ${logs.length}`} 
          variant="outlined" 
          color="primary" 
        />
        <Chip 
          label={`Info: ${logs.filter(l => l.level === 'info').length}`} 
          variant="outlined" 
          color="info" 
        />
        <Chip 
          label={`Warnings: ${logs.filter(l => l.level === 'warning').length}`} 
          variant="outlined" 
          color="warning" 
        />
        <Chip 
          label={`Errors: ${logs.filter(l => l.level === 'error').length}`} 
          variant="outlined" 
          color="error" 
        />
      </Box>

      {/* Logs List */}
      <Card 
        sx={{ 
          background: 'rgba(30, 41, 59, 0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <CardContent sx={{ p: 0 }}>
          {filteredLogs.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <LogIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                No logs found
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {logs.length === 0 
                  ? 'No log entries available. Logs will appear here as the VPN operates.'
                  : 'No logs match your current filter criteria.'
                }
              </Typography>
            </Box>
          ) : (
            <List sx={{ maxHeight: 600, overflow: 'auto' }}>
              {filteredLogs.map((log, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                      {getLogIcon(log.level)}
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip
                            label={log.level.toUpperCase()}
                            size="small"
                            color={getLogColor(log.level) as any}
                            variant="outlined"
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {formatTimestamp(log.timestamp)}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            wordBreak: 'break-word',
                            fontFamily: 'monospace',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                            padding: 1,
                            borderRadius: 1,
                          }}
                        >
                          {log.message}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < filteredLogs.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Logs;