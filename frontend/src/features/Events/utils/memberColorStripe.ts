import { toDotCssColor } from "./cssColors";

const CHIP_HEIGHT = 10;
const CAP_RADIUS = CHIP_HEIGHT / 2;
/** Percent of the day button's width reserved on each side so neighboring pills never touch. */
const INSET_PERCENT = 3;

export type MemberColorStripeStyle = {
    backgroundImage: string;
    backgroundSize: string;
    backgroundPosition: string;
    backgroundRepeat: string;
};

/**
 * Background style for a mobile month day cell: one pill (round ends, flat sides) split into one
 * flush color segment per distinct attendee. Always three background-image layers: a circle for each
 * end cap, plus a segmented linear-gradient spanning from one cap's center to the other's, so the
 * joins are seamless. Only background-image is used because Mantine owns the button's pseudo-elements
 * for its today/selected circle. Returns undefined for an empty color list.
 */
export function toMemberColorStripe(colors: string[]): MemberColorStripeStyle | undefined {
    if (colors.length === 0) return undefined;

    const firstColor = toDotCssColor(colors[0]);
    const lastColor = toDotCssColor(colors[colors.length - 1]);

    // Hard color stops relative to the middle layer's own 0%-100% box (which excludes both caps).
    const segmentPercent = 100 / colors.length;
    const stops: string[] = [];
    let cursor = 0;
    for (const color of colors) {
        const cssColor = toDotCssColor(color);
        const segmentEnd = cursor + segmentPercent;
        stops.push(`${cssColor} ${cursor}%`, `${cssColor} ${segmentEnd}%`);
        cursor = segmentEnd;
    }
    const middleGradient = `linear-gradient(to right, ${stops.join(", ")})`;

    return {
        backgroundImage: [
            `radial-gradient(circle closest-side at center, ${firstColor} 100%, transparent 100%)`,
            `radial-gradient(circle closest-side at center, ${lastColor} 100%, transparent 100%)`,
            middleGradient,
        ].join(", "),
        backgroundSize: [
            `${CHIP_HEIGHT}px ${CHIP_HEIGHT}px`,
            `${CHIP_HEIGHT}px ${CHIP_HEIGHT}px`,
            `calc(${100 - INSET_PERCENT * 2}% - ${CHIP_HEIGHT}px) ${CHIP_HEIGHT}px`,
        ].join(", "),
        backgroundPosition: [
            `left ${INSET_PERCENT}% bottom`,
            `right ${INSET_PERCENT}% bottom`,
            `left calc(${INSET_PERCENT}% + ${CAP_RADIUS}px) bottom`,
        ].join(", "),
        backgroundRepeat: "no-repeat",
    };
}