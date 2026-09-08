// Registers <cdz-button> as a side effect of importing @kdenza/components.
import '@kdenza/components';
import '@kdenza/components/dist/styles/tokens.css';
import type {
  CdzButton,
  CdzSelect,
  CdzSelectOption,
  CdzRadioGroup,
  CdzRadioGroupOption,
  CdzPageNav,
  CdzPageNavSection
} from '@kdenza/components';
import './styles/global.css';

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

// cdz-radio-group's `options` is a JS property for the same reason
// cdz-select's is. Unlike cdz-select, though, the group renders its own
// native radios rather than accepting slotted <cdz-radio> children — see
// ADR-0029 for why composing the atoms would have broken the grouping.
const subscriptionOptions: CdzRadioGroupOption[] = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'anual', label: 'Anual' },
  { value: 'equipo', label: 'Equipo' }
];

const radioGroupDefault = document.querySelector<CdzRadioGroup>('#radio-group-default');
if (radioGroupDefault) radioGroupDefault.options = subscriptionOptions;

const radioGroupHorizontal = document.querySelector<CdzRadioGroup>('#radio-group-horizontal');
if (radioGroupHorizontal) {
  radioGroupHorizontal.options = [
    { value: 'diario', label: 'Diario' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'nunca', label: 'Nunca', disabled: true }
  ];
}

const radioGroupError = document.querySelector<CdzRadioGroup>('#radio-group-error');
if (radioGroupError) {
  radioGroupError.options = [
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'transferencia', label: 'Transferencia' }
  ];
}

// The table of contents is derived from the page's own headings rather
// than from a hand-written list. A list would be a second source of truth
// for the same thing, and the two drift the moment a section is renamed —
// exactly the failure the component cannot detect and the reader can.
//
// The derivation lives here, not inside cdz-page-nav: the component
// renders whatever sections it is given, which keeps it testable without
// a document around it. Deciding *which* sections belong is the page's
// job.
const pageNav = document.querySelector<CdzPageNav>('#page-nav');
if (pageNav) {
  const sections: CdzPageNavSection[] = Array.from(
    document.querySelectorAll<HTMLHeadingElement>('main h2[id]')
  ).map((heading) => ({ id: heading.id, label: heading.textContent?.trim() ?? heading.id }));

  pageNav.sections = sections;

  // Deep links have to arrive at the right item marked as current;
  // otherwise the first section stays highlighted while the reader is
  // somewhere else entirely. The scroll spy corrects it afterwards, but
  // only once something scrolls.
  const hash = window.location.hash.slice(1);
  if (hash && sections.some((s) => s.id === hash)) pageNav.currentId = hash;
}
