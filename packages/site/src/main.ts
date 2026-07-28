// Registers <cdz-button> as a side effect of importing @kdenza/components.
import '@kdenza/components';
import '@kdenza/components/dist/styles/tokens.css';
import type { CdzButton } from '@kdenza/components';
import './styles/global.css';

const cta = document.querySelector<CdzButton>('#cta-primary');
cta?.addEventListener('click', () => {
  console.log('cdz-button clicked');
});
