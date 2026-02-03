document.getElementById("btnComprobar").addEventListener("click", () => {
  const codigo = document.getElementById("codigo").value;
  const mensaje = document.getElementById("mensaje");

  const API_BASE = window.__API_BASE__ || '';
  fetch(`${API_BASE}/api/check-code`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ code: codigo })
  })
  .then(res => res.json())
  .then(data => {
    if (data.error) {
      mensaje.textContent = data.error;
      mensaje.style.color = "red";
    } else if (data.ganador) {
      mensaje.textContent = "¡ENHORABUENA! Código premiado 🎉";
      mensaje.style.color = "green";
    } else {
      mensaje.textContent = "Lo sentimos, no ha habido premio 😢";
      mensaje.style.color = "orange";
    }
  })
  .catch(() => {
    mensaje.textContent = "Error de conexión con el servidor";
  });
});
