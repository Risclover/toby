Object.defineProperty(HTMLElement.prototype, "innerText", {
    get() {
        return this.textContent;
    },
});