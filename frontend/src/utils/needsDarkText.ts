export const needsDarkText = (hexColor: string | undefined): boolean => {
    let c = hexColor?.replace('#', '');

    if (c?.length === 3) {
        c = c.split('').map(char => char + char).join('');
    }

    if (c?.length !== 6) return false;

    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 160; // isTooLight uses 240 — this catches the wider "needs black text" range
};