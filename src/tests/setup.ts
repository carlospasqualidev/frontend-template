import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// O jsdom não implementa ResizeObserver, usado por componentes Radix (ex.: ScrollArea).
// Polyfill no-op é suficiente para os testes — eles não medem layout.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// O jsdom não implementa matchMedia, usado por `useIsMobile` (Modal/Drawer) e pelo
// autofoco da busca do Combobox. Padrão desktop (`matches: false`) — os testes
// renderizam a variante Dialog.
if (typeof globalThis.matchMedia === 'undefined') {
  globalThis.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

// O jsdom não implementa a API de Pointer Capture nem `scrollIntoView`, usadas pelo
// `Select` do Radix ao abrir a lista. Sem elas, clicar no gatilho lança
// `target.hasPointerCapture is not a function` e derruba o teste.
if (typeof Element.prototype.hasPointerCapture === 'undefined') {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}
if (typeof Element.prototype.scrollIntoView === 'undefined') {
  Element.prototype.scrollIntoView = () => {};
}

// Limpa o DOM renderizado após cada teste.
afterEach(() => {
  cleanup();
});
