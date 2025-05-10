// Archivo preload.js
// Este archivo se ejecuta en el proceso de renderizado antes de que se cargue la página web
// y tiene acceso al contexto de Node.js

// Todas las APIs de Node.js están disponibles en el proceso de preload.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
}) 