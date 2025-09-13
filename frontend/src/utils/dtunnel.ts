// DTunnel API Integration Layer for MISTERVPN
// Provides type-safe interfaces for all DTunnel APIs with error handling

export interface VpnState {
  connected: boolean;
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  serverInfo?: string;
  duration?: number;
}

export interface VpnConfig {
  id: string;
  name: string;
  server: string;
  port: number;
  protocol: string;
  flag?: string;
  ping?: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface NetworkInfo {
  localIP: string;
  networkName: string;
}

export interface SystemInfo {
  appVersion: string;
  configVersion: string;
  statusBarHeight: number;
  navigationBarHeight: number;
}

export interface HotspotStatus {
  enabled: boolean;
  clients: number;
}

// Helper function to safely execute DTunnel API calls
async function safeDtCall<T>(
  apiCall: () => Promise<T>,
  defaultValue: T,
  errorMessage: string
): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`DTunnel API Error: ${errorMessage}`, error);
    // Trigger error listener if available
    if (window.dtMessageErrorListener) {
      window.dtMessageErrorListener({ error: errorMessage, details: error });
    }
    return defaultValue;
  }
}

// Status & Information APIs
export async function getSystemInfo(): Promise<SystemInfo> {
  const statusBarHeight = await safeDtCall(
    () => window.DtGetStatusBarHeight?.execute() || Promise.resolve(0),
    0,
    'Failed to get status bar height'
  );

  const navigationBarHeight = await safeDtCall(
    () => window.DtGetNavigationBarHeight?.execute() || Promise.resolve(0),
    0,
    'Failed to get navigation bar height'
  );

  const appVersion = await safeDtCall(
    () => window.DtAppVersion?.execute() || Promise.resolve('1.0.0'),
    '1.0.0',
    'Failed to get app version'
  );

  const configVersion = await safeDtCall(
    () => window.DtGetLocalConfigVersion?.execute() || Promise.resolve('1.0.0'),
    '1.0.0',
    'Failed to get config version'
  );

  return {
    statusBarHeight,
    navigationBarHeight,
    appVersion,
    configVersion
  };
}

export async function getNetworkInfo(): Promise<NetworkInfo> {
  const localIP = await safeDtCall(
    () => window.DtGetLocalIP?.execute() || Promise.resolve('127.0.0.1'),
    '127.0.0.1',
    'Failed to get local IP'
  );

  const networkName = await safeDtCall(
    () => Promise.resolve(window.DtGetNetworkName?.() || 'Unknown Network'),
    'Unknown Network',
    'Failed to get network name'
  );

  return { localIP, networkName };
}

// VPN APIs
export async function getVpnState(): Promise<VpnState> {
  const status = await safeDtCall(
    () => window.DtGetVpnState?.execute() || Promise.resolve('disconnected'),
    'disconnected',
    'Failed to get VPN state'
  );

  return {
    connected: status === 'connected',
    status: status as VpnState['status']
  };
}

export async function startVpn(): Promise<boolean> {
  return await safeDtCall(
    () => window.DtExecuteVpnStart?.execute() || Promise.resolve(false),
    false,
    'Failed to start VPN'
  );
}

export async function stopVpn(): Promise<boolean> {
  return await safeDtCall(
    () => window.DtExecuteVpnStop?.execute() || Promise.resolve(false),
    false,
    'Failed to stop VPN'
  );
}

export async function getVpnConfigs(): Promise<VpnConfig[]> {
  const configs = await safeDtCall(
    () => window.DtGetConfigs?.execute() || Promise.resolve([]),
    [],
    'Failed to get VPN configs'
  );

  return configs.map((config: any) => ({
    id: config.id || Math.random().toString(),
    name: config.name || 'Unknown Server',
    server: config.server || 'unknown.server.com',
    port: config.port || 443,
    protocol: config.protocol || 'TCP',
    flag: config.flag,
    ping: config.ping
  }));
}

export async function setVpnConfig(configId: string): Promise<boolean> {
  return await safeDtCall(
    () => window.DtSetConfig?.execute(configId) || Promise.resolve(false),
    false,
    'Failed to set VPN config'
  );
}

export async function getDefaultConfig(): Promise<VpnConfig | null> {
  const config = await safeDtCall(
    () => window.DtGetDefaultConfig?.execute() || Promise.resolve(null),
    null,
    'Failed to get default config'
  );

  if (!config) return null;

  return {
    id: config.id || Math.random().toString(),
    name: config.name || 'Default Server',
    server: config.server || 'default.server.com',
    port: config.port || 443,
    protocol: config.protocol || 'TCP',
    flag: config.flag,
    ping: config.ping
  };
}

// Authentication APIs
export function getUsername(): string {
  try {
    return window.DtUsername?.get() || '';
  } catch (error) {
    console.error('Failed to get username', error);
    return '';
  }
}

export function setUsername(username: string): void {
  try {
    window.DtUsername?.set(username);
  } catch (error) {
    console.error('Failed to set username', error);
  }
}

export function getPassword(): string {
  try {
    return window.DtPassword?.get() || '';
  } catch (error) {
    console.error('Failed to get password', error);
    return '';
  }
}

export function setPassword(password: string): void {
  try {
    window.DtPassword?.set(password);
  } catch (error) {
    console.error('Failed to set password', error);
  }
}

export function getUuid(): string {
  try {
    return window.DtUuid?.get() || '';
  } catch (error) {
    console.error('Failed to get UUID', error);
    return '';
  }
}

export function setUuid(uuid: string): void {
  try {
    window.DtUuid?.set(uuid);
  } catch (error) {
    console.error('Failed to set UUID', error);
  }
}

// Log APIs
export async function getLogs(): Promise<LogEntry[]> {
  const logs = await safeDtCall(
    () => window.DtGetLogs?.execute() || Promise.resolve([]),
    [],
    'Failed to get logs'
  );

  return logs.map((log: any) => ({
    timestamp: log.timestamp || new Date().toISOString(),
    level: log.level || 'info',
    message: log.message || 'No message'
  }));
}

export async function clearLogs(): Promise<boolean> {
  return await safeDtCall(
    () => window.DtClearLogs?.execute() || Promise.resolve(false),
    false,
    'Failed to clear logs'
  );
}

// System APIs
export async function startAppUpdate(): Promise<boolean> {
  return await safeDtCall(
    () => window.DtStartAppUpdate?.execute() || Promise.resolve(false),
    false,
    'Failed to start app update'
  );
}

export async function startApnActivity(): Promise<boolean> {
  return await safeDtCall(
    () => window.DtStartApnActivity?.execute() || Promise.resolve(false),
    false,
    'Failed to start APN activity'
  );
}

export async function ignoreBatteryOptimizations(): Promise<boolean> {
  return await safeDtCall(
    () => window.DtIgnoreBatteryOptimizations?.execute() || Promise.resolve(false),
    false,
    'Failed to ignore battery optimizations'
  );
}

export async function cleanApp(): Promise<boolean> {
  return await safeDtCall(
    () => window.DtCleanApp?.execute() || Promise.resolve(false),
    false,
    'Failed to clean app'
  );
}

// Hotspot APIs
export async function getHotspotStatus(): Promise<HotspotStatus> {
  const enabled = await safeDtCall(
    () => window.DtGetStatusHotSpotService?.execute() || Promise.resolve(false),
    false,
    'Failed to get hotspot status'
  );

  return { enabled, clients: 0 };
}

export async function startHotspot(): Promise<boolean> {
  return await safeDtCall(
    () => window.DtStartHotSpotService?.execute() || Promise.resolve(false),
    false,
    'Failed to start hotspot'
  );
}

export async function stopHotspot(): Promise<boolean> {
  return await safeDtCall(
    () => window.DtStopHotSpotService?.execute() || Promise.resolve(false),
    false,
    'Failed to stop hotspot'
  );
}

// Translation API
export async function translateText(text: string): Promise<string> {
  return await safeDtCall(
    () => window.DtTranslateText?.execute(text) || Promise.resolve(text),
    text,
    'Failed to translate text'
  );
}

// Event Listeners Setup
export function setupEventListeners(callbacks: {
  onVpnStateChange?: (state: string) => void;
  onNewLog?: () => void;
  onConfigClick?: () => void;
  onUserModelCheck?: (model: any) => void;
  onUserStarted?: () => void;
  onError?: (error: any) => void;
}) {
  if (callbacks.onVpnStateChange && window.dtVpnStateListener) {
    window.dtVpnStateListener = callbacks.onVpnStateChange;
  }

  if (callbacks.onNewLog && window.dtOnNewLogListener) {
    window.dtOnNewLogListener = callbacks.onNewLog;
  }

  if (callbacks.onConfigClick && window.dtConfigClickListener) {
    window.dtConfigClickListener = callbacks.onConfigClick;
  }

  if (callbacks.onUserModelCheck && window.dtCheckUserModelListener) {
    window.dtCheckUserModelListener = callbacks.onUserModelCheck;
  }

  if (callbacks.onUserStarted && window.dtCheckUserStartedListener) {
    window.dtCheckUserStartedListener = callbacks.onUserStarted;
  }

  if (callbacks.onError && window.dtMessageErrorListener) {
    window.dtMessageErrorListener = callbacks.onError;
  }
}

// TypeScript declarations for DTunnel globals
declare global {
  interface Window {
    DtGetStatusBarHeight?: { execute: () => Promise<number> };
    DtGetNavigationBarHeight?: { execute: () => Promise<number> };
    DtGetVpnState?: { execute: () => Promise<string> };
    DtGetLocalIP?: { execute: () => Promise<string> };
    DtGetNetworkName?: () => string;
    DtGetLocalConfigVersion?: { execute: () => Promise<string> };
    DtAppVersion?: { execute: () => Promise<string> };
    DtExecuteVpnStart?: { execute: () => Promise<boolean> };
    DtExecuteVpnStop?: { execute: () => Promise<boolean> };
    DtGetConfigs?: { execute: () => Promise<any[]> };
    DtSetConfig?: { execute: (id: string) => Promise<boolean> };
    DtGetDefaultConfig?: { execute: () => Promise<any> };
    DtUsername?: { get: () => string; set: (value: string) => void };
    DtPassword?: { get: () => string; set: (value: string) => void };
    DtUuid?: { get: () => string; set: (value: string) => void };
    DtGetLogs?: { execute: () => Promise<any[]> };
    DtClearLogs?: { execute: () => Promise<boolean> };
    DtStartAppUpdate?: { execute: () => Promise<boolean> };
    DtStartApnActivity?: { execute: () => Promise<boolean> };
    DtIgnoreBatteryOptimizations?: { execute: () => Promise<boolean> };
    DtCleanApp?: { execute: () => Promise<boolean> };
    DtGetStatusHotSpotService?: { execute: () => Promise<boolean> };
    DtStartHotSpotService?: { execute: () => Promise<boolean> };
    DtStopHotSpotService?: { execute: () => Promise<boolean> };
    DtTranslateText?: { execute: (text: string) => Promise<string> };
    dtVpnStateListener?: (state: string) => void;
    dtOnNewLogListener?: () => void;
    dtConfigClickListener?: () => void;
    dtCheckUserModelListener?: (model: any) => void;
    dtCheckUserStartedListener?: () => void;
    dtMessageErrorListener?: (error: any) => void;
  }
}