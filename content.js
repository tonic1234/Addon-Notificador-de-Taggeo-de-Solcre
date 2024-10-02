// content.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "play_sound") {
    playNotificationSound();
  }
});

function playNotificationSound() {
  const audio = new Audio(chrome.runtime.getURL('notification.mp3'));
  audio.play().catch((error) => {
    console.error("Error al reproducir el sonido de notificación:", error);
  });
}

// Detectar actividad del usuario y enviar mensajes al background script
let lastActivityTime = Date.now();

function detectActivity() {
  chrome.runtime.sendMessage({ action: "activity_detected" });
  lastActivityTime = Date.now();
}

// Detectar movimientos del ratón, teclas y scroll
document.addEventListener('mousemove', detectActivity);
document.addEventListener('keydown', detectActivity);
document.addEventListener('scroll', detectActivity);

// Periodicamente verificar y reportar actividad
setInterval(() => {
  if (Date.now() - lastActivityTime < 1000) { // Si hubo actividad en el último segundo
    chrome.runtime.sendMessage({ action: "activity_detected" });
  }
}, 1000);
