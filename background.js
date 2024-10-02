// background.js

let notificationInterval = 5; // Intervalo por defecto en minutos
let suppressionInterval = 30; // Intervalo de supresión por defecto en minutos
let isSoundEnabled = true;
let suppressNotificationsUntil = 0;
let isNotificationActive = false;

// Cargar configuraciones del usuario al inicio
chrome.storage.sync.get(['notificationInterval', 'suppressionInterval', 'isSoundEnabled'], (result) => {
  notificationInterval = result.notificationInterval || 5;
  suppressionInterval = result.suppressionInterval || 30;
  isSoundEnabled = result.isSoundEnabled !== undefined ? result.isSoundEnabled : true;
  setupAlarm();
});

// Escuchar cambios en el almacenamiento
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.notificationInterval) {
    notificationInterval = changes.notificationInterval.newValue || 5;
    setupAlarm();
  }
  if (changes.suppressionInterval) {
    suppressionInterval = changes.suppressionInterval.newValue || 30;
  }
  if (changes.isSoundEnabled !== undefined) {
    isSoundEnabled = changes.isSoundEnabled.newValue;
  }
});

// Configurar alarma basada en el intervalo de notificaciones
function setupAlarm() {
  chrome.alarms.clear("checkActivity", () => {
    chrome.alarms.create("checkActivity", { periodInMinutes: notificationInterval });
  });
}

// Manejar alarmas
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkActivity") {
    chrome.storage.local.get(['suppressNotificationsUntil', 'isNotificationActive'], (data) => {
      const currentTime = Date.now();
      suppressNotificationsUntil = data.suppressNotificationsUntil || 0;
      isNotificationActive = data.isNotificationActive || false;

      if (currentTime >= suppressNotificationsUntil && !isNotificationActive) {
        showNotification();
      }
    });
  }
});

// Mostrar notificación
function showNotification() {
  isNotificationActive = true;
  chrome.storage.local.set({ isNotificationActive: true });

  chrome.notifications.create("taggeo_notification", {
    type: "basic",
    iconUrl: "icon48.png",
    title: "Notificador de Taggeo de Solcre",
    message: "¿Estás taggeando esta actividad?",
    buttons: [
      { title: "Sí" },
      { title: "No" }
    ],
    requireInteraction: true
  });

  if (isSoundEnabled) {
    // En Manifest V3, no se puede reproducir audio directamente en el service worker.
    // Se envía un mensaje a un content script para reproducir el sonido.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "play_sound" });
      }
    });
  }
}

// Manejar clics en los botones de la notificación
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === "taggeo_notification") {
    if (buttonIndex === 0) { // Botón "Sí"
      suppressNotifications();
      closeNotification();
    } else if (buttonIndex === 1) { // Botón "No"
      chrome.tabs.create({ url: "https://intranet.solcre.com/app/home" }, () => {
        suppressNotifications();
        closeNotification();
      });
    }
  }
});

// Manejar cierre de notificaciones (por ejemplo, al hacer clic en 'X')
chrome.notifications.onClosed.addListener((notificationId, byUser) => {
  if (notificationId === "taggeo_notification") {
    if (byUser) {
      suppressNotifications();
    }
    chrome.storage.local.set({ isNotificationActive: false });
  }
});

// Función para suprimir notificaciones durante el intervalo configurado
function suppressNotifications() {
  const suppressionUntil = Date.now() + suppressionInterval * 60 * 1000;
  chrome.storage.local.set({ suppressNotificationsUntil: suppressionUntil, isNotificationActive: false });
}

// Función para cerrar la notificación y resetear la bandera activa
function closeNotification() {
  chrome.notifications.clear("taggeo_notification", () => {
    chrome.storage.local.set({ isNotificationActive: false });
  });
}

// Función para abrir la página de opciones
function openOptionsPage() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
  }
}

// Escuchar mensajes de content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "notification_closed") {
    chrome.storage.local.set({ isNotificationActive: false });
  } else if (request.action === "activity_detected") {
    // Reiniciar el temporizador de supresión si hay actividad
    suppressNotificationsUntil = 0;
    chrome.storage.local.set({ suppressNotificationsUntil: 0 });
  }
});
