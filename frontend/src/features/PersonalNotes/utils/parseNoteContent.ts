export const parseNoteContent = (html: string): { text: string; images: string[] } => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const images = Array.from(doc.querySelectorAll("img")).map(img => img.src);
    doc.querySelectorAll("img").forEach(img => img.remove());

    // Add space after block elements so text doesn't run together when tags are stripped
    doc.querySelectorAll("p, h1, h2, h3, h4, li, blockquote").forEach(el => {
        el.textContent = el.textContent + " ";
    });

    const text = doc.body.innerText.replace(/\s+/g, " ").trim();

    return { text, images };
};