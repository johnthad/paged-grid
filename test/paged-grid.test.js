import { html, fixture, expect } from '@open-wc/testing';

import '../src/paged-grid.js';

describe('<paged-grid>', () => {
  it('has a default property heading', async () => {
    const el = await fixture('<paged-grid></paged-grid>');

    expect(el.heading).to.equal('Hello world!');
  });

  it('allows property heading to be overwritten', async () => {
    const el = await fixture(html`
      <paged-grid heading="different heading"></paged-grid>
    `);

    expect(el.heading).to.equal('different heading');
  });
});
