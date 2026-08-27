/* ============ APPLICATION INITIALIZATION ============ */
document.addEventListener('DOMContentLoaded', () => {
  StorageManager.applyTheme();
  UI.init();
  Router.init();
  UI.initViralFloatingDrawer();
});

function toggleTheme() {
  const current = StorageManager.getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  StorageManager.setTheme(next);
  StorageManager.applyTheme();
  UI.showToast(`Switched to ${next} mode`);
}

window.toggleTheme = toggleTheme;
