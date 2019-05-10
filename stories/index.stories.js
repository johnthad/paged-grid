import { storiesOf, html, withKnobs, withClassPropertiesKnobs } from '@open-wc/demoing-storybook';

import PagedGrid from '../src/paged-grid.js';

import readme from '../README.md';

storiesOf('paged-grid', module)
  .addDecorator(withKnobs)
  .add('Documentation', () => withClassPropertiesKnobs(PagedGrid), { notes: { markdown: readme } })
  .add(
    'Alternative Header',
    () => html`
      <paged-grid></paged-grid>
    `,
  );
