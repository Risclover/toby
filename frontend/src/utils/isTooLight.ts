export const isTooLight = (hexColor: string | undefined) => {
    // 1. Remove hash
    let c = hexColor?.replace('#', '');

    // 2. Expand shorthand (3 digits -> 6 digits)
    if (c?.length === 3) {
        c = c?.split('').map(char => char + char).join('');
    }

    // 3. Safety check: ensure we have 6 chars before parsing
    if (c?.length !== 6) return false; // Or handle invalid input

    const r = parseInt(c?.substring(0, 2), 16);
    const g = parseInt(c?.substring(2, 4), 16);
    const b = parseInt(c?.substring(4, 6), 16);

    // Calculate relative luminance
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 240;
};