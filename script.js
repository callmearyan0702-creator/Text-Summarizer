const textInput    = document.getElementById('text-input');
const wordCountEl  = document.getElementById('word-count');
const summarizeBtn = document.getElementById('summarize-btn');
const loadingEl    = document.getElementById('loading');
const resultEl     = document.getElementById('result-section');
const errorWrapper = document.getElementById('error-wrapper');
const errorBox     = document.getElementById('error-box');
const summaryOut   = document.getElementById('summary-output');
const copyBtn      = document.getElementById('copy-btn');

let selectedLength = 'medium';

// ── Word counter ──
textInput.addEventListener('input', () => {
  const words = textInput.value.trim().split(/\s+/).filter(Boolean).length;
  wordCountEl.textContent = words;
});

// ── Length selector ──
document.querySelectorAll('.length-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.length-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedLength = btn.dataset.val;
  });
});

// ── Summarize ──
summarizeBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if (!text) { showError('Please paste some text first.'); return; }

  setLoading(true);
  hideError();
  resultEl.classList.remove('show');

  try {
    const res = await fetch('/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, length: selectedLength })
    });
    const data = await res.json();

    if (!res.ok || data.error) showError(data.error || 'Something went wrong.');
    else showResult(data);

  } catch (e) {
    showError('Network error. Is the Flask server running?');
  } finally {
    setLoading(false);
  }
});

// ── Copy ──
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(summaryOut.textContent).then(() => {
    copyBtn.textContent = 'Copied!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'Copy summary';
      copyBtn.classList.remove('copied');
    }, 2000);
  });
});

// ── Helpers ──
function setLoading(on) {
  summarizeBtn.disabled = on;
  loadingEl.classList.toggle('show', on);
  summarizeBtn.textContent = on ? 'Processing...' : 'Distill it →';
}

function showError(msg) {
  errorBox.textContent = msg;
  errorWrapper.style.display = 'block';
}

function hideError() {
  errorWrapper.style.display = 'none';
}

function showResult(data) {
  document.getElementById('stat-original').textContent  = data.stats.original_words;
  document.getElementById('stat-summary').textContent   = data.stats.summary_words;
  document.getElementById('stat-reduction').textContent = data.stats.reduction + '%';
  summaryOut.textContent = data.summary;
  resultEl.classList.add('show');
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
