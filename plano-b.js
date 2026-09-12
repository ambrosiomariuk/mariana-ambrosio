// Interatividade da Landing Page - Fórmula do Plano B!

document.addEventListener('DOMContentLoaded', () => {
  initModulesAccordion();
  initFaqAccordion();
  initCountdown();
});

// --- Accordion de Módulos ---
function initModulesAccordion() {
  const headers = document.querySelectorAll('.module-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isActive = item.classList.contains('active');
      
      // Fecha outros se desejar ou permite múltiplos abertos
      item.classList.toggle('active');
    });
  });
}

// --- Accordion de FAQ ---
function initFaqAccordion() {
  const questions = document.querySelectorAll('.faq-question');
  questions.forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      item.classList.toggle('active');
    });
  });
}

// --- Contador Regressivo da Oferta ---
function initCountdown() {
  const countdownEl = document.getElementById('offerCountdown');
  if (!countdownEl) return;

  // Contador de 3 horas renovável para urgência
  let duration = 3 * 60 * 60 + 47 * 60 + 15; // 3h 47m 15s

  function updateTimer() {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    countdownEl.textContent = 
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    if (duration > 0) {
      duration--;
    } else {
      duration = 4 * 3600; // reinicia
    }
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}
