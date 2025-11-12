import { writable, get } from 'svelte/store';
import { auth } from '../stores/auth.js';
import { data } from '../stores/data.js';
import { ui, addNotification } from '../stores/ui.js';

// Import both notification services
import { 
  initializeNotifications as initializeSSENotifications,
  disconnectFromAllStreams as disconnectSSE,
  getSoundNeedsActivation as getSSESoundNeeds,
  getConnectionStatus as getSSEConnectionStatus,
  NOTIFICATION_TYPES as SSE_TYPES
} from './useNotifications.js';

import {
  initializeWebSocketNotifications as initializeWSNotifications,
  disconnectFromWebSocket,
  getWebSocketSoundNeedsActivation as getWSSoundNeeds,
  getWebSocketConnectionStatus as getWSConnectionStatus,
  NOTIFICATION_TYPES as WS_TYPES
} from './useWebSocketNotifications.js';

// Unified notification service configuration
export const NOTIFICATION_CONFIG = writable({
  mode: 'websocket', // 'sse' or 'websocket'
  autoFallback: true, // Auto fallback to SSE if WebSocket fails
  reconnectAttempts: 3,
  reconnectDelay: 5000
});

// Unified notification service store
export const unifiedNotificationService = writable({
  isConnected: false,
  connection: null,
  type: null,
  isReconnecting: false,
  mode: 'websocket',
  currentService: null,
  fallbackAttempted: false,
  connectionStats: {
    connectTime: null,
    reconnectAttempts: 0,
    totalMessages: 0
  }
});

// Notification types (unified)
export const NOTIFICATION_TYPES = {
  INSPECTION: 'inspection',
  DATA_UPDATE: 'data-update',
  SOAT_RUNT: 'soat-runt',
  OIL_CHANGE: 'oil-change'
};

// Service registry
const SERVICES = {
  sse: {
    initialize: initializeSSENotifications,
    disconnect: disconnectSSE,
    getSoundNeeds: getSSESoundNeeds,
    getConnectionStatus: getSSEConnectionStatus,
    name: 'SSE'
  },
  websocket: {
    initialize: initializeWSNotifications,
    disconnect: disconnectFromWebSocket,
    getSoundNeeds: getWSSoundNeeds,
    getConnectionStatus: getWSConnectionStatus,
    name: 'WebSocket'
  }
};

// Initialize unified notifications
export function initializeNotifications(options = {}) {
  const config = get(NOTIFICATION_CONFIG);
  const timestamp = new Date().toLocaleTimeString();
  
  console.log(`🚀 [UNIFIED] === INICIALIZACIÓN UNIFICADA DE NOTIFICACIONES === ${timestamp}`);
  console.log(`🚀 [UNIFIED] Modo configurado: ${config.mode}`);
  console.log(`🚀 [UNIFIED] Auto fallback: ${config.autoFallback ? 'HABILITADO' : 'DESHABILITADO'}`);
  console.log(`🚀 [UNIFIED] Opciones adicionales:`, options);
  
  // Determine which service to use
  let targetMode = options.mode || config.mode;
  console.log(`🎯 [UNIFIED] Modo objetivo: ${targetMode}`);
  
  // Validate authentication
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.warn("❌ [UNIFIED] No se puede inicializar: falta el token de autenticación.");
    return;
  }
  
  // Initialize with selected mode
  initializeWithMode(targetMode, options);
}

// Initialize notifications with specific mode
function initializeWithMode(mode, options = {}) {
  const service = SERVICES[mode];
  
  if (!service) {
    console.error(`❌ [UNIFIED] Modo no soportado: ${mode}`);
    if (options.fallback !== false) {
      console.log("🔄 [UNIFIED] Intentando fallback a SSE...");
      fallbackToSSE(options);
    }
    return;
  }
  
  console.log(`🚀 [UNIFIED] Inicializando servicio ${service.name}...`);
  
  try {
    // Initialize the service
    service.initialize();
    
    // Update unified store
    updateUnifiedStore({
      isConnected: true,
      mode: mode,
      currentService: service,
      fallbackAttempted: false,
      connectionStats: {
        ...get(unifiedNotificationService).connectionStats,
        connectTime: new Date().toISOString()
      }
    });
    
    console.log(`✅ [UNIFIED] Servicio ${service.name} inicializado exitosamente.`);
    
    // Monitor connection status
    monitorConnectionStatus(service, mode);
    
  } catch (error) {
    console.error(`❌ [UNIFIED] Error inicializando ${service.name}:`, error);
    handleServiceError(service, mode, options);
  }
}

// Monitor connection status of active service
function monitorConnectionStatus(service, mode) {
  console.log(`👁️ [UNIFIED] Monitoreando estado de conexión para ${service.name}...`);
  
  // Check connection status periodically
  const checkInterval = setInterval(() => {
    const currentService = get(unifiedNotificationService).currentService;
    
    if (currentService !== service) {
      clearInterval(checkInterval);
      return;
    }
    
    try {
      const connectionStatus = service.getConnectionStatus();
      const isConnected = get(connectionStatus).isConnected;
      
      updateUnifiedStore({
        isConnected: isConnected,
        lastStatusCheck: new Date().toISOString()
      });
      
      if (!isConnected) {
        console.warn(`⚠️ [UNIFIED] Servicio ${service.name} desconectado detectado.`);
        clearInterval(checkInterval);
        handleDisconnection(service, mode);
      }
      
    } catch (error) {
      console.error(`❌ [UNIFIED] Error verificando estado de ${service.name}:`, error);
    }
  }, 10000); // Check every 10 seconds
}

// Handle service disconnection
function handleDisconnection(service, mode) {
  console.log(`🔌 [UNIFIED] Servicio ${service.name} desconectado.`);
  
  const config = get(NOTIFICATION_CONFIG);
  
  if (mode === 'websocket' && config.autoFallback) {
    console.log("🔄 [UNIFIED] Intentando fallback a SSE debido a desconexión de WebSocket...");
    fallbackToSSE({ fallback: true });
  } else {
    console.log(`⚠️ [UNIFIED] Desconexión de ${service.name} - no se realizará fallback.`);
    updateUnifiedStore({
      isConnected: false,
      connectionStats: {
        ...get(unifiedNotificationService).connectionStats,
        reconnectAttempts: get(unifiedNotificationService).connectionStats.reconnectAttempts + 1
      }
    });
  }
}

// Handle service errors
function handleServiceError(service, mode, options = {}) {
  const config = get(NOTIFICATION_CONFIG);
  
  if (mode === 'websocket' && config.autoFallback && options.fallback !== false) {
    console.log("🔄 [UNIFIED] Error en WebSocket - intentando fallback a SSE...");
    fallbackToSSE({ fallback: true, reason: 'error' });
  } else {
    console.error(`❌ [UNIFIED] Error permanente en servicio ${service.name}.`);
    updateUnifiedStore({
      isConnected: false,
      connectionStats: {
        ...get(unifiedNotificationService).connectionStats,
        reconnectAttempts: get(unifiedNotificationService).connectionStats.reconnectAttempts + 1
      }
    });
  }
}

// Fallback to SSE
function fallbackToSSE(options = {}) {
  const currentState = get(unifiedNotificationService);
  
  if (currentState.fallbackAttempted) {
    console.warn("⚠️ [UNIFIED] Fallback ya intentado anteriormente - no se repetirá.");
    return;
  }
  
  console.log("🔄 [UNIFIED] === FALLBACK A SSE ===");
  console.log("🔄 [UNIFIED] Motivo:", options.reason || 'manual');
  
  updateUnifiedStore({
    mode: 'sse',
    fallbackAttempted: true,
    connectionStats: {
      ...currentState.connectionStats,
      reconnectAttempts: currentState.connectionStats.reconnectAttempts + 1
    }
  });
  
  // Initialize SSE service
  initializeWithMode('sse', { fallback: true });
}

// Update unified notification store
function updateUnifiedStore(updates) {
  unifiedNotificationService.update(state => ({
    ...state,
    ...updates
  }));
}

// Switch notification mode manually
export function switchNotificationMode(newMode) {
  const currentState = get(unifiedNotificationService);
  
  console.log(`🔄 [UNIFIED] Cambiando modo de ${currentState.mode} a ${newMode}...`);
  
  if (currentState.mode === newMode) {
    console.log("⚠️ [UNIFIED] Ya está en el modo solicitado.");
    return;
  }
  
  // Disconnect current service
  if (currentState.currentService) {
    console.log("🔌 [UNIFIED] Desconectando servicio actual...");
    currentState.currentService.disconnect();
  }
  
  // Update configuration
  NOTIFICATION_CONFIG.update(config => ({
    ...config,
    mode: newMode
  }));
  
  // Update store
  updateUnifiedStore({
    mode: newMode,
    currentService: null,
    isConnected: false,
    fallbackAttempted: false
  });
  
  // Initialize new service
  console.log(`🚀 [UNIFIED] Inicializando nuevo servicio ${SERVICES[newMode].name}...`);
  initializeWithMode(newMode);
}

// Disconnect from all services
export function disconnectFromAllStreams() {
  console.log("🔌 [UNIFIED] Desconectando de todos los servicios...");
  
  const currentState = get(unifiedNotificationService);
  
  // Disconnect current service
  if (currentState.currentService) {
    currentState.currentService.disconnect();
  }
  
  // Reset store
  unifiedNotificationService.set({
    isConnected: false,
    connection: null,
    type: null,
    isReconnecting: false,
    mode: get(NOTIFICATION_CONFIG).mode,
    currentService: null,
    fallbackAttempted: false,
    connectionStats: {
      connectTime: null,
      reconnectAttempts: 0,
      totalMessages: 0
    }
  });
  
  console.log("✅ [UNIFIED] Todos los servicios desconectados.");
}

// Get connection status (unified)
export function getConnectionStatus() {
  return unifiedNotificationService;
}

// Sound activation state store
export const unifiedSoundActivation = writable(true);

// Create a readable store for direct template usage
export const soundNeedsActivation = unifiedSoundActivation;

// Get sound activation status (unified)
export function getSoundNeedsActivation() {
  return unifiedSoundActivation;
}

// Set sound activation status (unified)
export function setSoundNeedsActivation(needsActivation) {
  unifiedSoundActivation.set(needsActivation);
  console.log(`🔊 [UNIFIED] Estado de activación de sonido actualizado: ${!needsActivation ? 'ACTIVADO' : 'REQUIERE ACTIVACIÓN'}`);
}

// Audio activation (unified)
export function activateSound() {
  console.log("🔊 [UNIFIED] Activando audio para servicio activo...");
  
  const state = get(unifiedNotificationService);
  
  if (state.mode === 'websocket') {
    // Use WebSocket audio functions
    import('./useWebSocketNotifications.js').then(({ activateSound: wsActivateSound }) => {
      wsActivateSound();
    }).catch(error => {
      console.error("❌ [UNIFIED] Error activando sonido WebSocket:", error);
    });
  } else {
    // Use SSE audio functions
    import('./useNotifications.js').then(({ activateSound: sseActivateSound }) => {
      sseActivateSound();
    }).catch(error => {
      console.error("❌ [UNIFIED] Error activando sonido SSE:", error);
    });
  }
}

// Notification playback (unified)
export function playNotificationSound() {
  console.log("🔊 [UNIFIED] Reproduciendo sonido para servicio activo...");
  
  const state = get(unifiedNotificationService);
  
  if (state.mode === 'websocket') {
    import('./useWebSocketNotifications.js').then(({ playNotificationSound: wsPlaySound }) => {
      wsPlaySound();
    }).catch(error => {
      console.error("❌ [UNIFIED] Error reproduciendo sonido WebSocket:", error);
    });
  } else {
    import('./useNotifications.js').then(({ playNotificationSound: ssePlaySound }) => {
      ssePlaySound();
    }).catch(error => {
      console.error("❌ [UNIFIED] Error reproduciendo sonido SSE:", error);
    });
  }
}

// Backward compatibility - only export types if they exist
export {
  NOTIFICATION_TYPES as SSE_NOTIFICATION_TYPES
} from './useNotifications.js';

// Additional utility functions
export function getActiveServiceInfo() {
  const state = get(unifiedNotificationService);
  return {
    mode: state.mode,
    isConnected: state.isConnected,
    serviceName: state.currentService?.name || 'None',
    fallbackAttempted: state.fallbackAttempted,
    stats: state.connectionStats
  };
}

export function forceReconnection() {
  console.log("🔄 [UNIFIED] Forzando reconexión...");
  
  const state = get(unifiedNotificationService);
  const config = get(NOTIFICATION_CONFIG);
  
  // Disconnect current service
  if (state.currentService) {
    state.currentService.disconnect();
  }
  
  // Reinitialize with current mode
  initializeWithMode(state.mode);
}

export function enableAutoFallback() {
  console.log("🔄 [UNIFIED] Habilitando auto-fallback...");
  NOTIFICATION_CONFIG.update(config => ({
    ...config,
    autoFallback: true
  }));
}

export function disableAutoFallback() {
  console.log("🔄 [UNIFIED] Deshabilitando auto-fallback...");
  NOTIFICATION_CONFIG.update(config => ({
    ...config,
    autoFallback: false
  }));
}