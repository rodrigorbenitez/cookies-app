export type Theme = 'system' | 'light' | 'dark';

export function getTheme(): Theme {
  return (localStorage.getItem('theme') as Theme) || 'system';
}

export function applyTheme(theme: Theme) {
  localStorage.setItem('theme', theme);
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0c1712' : '#a41d1f');
}

export function watchSystemTheme() {
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => getTheme() === 'system' && applyTheme('system');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
