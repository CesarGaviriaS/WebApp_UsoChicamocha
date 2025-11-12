import { writable } from 'svelte/store';
import { get } from 'svelte/store';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { auth } from '../stores/auth.js';
import { data } from '../stores/data.js';
import { ui, addNotification, notificationMessages, notificationCount } from '../stores/ui.js';

// Notification types
export const NOTIFICATION_TYPES = {
  INSPECTION: 'inspection',
  DATA_UPDATE: 'data-update',
  SOAT_RUNT: 'soat-runt',
  OIL_CHANGE: 'oil-change'
};

// Notification service store
export const notificationService = writable({
  isConnected: false,
  connection: null,
  type: null,
  isReconnecting: false
});

// Active notification streams - PERSISTENT (never close)
let inspectionStream = null;
let dataUpdateStream = null;
let soatRuntStream = null;
let oilChangeStream = null;

// Base URL from environment
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Audio context for notification sounds
let audioCtx = null;
let soundNeedsActivation = true;

export function initializeNotifications() {
  const token = localStorage.getItem('accessToken');
  const timestamp = new Date().toLocaleTimeString();
  
  console.log(`🚀 [NOTIFICATIONS] === INICIO DE INICIALIZACIÓN INMEDIATA === ${timestamp}`);
  console.log(`🚀 [NOTIFICATIONS] Token disponible: ${token ? 'SÍ' : 'NO'}`);
  console.log(`🚀 [NOTIFICATIONS] Base URL disponible: ${BASE_URL ? 'SÍ' : 'NO'}`);
  console.log(`🚀 [NOTIFICATIONS] Auth state: ${get(auth).isAuthenticated ? 'AUTENTICADO' : 'NO AUTENTICADO'}`);
  console.log(`🚀 [NOTIFICATIONS] 🚨 CRÍTICO: STREAMS SE CONECTAN INMEDIATAMENTE - NO HAY RETRASOS`);
  
  if (!BASE_URL || !token) {
    console.warn("❌ [NOTIFICATIONS] No se puede inicializar notificaciones: falta la URL base o el token.");
    console.log("🔔 [NOTIFICATIONS] BASE_URL:", BASE_URL);
    console.log("🔔 [NOTIFICATIONS] token:", token ? "presente" : "ausente");
    return;
  }

  console.log("🚀 [NOTIFICATIONS] Conectando a todos los streams INMEDIATAMENTE...");
  connectToAllStreams(token);
  console.log("🚀 [NOTIFICATIONS] Activando sonido...");
  activateSound();
  console.log(`🚀 [NOTIFICATIONS] === INICIALIZACIÓN COMPLETA - STREAMS CONECTADOS ${timestamp} ===`);
}

function connectToAllStreams(token) {
  console.log("🚀 [NOTIFICATIONS] Iniciando conexiones de streams PERSISTENTES...");
  
  // Connect to inspection notifications
  console.log("🚀 [NOTIFICATIONS] → Conectando stream de INSPECCIONES (PERSISTENTE)...");
  connectInspectionStream(token);
  
  // Connect to data updates  
  console.log("🚀 [NOTIFICATIONS] → Conectando stream de ACTUALIZACIÓN DE DATOS (PERSISTENTE)...");
  connectDataUpdateStream(token);
  
  // Connect to SOAT/RUNT notifications
  console.log("🚀 [NOTIFICATIONS] → Conectando stream SOAT/RUNT (PERSISTENTE)...");
  connectSoatRuntStream(token);
  
  // Connect to oil change notifications
  console.log("🚀 [NOTIFICATIONS] → Conectando stream de CAMBIOS DE ACEITE (PERSISTENTE)...");
  connectOilChangeStream(token);
  
  console.log("🚀 [NOTIFICATIONS] Todas las conexiones de streams PERSISTENTES iniciadas.");
}

function connectInspectionStream(token) {
  const streamUrl = `${BASE_URL}/inspections/stream?token=${encodeURIComponent(token)}`;
  console.log("🔔 [INSPECTION] Creando EventSource PERSISTENTE para:", streamUrl);
  
  inspectionStream = new EventSourcePolyfill(streamUrl);
  
  inspectionStream.onopen = () => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`✅ [INSPECTION] Conectado al stream de inspecciones (PERSISTENTE). ${timestamp}`);
    console.log("🔔 [INSPECTION] 🚨 NOTIFICACIONES LISTAS PARA LLEGAR INMEDIATAMENTE");
    updateConnectionStatus(NOTIFICATION_TYPES.INSPECTION, true);
  };
  
  inspectionStream.onmessage = (event) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`📨 [INSPECTION] ⭐ NOTIFICACIÓN INMEDIATA EN ${timestamp} ⭐`);
    console.log(`📨 [INSPECTION] 🚨 RAW DATA:`, event.data);
    
    const message = event.data;
    if (message === 'stream_open') {
      console.log('✅ [INSPECTION] Notificaciones de inspecciones confirmadas.');
      return;
    }
    
    try {
      console.log("🔍 [INSPECTION] Procesando mensaje JSON...");
      const newInspection = JSON.parse(event.data);
      console.log("🔍 [INSPECTION] Inspection parseada:", newInspection);
      
      const machineInfo = newInspection.machine ? 
        `${newInspection.machine.name} ${newInspection.machine.model}` : 
        'una máquina';
      
      console.log(`🚨 [INSPECTION] ⚡ AGREGANDO NOTIFICACIÓN INMEDIATA: ${machineInfo}!`);

      addNotification({
        id: newInspection.UUID || Date.now(),
        text: `¡IMPREVISTO EN ${machineInfo}!`
      });

      console.log("🔊 [INSPECTION] Reproduciendo sonido...");
      playNotificationSound();

      // Auto-refresh dashboard if on inspection view
      const currentView = get(ui).currentView;
      console.log("🔄 [INSPECTION] Vista actual:", currentView);
      
      if (currentView === 'dashboard') {
        console.log("🔄 [INSPECTION] Actualizando dashboard...");
        const dataState = get(data);
        console.log("🔄 [INSPECTION] Estado de datos:", dataState.dashboard);
        data.fetchDashboardData(dataState.dashboard.currentPage, dataState.dashboard.pageSize);
      }
    } catch (e) {
      console.error("❌ [INSPECTION] Error procesando mensaje:", e.message);
      console.error("❌ [INSPECTION] Mensaje que causó error:", event.data);
    }
  };
  
  inspectionStream.onerror = (err) => {
    const timestamp = new Date().toLocaleTimeString();
    console.warn(`⚠️ [INSPECTION] Error temporal en ${timestamp} - STREAM MANTIENE CONEXIÓN`);
    console.log("⚠️ [INSPECTION] El stream continúa escuchando sin cerrar...");
    // NO SE CIERRA EL STREAM - SE MANTIENE ACTIVO
  };
}

function connectDataUpdateStream(token) {
  const streamUrl = `${BASE_URL}/new-data/notifications/stream?token=${encodeURIComponent(token)}`;
  console.log("🔔 [DATA_UPDATE] Creando EventSource PERSISTENTE para:", streamUrl);
  
  dataUpdateStream = new EventSourcePolyfill(streamUrl);
  
  dataUpdateStream.onopen = () => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`✅ [DATA_UPDATE] Conectado al stream de actualización de datos (PERSISTENTE). ${timestamp}`);
    updateConnectionStatus(NOTIFICATION_TYPES.DATA_UPDATE, true);
  };
  
  dataUpdateStream.onmessage = (event) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log("📨 [DATA_UPDATE] Mensaje recibido en", timestamp);
    console.log("📨 [DATA_UPDATE] Raw data:", event.data);
    
    const message = event.data;
    if (message === 'stream_open') {
      console.log('✅ [DATA_UPDATE] Notificaciones de actualización confirmadas.');
      return;
    }
    
    const currentView = get(ui).currentView;
    console.log(`🔄 [DATA_UPDATE] Mensaje: "${message}", Vista actual: "${currentView}"`);

    // Route data updates to appropriate refresh functions
    handleDataUpdate(currentView, message);
  };
  
  dataUpdateStream.onerror = (err) => {
    const timestamp = new Date().toLocaleTimeString();
    console.warn("⚠️ [DATA_UPDATE] Error temporal en stream en", timestamp, err);
    console.log("⚠️ [DATA_UPDATE] STREAM MANTIENE CONEXIÓN - NO SE CIERRA");
    // NO SE CIERRA EL STREAM - SE MANTIENE ACTIVO
  };
}

function connectSoatRuntStream(token) {
  const streamUrl = `${BASE_URL}/soat/runt/notifications/stream?token=${encodeURIComponent(token)}`;
  console.log("🔔 [SOAT_RUNT] Creando EventSource PERSISTENTE para:", streamUrl);
  
  soatRuntStream = new EventSourcePolyfill(streamUrl);
  
  soatRuntStream.onopen = () => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`✅ [SOAT_RUNT] Conectado al stream SOAT/RUNT (PERSISTENTE). ${timestamp}`);
    updateConnectionStatus(NOTIFICATION_TYPES.SOAT_RUNT, true);
  };
  
  soatRuntStream.onmessage = (event) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log("📨 [SOAT_RUNT] Mensaje recibido en", timestamp);
    console.log("📨 [SOAT_RUNT] Raw data:", event.data);
    
    const message = event.data;
    if (message === 'stream_open') {
      console.log('✅ [SOAT_RUNT] Notificaciones SOAT/RUNT confirmadas.');
      return;
    }
    
    try {
      console.log("🔍 [SOAT_RUNT] Procesando mensaje JSON...");
      const notificationData = JSON.parse(event.data);
      console.log("🔍 [SOAT_RUNT] Notification parseada:", notificationData);

      console.log("🔔 [SOAT_RUNT] Agregando notificación:", notificationData.message || 'Notificación SOAT/RUNT');
      
      addNotification({
        id: notificationData.id || Date.now(),
        text: notificationData.message || 'Notificación SOAT/RUNT'
      });
      // No sound for this stream
    } catch (e) {
      console.error("❌ [SOAT_RUNT] Error procesando mensaje:", e.message);
      console.error("❌ [SOAT_RUNT] Mensaje que causó error:", event.data);
    }
  };
  
  soatRuntStream.onerror = (err) => {
    const timestamp = new Date().toLocaleTimeString();
    console.warn("⚠️ [SOAT_RUNT] Error temporal en stream en", timestamp, err);
    console.log("⚠️ [SOAT_RUNT] STREAM MANTIENE CONEXIÓN - NO SE CIERRA");
    // NO SE CIERRA EL STREAM - SE MANTIENE ACTIVO
  };
}

function connectOilChangeStream(token) {
  const streamUrl = `${BASE_URL}/oil_change/notifications/stream?token=${encodeURIComponent(token)}`;
  console.log("🔔 [OIL_CHANGE] Creando EventSource PERSISTENTE para:", streamUrl);
  
  oilChangeStream = new EventSourcePolyfill(streamUrl);
  
  oilChangeStream.onopen = () => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`✅ [OIL_CHANGE] Conectado al stream de cambios de aceite (PERSISTENTE). ${timestamp}`);
    updateConnectionStatus(NOTIFICATION_TYPES.OIL_CHANGE, true);
  };
  
  oilChangeStream.onmessage = (event) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log("📨 [OIL_CHANGE] Mensaje recibido en", timestamp);
    console.log("📨 [OIL_CHANGE] Raw data:", event.data);
    
    const message = event.data;
    if (message === 'stream_open') {
      console.log('✅ [OIL_CHANGE] Notificaciones de cambios de aceite confirmadas.');
      return;
    }
    
    try {
      console.log("🔍 [OIL_CHANGE] Procesando mensaje JSON...");
      const notificationData = JSON.parse(event.data);
      console.log("🔍 [OIL_CHANGE] Notification parseada:", notificationData);

      console.log("🔔 [OIL_CHANGE] Agregando notificación:", notificationData.message || 'Notificación de cambio de aceite');
      
      addNotification({
        id: notificationData.id || Date.now(),
        text: notificationData.message || 'Notificación de cambio de aceite'
      });
      // No sound for this stream
    } catch (e) {
      console.error("❌ [OIL_CHANGE] Error procesando mensaje:", e.message);
      console.error("❌ [OIL_CHANGE] Mensaje que causó error:", event.data);
    }
  };
  
  oilChangeStream.onerror = (err) => {
    const timestamp = new Date().toLocaleTimeString();
    console.warn("⚠️ [OIL_CHANGE] Error temporal en stream en", timestamp, err);
    console.log("⚠️ [OIL_CHANGE] STREAM MANTIENE CONEXIÓN - NO SE CIERRA");
    // NO SE CIERRA EL STREAM - SE MANTIENE ACTIVO
  };
}

function handleDataUpdate(currentView, message) {
  console.log("🔄 [DATA_UPDATE] Manejando actualización para vista:", currentView, "mensaje:", message);
  
  const dataState = get(data);
  console.log("🔄 [DATA_UPDATE] Estado actual de datos:", {
    dashboard: dataState.dashboard?.currentPage,
    workOrders: dataState.workOrders?.currentPage
  });
  
  switch (message) {
    case 'inspections-updated':
      if (currentView === 'dashboard') {
        console.log('🔄 [DATA_UPDATE] Recargando tabla de inspecciones...');
        data.fetchDashboardData(dataState.dashboard.currentPage, dataState.dashboard.pageSize);
      }
      break;
    case 'machines-updated':
      if (currentView === 'machines') {
        console.log('🔄 [DATA_UPDATE] Recargando tabla de máquinas...');
        data.fetchMachines();
      }
      break;
    case 'users-updated':
      if (currentView === 'users') {
        console.log('🔄 [DATA_UPDATE] Recargando tabla de usuarios...');
        data.fetchUsers();
      }
      break;
    case 'orders-updated':
      if (currentView === 'work-orders') {
        console.log('🔄 [DATA_UPDATE] Recargando tabla de órdenes de trabajo...');
        data.fetchWorkOrders(dataState.workOrders.currentPage, dataState.workOrders.pageSize);
      }
      break;
    case 'oil-changes-updated':
      if (currentView === 'consolidado') {
        console.log('🔄 [DATA_UPDATE] Recargando tabla de consolidado...');
        data.fetchConsolidadoData();
      }
      break;
    default:
      console.log("⚠️ [DATA_UPDATE] Mensaje no reconocido:", message);
  }
}

// ELIMINADO: handleStreamError - los streams NUNCA se cierran
// ELIMINADO: reconnectStream - los streams NUNCA se reconectan

function updateConnectionStatus(type, isConnected, isReconnecting = false) {
  console.log(`📊 [CONNECTION] Estado actualizado - Tipo: ${type}, Conectado: ${isConnected}, Reconectando: ${isReconnecting}`);
  
  notificationService.update(state => ({
    ...state,
    isConnected: isConnected || state.isConnected,
    type: isConnected ? type : state.type,
    isReconnecting: false // SIEMPRE false - no hay reconexión
  }));
}

// MODIFICADO: disconnectFromAllStreams - SOLO cuando el usuario hace logout explícitamente
export function disconnectFromAllStreams() {
  console.log("🔌 [DISCONNECT] LOGOUT - Cerrando todos los streams (solo en logout)...");
  
  [inspectionStream, dataUpdateStream, soatRuntStream, oilChangeStream].forEach((stream, index) => {
    if (stream) {
      console.log("🔌 [DISCONNECT] Cerrando stream:", index, "por logout");
      stream.close();
      stream = null;
    }
  });
  
  notificationService.set({
    isConnected: false,
    connection: null,
    type: null,
    isReconnecting: false
  });
  
  console.log("🔌 [DISCONNECT] Todos los streams cerrados por logout.");
}

// Audio functions
export function activateSound() {
  console.log("🔊 [AUDIO] Activando contexto de audio...");
  
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      soundNeedsActivation = false;
      console.log("🔊 [AUDIO] Contexto de audio activado exitosamente.");
    } catch(e) {
      console.error("❌ [AUDIO] Web Audio API no es soportada:", e.message);
      soundNeedsActivation = false;
    }
  } else {
    console.log("🔊 [AUDIO] Contexto de audio ya existía, activándolo...");
    soundNeedsActivation = false;
  }
}

export function playNotificationSound() {
  console.log("🔊 [AUDIO] Reproduciendo sonido SSE LIMPIO Y PROFESIONAL...");
  
  if (!audioCtx) {
    console.warn("⚠️ [AUDIO] El audio debe ser activado por un gesto del usuario.");
    return;
  }
  if (audioCtx.state === "suspended") {
    console.log("🔊 [AUDIO] Reanudando contexto de audio...");
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  const duration = 0.8; // Sonido corto y limpio: 0.8 segundos

  // Usar solo 2-3 osciladores de alta calidad con mayor volumen
  const oscillators = [
    { type: "sine", freq: 1200, volume: 0.9 },
    { type: "sine", freq: 1800, volume: 0.7 },
    { type: "triangle", freq: 2400, volume: 0.5 }
  ];

  oscillators.forEach((oscConfig, index) => {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = oscConfig.type;
    oscillator.frequency.setValueAtTime(oscConfig.freq, now);

    // Envolvente suave y profesional
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(oscConfig.volume, now + 0.05); // Ataque suave
    gainNode.gain.setValueAtTime(oscConfig.volume * 0.8, now + duration * 0.7); // Sostenimiento
    gainNode.gain.linearRampToValueAtTime(0, now + duration); // Decay limpio
    
    console.log(`🔊 [AUDIO] Sonido SSE ${index + 1} (${oscConfig.type}, ${oscConfig.freq}Hz).`);
    
    oscillator.start(now);
    oscillator.stop(now + duration);
  });

  // Añadir un segundo beep más corto para más impacto
  setTimeout(() => {
    const now2 = audioCtx.currentTime;
    const duration2 = 0.3;
    
    const oscillator2 = audioCtx.createOscillator();
    const gainNode2 = audioCtx.createGain();

    oscillator2.connect(gainNode2);
    gainNode2.connect(audioCtx.destination);

    oscillator2.type = "sine";
    oscillator2.frequency.setValueAtTime(2000, now2);
    oscillator2.frequency.linearRampToValueAtTime(1500, now2 + duration2);

    gainNode2.gain.setValueAtTime(0, now2);
    gainNode2.gain.linearRampToValueAtTime(0.8, now2 + 0.02);
    gainNode2.gain.linearRampToValueAtTime(0, now2 + duration2);
    
    console.log(`🔊 [AUDIO] Sonido SSE beep adicional (2000-1500Hz).`);
    
    oscillator2.start(now2);
    oscillator2.stop(now2 + duration2);
  }, 100);
  
  console.log("🔊 [AUDIO] Sonido SSE LIMPIO Y PROFESIONAL: 0.8s + 0.3s beep.");
}

export function getSoundNeedsActivation() {
  console.log("🔊 [AUDIO] Estado de activación:", soundNeedsActivation);
  return soundNeedsActivation;
}

export function getConnectionStatus() {
  const status = notificationService;
  console.log("📊 [STATUS] Obteniendo estado de conexión...");
  return status;
}