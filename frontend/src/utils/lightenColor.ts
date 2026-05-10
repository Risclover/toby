type RGB = { r: number; g: number; b: number; a?: number };
type HSL = { h: number; s: number; l: number; a?: number };

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function hexToRgb(hex: string): RGB | null {
    let value = hex.replace("#", "").trim();

    if (value.length === 3) {
        value = value.split("").map((c) => c + c).join("");
    }

    if (value.length !== 6) return null;

    const num = parseInt(value, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
}

function rgbToHex({ r, g, b }: RGB): string {
    return (
        "#" +
        [r, g, b]
            .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0"))
            .join("")
    );
}

function parseRgbString(input: string): RGB | null {
    const match = input
        .trim()
        .match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[\/,\s]+([\d.]+))?\s*\)$/i);

    if (!match) return null;

    return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
        a: match[4] !== undefined ? Number(match[4]) : undefined,
    };
}

function parseHslString(input: string): HSL | null {
    const match = input
        .trim()
        .match(/^hsla?\(\s*([\d.]+)(?:deg)?[,\s]+([\d.]+)%[,\s]+([\d.]+)%(?:[\/,\s]+([\d.]+))?\s*\)$/i);

    if (!match) return null;

    return {
        h: Number(match[1]),
        s: Number(match[2]),
        l: Number(match[3]),
        a: match[4] !== undefined ? Number(match[4]) : undefined,
    };
}

function rgbToHsl({ r, g, b, a }: RGB): HSL {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;

    let h = 0;
    let s = 0;
    const d = max - min;

    if (d !== 0) {
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
                break;
            case g:
                h = ((b - r) / d + 2) * 60;
                break;
            case b:
                h = ((r - g) / d + 4) * 60;
                break;
        }
    }

    return { h, s: s * 100, l: l * 100, a };
}

function hslToRgb({ h, s, l, a }: HSL): RGB {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else[r, g, b] = [c, 0, x];

    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255),
        a,
    };
}

function formatRgb({ r, g, b, a }: RGB, original: string): string {
    if (original.trim().toLowerCase().startsWith("rgba") || a !== undefined) {
        return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a ?? 1})`;
    }
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function formatHsl({ h, s, l, a }: HSL, original: string): string {
    const hh = Math.round(h);
    const ss = Math.round(s);
    const ll = Math.round(l);

    if (original.trim().toLowerCase().startsWith("hsla") || a !== undefined) {
        return `hsla(${hh}, ${ss}%, ${ll}%, ${a ?? 1})`;
    }
    return `hsl(${hh}, ${ss}%, ${ll}%)`;
}

export function lightenColor(color: string, amount = 10): string {
    const input = color.trim();
    const normalizedAmount = clamp(amount, 0, 100);

    if (input.startsWith("#")) {
        const rgb = hexToRgb(input);
        if (!rgb) return color;

        const hsl = rgbToHsl(rgb);
        const lighter = { ...hsl, l: clamp(hsl.l + normalizedAmount, 0, 100) };
        return rgbToHex(hslToRgb(lighter));
    }

    if (/^rgba?\(/i.test(input)) {
        const rgb = parseRgbString(input);
        if (!rgb) return color;

        const hsl = rgbToHsl(rgb);
        const lighter = { ...hsl, l: clamp(hsl.l + normalizedAmount, 0, 100) };
        return formatRgb({ ...hslToRgb(lighter), a: rgb.a }, input);
    }

    if (/^hsla?\(/i.test(input)) {
        const hsl = parseHslString(input);
        if (!hsl) return color;

        const lighter = { ...hsl, l: clamp(hsl.l + normalizedAmount, 0, 100) };
        return formatHsl(lighter, input);
    }

    return color;
}