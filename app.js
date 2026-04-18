// L'Afrique Medical Alert — App JavaScript

// Supabase Initialization
const supabaseUrl = 'https://qcmbsyeppmuhsdlirqna.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbWJzeWVwcG11aHNkbGlycW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NTUwMTEsImV4cCI6MjA5MjEzMTAxMX0.SZbKmSSNGHuoGKeQ7A0_c0FSpYmd239oKvll0s0K4qI';
const _supabase = (typeof window.supabase !== 'undefined') 
  ? window.supabase.createClient(supabaseUrl, supabaseKey) 
  : null;

// Dark/Light Theme Toggle
(function () {
  const toggles = document.querySelectorAll('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);

  function updateIcons() {
    toggles.forEach(t => {
      t.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
      t.innerHTML = theme === 'dark'
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    });
  }

  updateIcons();

  toggles.forEach(t => {
    t.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      updateIcons();
    });
  });
})();

// Mobile Navigation Toggle
(function () {
  const toggle = document.getElementById('mobileToggle');
  const nav = document.getElementById('navLinks');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('open');
    const isOpen = nav.classList.contains('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  // Close nav when clicking a link
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

// Scroll-triggered fade-in animations
(function () {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
})();

// Header scroll behavior
(function () {
  const header = document.querySelector('.site-header');
  if (!header) return;
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (currentScroll > 100) {
      header.style.boxShadow = 'var(--shadow-sm)';
    } else {
      header.style.boxShadow = 'none';
    }
    lastScroll = currentScroll;
  }, { passive: true });
})();

// Form submission handler
async function handleSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('bookingForm');
  const success = document.getElementById('formSuccess');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  if (form && success) {
    const formData = new FormData(form);
    const data = {
      first_name: formData.get('firstName'),
      last_name: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      service: formData.get('service'),
      message: formData.get('message'),
      created_at: new Date().toISOString()
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    try {
      if (!_supabase) {
        throw new Error('Supabase is not initialized. Please provide a valid URL and Key.');
      }

      const { error } = await _supabase
        .from('consultation_requests')
        .insert([data]);

      if (error) throw error;

      form.style.display = 'none';
      success.style.display = 'block';
    } catch (err) {
      console.error('Error submitting form:', err.message);
      alert('There was an error submitting your request. Please try again or contact us directly.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Request';
      }
    }
  }
}


