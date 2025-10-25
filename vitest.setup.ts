import '@testing-library/jest-dom/vitest'; // <-- adds matchers to Vitest's expect  
import './frontend/src/test/setup';
import { ResizeObserver as RO } from '@juggle/resize-observer';

// ResizeObserver (for Mantine ScrollArea)
if (!('ResizeObserver' in globalThis)) {
    Object.defineProperty(globalThis, 'ResizeObserver', {
        configurable: true,
        writable: true,
        value: RO,
    });
}

if (!window.matchMedia) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => { },            // deprecated
            removeListener: () => { },         // deprecated
            addEventListener: () => { },
            removeEventListener: () => { },
            dispatchEvent: () => false,
        }),
    });
}

if (window.location.href === 'about:blank') {
    window.history.replaceState({}, 'Test', 'http://localhost/');
}