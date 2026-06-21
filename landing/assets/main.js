const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

const burger = document.getElementById('burger');
const drawer = document.getElementById('drawer');
burger.addEventListener('click', () => drawer.classList.toggle('open'));
drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => drawer.classList.remove('open')));

document.getElementById('contactForm').addEventListener('submit', e => {
  e.preventDefault();
  const ok = document.getElementById('formOk');
  ok.classList.add('show');
  e.target.querySelectorAll('input,select,textarea,button').forEach(el => el.disabled = true);
  ok.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.feat-card, .step-item, .before-block, .pricing-box').forEach(el => {
  el.classList.add('anim');
  io.observe(el);
});
