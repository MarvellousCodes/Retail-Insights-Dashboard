// Toggle password visibility
const togglePw = document.getElementById('togglePw');
const pwInput = document.getElementById('password');

togglePw.addEventListener('click', () => {
  const show = pwInput.type === 'password';
  pwInput.type = show ? 'text' : 'password';
  document.getElementById('eyeIcon').style.opacity = show ? '0.4' : '1';
});

// Sign in form
document.getElementById('signinForm').addEventListener('submit', e => {
  e.preventDefault();
  const btn = document.getElementById('signinBtn');
  const btnText = document.getElementById('btnText');
  const spinner = document.getElementById('btnSpinner');
  const error = document.getElementById('formError');

  error.classList.remove('show');
  btn.disabled = true;
  btnText.style.display = 'none';
  spinner.style.display = 'block';

  // Internal use only — any credentials open Patrick's live dashboard
  setTimeout(() => { window.location.href = 'app.html'; }, 600);
});

// Clear error on input change
document.getElementById('email').addEventListener('input', () => {
  document.getElementById('formError').classList.remove('show');
});
document.getElementById('password').addEventListener('input', () => {
  document.getElementById('formError').classList.remove('show');
});
