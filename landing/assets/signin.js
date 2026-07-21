// RetailGuard sign-in: authenticates against /api/login and stores the signed
// token so the dashboard (app.html) can call the now-protected API.
const togglePw = document.getElementById('togglePw');
const pwInput = document.getElementById('password');

togglePw.addEventListener('click', () => {
  const show = pwInput.type === 'password';
  pwInput.type = show ? 'text' : 'password';
  document.getElementById('eyeIcon').style.opacity = show ? '0.4' : '1';
});

document.getElementById('signinForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('signinBtn');
  const btnText = document.getElementById('btnText');
  const spinner = document.getElementById('btnSpinner');
  const error = document.getElementById('formError');
  const pw = document.getElementById('password').value;

  error.classList.remove('show');
  btn.disabled = true;
  btnText.style.display = 'none';
  spinner.style.display = 'block';

  try {
    const typed = (document.getElementById('email').value || '').trim();
    // Try the typed username first (supports the demo account). If that is not
    // a known account, fall back to the main account so typing an email
    // address still signs Patrick in as before.
    const attempt = async (username) => {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username, password: pw }),
      });
      const data = await res.json().catch(() => ({}));
      return { res, data };
    };
    let { res, data } = await attempt(typed || 'patrick');
    if (!(res.ok && data.ok) && typed && typed.toLowerCase() !== 'patrick' && res.status !== 429) {
      ({ res, data } = await attempt('patrick'));
    }
    if (res.ok && data.ok && data.token) {
      localStorage.setItem('rg-token', data.token);
      localStorage.setItem('rg-user', data.name || 'Patrick');
      window.location.href = 'app.html';
      return;
    }
    error.textContent = res.status === 429
      ? (data.error || 'Too many attempts. Please wait a minute.')
      : 'Incorrect password. Please try again.';
    error.classList.add('show');
  } catch (_) {
    error.textContent = 'Could not reach the server. Please try again.';
    error.classList.add('show');
  }
  btn.disabled = false;
  btnText.style.display = '';
  spinner.style.display = 'none';
});

document.getElementById('email').addEventListener('input', () => {
  document.getElementById('formError').classList.remove('show');
});
document.getElementById('password').addEventListener('input', () => {
  document.getElementById('formError').classList.remove('show');
});
