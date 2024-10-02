// options.js

// Guarda las opciones en chrome.storage
function saveOptions() {
  const notificationIntervalInput = document.getElementById('notificationInterval').value;
  const suppressionIntervalInput = document.getElementById('suppressionInterval').value;
  const isSoundEnabled = document.getElementById('soundEnabled').checked;
  const status = document.getElementById('status');

  const notificationInterval = parseInt(notificationIntervalInput, 10);
  const suppressionInterval = parseInt(suppressionIntervalInput, 10);

  // Validación de entrada
  if (isNaN(notificationInterval) || notificationInterval < 1 || notificationInterval > 60) {
    status.textContent = 'Por favor, ingresa un intervalo de notificaciones válido entre 1 y 60 minutos.';
    status.style.color = 'red';
    return;
  }

  if (isNaN(suppressionInterval) || suppressionInterval < 1 || suppressionInterval > 120) {
    status.textContent = 'Por favor, ingresa un tiempo de supresión válido entre 1 y 120 minutos.';
    status.style.color = 'red';
    return;
  }

  chrome.storage.sync.set({
    notificationInterval: notificationInterval,
    suppressionInterval: suppressionInterval,
    isSoundEnabled: isSoundEnabled
  }, () => {
    // Mostrar estado de guardado
    status.textContent = 'Opciones guardadas.';
    status.style.color = 'green';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
  });
}

// Restaura el estado de las opciones usando los valores almacenados en chrome.storage
function restoreOptions() {
  chrome.storage.sync.get({
    notificationInterval: 5,
    suppressionInterval: 30,
    isSoundEnabled: true
  }, (items) => {
    document.getElementById('notificationInterval').value = items.notificationInterval;
    document.getElementById('suppressionInterval').value = items.suppressionInterval;
    document.getElementById('soundEnabled').checked = items.isSoundEnabled;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
