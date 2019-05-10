/* eslint-disable class-methods-use-this */
import { html, css, LitElement } from 'lit-element';
import { render } from 'lit-html';
import '@vaadin/vaadin-grid/vaadin-grid';
import '@vaadin/vaadin-grid/vaadin-grid-column';
import '@vaadin/vaadin-grid/theme/lumo/vaadin-grid-styles';

// Styling parts of vaadin-grid (until ::part comes along)
const template = document.createElement('template');
template.innerHTML = `<dom-module id="grid-theme" theme-for="vaadin-grid">
<template>
  <style>
    [part~='header-cell'] {
      font-variant: small-caps;
      color: black;
      background-color: #66ccff;
    }
    [part~='cell'] {
      font-size: var(--lumo-font-size-m);
    }
  </style>
</template>
</dom-module>`;

document.head.appendChild(template.content);

export default class PagedGrid extends LitElement {
  static get properties() {
    return {};
  }

  constructor() {
    super();
    this._rpp = 20; // records per page
    this._buttonTemplates = []; // buttons for paging
    this._pages = []; // blocks of records
    this._page = 0; // currently displayed block
    // bound render so we can see `this` in the render.
    this.boundIndexRenderer = this.indexRenderer.bind(this);
  }

  async firstUpdated() {
    super.firstUpdated();

    await fetch(`https://demo.vaadin.com/demo-data/1.0/people?count=200`)
      .then(r => r.json())
      .then(async data => {
        let processed = 0;
        while (processed < 200) {
          this._pages.push(data.result.slice(processed, processed + this._rpp));
          processed = this._pages.length * this._rpp;
          const page = this._pages.length - 1;
          this._buttonTemplates.push(html`
            <button @click="${this._selectPage}" class="page-btns" .page=${page}>
              ${page + 1}
            </button>
          `);
        }
        await this.requestUpdate(); // Forces drawing the buttons.
        // Not called here if using _continueQuery()
        this._showPage();
      });

    /* See note below on _continueQuery() */
    // await this.requestUpdate(); // Forces drawing the button.
    // this._continueQuery();
  }

  /* If your REST API allows grabbing records in chunks, you can
   * display the first page of records on update while the other
   * pages are loading. On a slow network, you'll see the page
   * buttons draw one at a time.
   * Example below
   */
  /*
  async _continueQuery() {
    let complete = this._pages * this._rpp < 200;
    while (!complete) {
      // eslint-disable-next-line no-await-in-loop
      await fetch(`https://demo.vaadin.com/demo-data/1.0/people?start=${this._pages.length * this._rpp}&count=${this._rpp}`)
        .then(r => r.json())
        .then(data => {
          this._pages.push(data.result);
          const page = this._pages.length - 1;
          this._buttonTemplates.push(html`
            <button @click="${this._selectPage}" class="page-btns" .page=${page}>${page + 1}</button>
          `);
          this.requestUpdate(); // Forces drawing the button.
        });
      complete = this._pages * this._rpp < 200;
    }
  }
  */

  static get styles() {
    return [
      css`
        .address {
          white-space: normal;
        }
        #grid {
          height: 600px;
        }
        #pages {
          display: flex;
          flex-wrap: wrap;
          margin: 10px;
        }
        #pages > button {
          user-select: none;
          padding: 5px;
          margin: 0 5px;
          border-radius: 10%;
          border: 0;
          background: transparent;
          font-family: sans-serif;
          font-size: var(--lumo-font-size-m);
          outline: none;
          cursor: pointer;
        }

        #pages > button:not([disabled]):hover,
        #pages > button:focus {
          color: black;
          background-color: #66ccff;
        }
        #pages > button[selected] {
          font-weight: bold;
          background-color: #66ccff;
        }
        #pages > button[disabled] {
          opacity: 0.5;
          cursor: default;
        }
      `,
    ];
  }

  render() {
    return html`
      <vaadin-grid id="grid" .items="${this.users}" @active-item-changed="${this._change}">
        <vaadin-grid-column
          width="50px"
          flex-grow="0"
          header="#"
          .renderer="${this.boundIndexRenderer}"
        ></vaadin-grid-column>
        <vaadin-grid-column path="firstName" header="First name"></vaadin-grid-column>
        <vaadin-grid-column path="lastName" header="Last name"></vaadin-grid-column>
        <vaadin-grid-column
          width="150px"
          header="Address"
          .renderer="${this.addressRenderer}"
        ></vaadin-grid-column>
        <vaadin-grid-column width="150px" path="email"></vaadin-grid-column>
      </vaadin-grid>

      <div id="pages">
        <button @click="${this._prev}" id="_prev" disabled>&lt;</button> ${this._buttonTemplates}
        <button @click="${this._next}" id="_next" disabled>&gt;</button>
      </div>
    `;
  }

  _change(evt) {
    const grid = this.shadowRoot.querySelector('#grid');
    const item = evt.detail.value;
    grid.selectedItems = item ? [item] : [];
  }

  indexRenderer(root, column, rowData) {
    render(
      html`
        <div>${rowData.index + 1 + this._rpp * this._page}</div>
      `,
      root,
    );
  }

  addressRenderer(root, column, rowData) {
    render(
      html`
        <span class="address">${rowData.item.address.street}, ${rowData.item.address.city}</span>
      `,
      root,
    );
  }

  _next() {
    this._page = Math.min(this._pages.length - 1, this._page + 1);
    this._showPage();
  }

  _prev() {
    this._page = Math.max(0, this._page - 1);
    this._showPage();
  }

  _selectPage(evt) {
    this._page = evt.target.page;
    this._showPage();
  }

  _showPage() {
    if (this._pages.length === 0) {
      return;
    }
    const grid = this.shadowRoot.getElementById('grid');
    grid.dataProvider = (params, callback) => {
      callback(this._pages[this._page], this._pages[this._page].length);
    };
    // return to the top of the page
    // From Tomi Virkki on Slack, 2018.03.07. Maybe this function
    // will loose the underscore some day.
    grid._scrollToIndex(0);
    this.requestUpdate(); // Force redraw.
    // Set buttons.
    const pagesControl = this.shadowRoot.querySelectorAll('.page-btns');
    const pageButtons = Array.from(pagesControl);
    pageButtons.forEach(btn => {
      if (parseInt(btn.page, 10) === this._page) {
        btn.setAttribute('selected', '');
        btn.setAttribute('disabled', '');
      } else {
        btn.removeAttribute('selected');
        btn.removeAttribute('disabled');
      }
    });
    const nextBtn = this.shadowRoot.querySelector('#_next');
    const prevBtn = this.shadowRoot.querySelector('#_prev');
    if (this._page === 0) {
      prevBtn.setAttribute('disabled', '');
    } else {
      prevBtn.removeAttribute('disabled');
    }
    if (this._page === pageButtons.length - 1) {
      nextBtn.setAttribute('disabled', '');
    } else {
      nextBtn.removeAttribute('disabled');
    }
  }
}

window.customElements.define('paged-grid', PagedGrid);
