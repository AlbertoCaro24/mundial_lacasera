document.getElementById("btnComprobar").addEventListener("click", () => {
  const codigo = document.getElementById("codigo").value;
  const mensaje = document.getElementById("mensaje");

  fetch("https://lacasera-backend.onrender.com/validar-codigo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ codigo })
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
