import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app_theme';
  public theme = signal<Theme>(this.getStoredTheme());

  constructor() {
    // Apply initial theme immediately (it might already be set by index.html script)
    this.applyTheme(this.theme());

    // Effect to sync changes to DOM and Storage
    effect(() => {
      const currentTheme = this.theme();
      this.applyTheme(currentTheme);
      this.storeTheme(currentTheme);
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        // Only update if the user hasn't set a manual preference
        if (!localStorage.getItem(this.THEME_KEY)) {
          this.theme.set(e.matches ? 'dark' : 'light');
        }
      });
  }

  toggleTheme(): void {
    const nextTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.theme.set(nextTheme);
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  private getStoredTheme(): Theme {
    const stored = localStorage.getItem(this.THEME_KEY) as Theme;
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private storeTheme(theme: Theme): void {
    localStorage.setItem(this.THEME_KEY, theme);
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    // Add classes for backward compatibility or extra styling
    root.classList.toggle('dark-theme', theme === 'dark');
    root.classList.toggle('light-theme', theme === 'light');

    // Update Meta Theme Color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#020617' : '#6366f1');
    }
  }
}
