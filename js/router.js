/* ============ HASH ROUTER ============ */
var Router = {
  routes: ['home', 'tools', 'about'],

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  navigate(path, params = null) {
    const targetHash = params ? `#${path}/${params}` : `#${path}`;
    if (window.location.hash === targetHash) {
      this.handleRoute();
    } else {
      window.location.hash = targetHash;
    }
  },

  handleRoute() {
    const rawHash = window.location.hash.replace('#', '') || 'home';
    const parts = rawHash.split('/');
    const mainRoute = parts[0] || 'home';
    const subParam = parts[1] || null;

    // Default to home if route unknown
    const targetRoute = this.routes.includes(mainRoute) ? mainRoute : 'home';

    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    
    // Activate target view
    const targetView = document.getElementById('view-' + targetRoute);
    if (targetView) {
      targetView.classList.add('active');
    }

    // Update nav links active class
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(a => {
      const href = a.getAttribute('href') || '';
      const isMatch = href === '#' + mainRoute || 
                      (subParam && href === `#${mainRoute}/${subParam}`) ||
                      a.dataset.view === targetRoute;
      a.classList.toggle('active', isMatch);
    });

    // Close all open modals on route transition to prevent overlay freezes
    if (typeof UI !== 'undefined' && UI.closeAllModals) {
      UI.closeAllModals();
    }

    // Close mobile menu if open
    if (typeof UI !== 'undefined' && UI.closeMobileMenu) {
      UI.closeMobileMenu();
    }

    // Handle tools sub-route (e.g. #tools/resume or #tools/photo-resizer)
    if (targetRoute === 'tools') {
      const matched = (subParam && typeof TOOLS !== 'undefined')
        ? TOOLS.find(t => t.id === subParam || t.alias === subParam || (t.aliases && t.aliases.includes(subParam)) || t.id.replace(/_/g, '-') === subParam)
        : null;

      if (matched) {
        UI.renderToolWorkspace(matched.id);
      } else {
        UI.renderToolsList();
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

window.Router = Router;
