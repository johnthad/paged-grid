import { html, render } from 'lit-html';
import '../src/paged-grid.js';

render(
  html`
    <paged-grid></paged-grid>
  `,
  document.querySelector('#demo'),
);
