// Registers <cdz-button> as a side effect of importing @cadenza/components.
import '@cadenza/components';
import '@cadenza/components/dist/styles/tokens.css';
import type { CdzButton } from '@cadenza/components';
import './styles/global.css';

const cta = document.querySelector<CdzButton>('#cta-primary');
cta?.addEventListener('click', () => {
  console.log('cdz-button clicked');
});
