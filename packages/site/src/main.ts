// Registers <cdz-button> as a side effect of importing @kdenza/components.
import '@kdenza/components';
import '@kdenza/components/dist/styles/tokens.css';
import type { CdzButton, CdzSelect, CdzSelectOption } from '@kdenza/components';
import './styles/global.css';

const cta = document.querySelector<CdzButton>('#cta-primary');
cta?.addEventListener('click', () => {
  console.log('cdz-button clicked');
});

// @kdenza/gallery is a separate, privately-run Vite dev server (port
// 5174) with no build/deploy story of its own yet — the link only makes
// sense while both dev servers are running locally, so it's hidden by
// default in the markup and only revealed under `npm run dev`
// (`import.meta.env.DEV`), never in a production build.
if (import.meta.env.DEV) {
  document.querySelector('#gallery-link')?.removeAttribute('hidden');
}

// Manual light/dark override, layered on top of the zero-JS
// prefers-color-scheme setup (see @kdenza/components' tokens.css and
// ADR-0002's amendment). The synchronous inline <script> in each page's
// <head> already applied any stored choice before first paint — this
// just handles the click and keeps the button's label in sync.
const THEME_STORAGE_KEY = 'cdz-theme';

function getEffectiveTheme(): 'light' | 'dark' {
  const override = document.documentElement.getAttribute('data-theme');
  if (override === 'light' || override === 'dark') return override;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function updateThemeToggleLabel(toggle: CdzButton): void {
  toggle.textContent =
    getEffectiveTheme() === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
}

const themeToggle = document.querySelector<CdzButton>('#theme-toggle');
if (themeToggle) {
  updateThemeToggleLabel(themeToggle);
  themeToggle.addEventListener('click', () => {
    const next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    updateThemeToggleLabel(themeToggle);
  });
}

// cdz-select's `options` is a JS property (an array), not an HTML
// attribute — it can't be set as a plain string in the markup, so the
// design-system showcase page wires it up here instead. See select.ts's
// class comment for why options are a property rather than slotted
// <option> children.
const countryOptions: CdzSelectOption[] = [
  { value: 'ar', label: 'Argentina' },
  { value: 'br', label: 'Brasil' },
  { value: 'cl', label: 'Chile' }
];
const languageOptions: CdzSelectOption[] = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' }
];
const planOptions: CdzSelectOption[] = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'annual', label: 'Anual' }
];

const selectDefault = document.querySelector<CdzSelect>('#select-default');
if (selectDefault) selectDefault.options = countryOptions;

const selectHelper = document.querySelector<CdzSelect>('#select-helper');
if (selectHelper) selectHelper.options = languageOptions;

const selectError = document.querySelector<CdzSelect>('#select-error');
if (selectError) selectError.options = planOptions;

const selectDisabled = document.querySelector<CdzSelect>('#select-disabled');
if (selectDisabled) selectDisabled.options = planOptions;
