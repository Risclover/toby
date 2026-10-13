import {
    createTheme,
    defaultVariantColorsResolver,
    type MantineColorsTuple,
    type VariantColorsResolver,
} from "@mantine/core";

export const BRAND_NAVY = "#050549";
const NAVY_COLOR_KEY = "navy";
const NAVY_PRIMARY_SHADE = 7;
const LIGHT_VARIANT = "light";
const SUBTLE_VARIANT = "subtle";

const NAVY_LIGHT_BACKGROUND = "#e8eefb";
const NAVY_LIGHT_HOVER = "#d9e3f8";

const navy: MantineColorsTuple = [
    "#e9e9ff", "#b8b8f6", "#8f8fe5", "#6363d6", "#3333cb", "#2222a1", "#131376",
    BRAND_NAVY,
    "#04043c", "#030330",
];

const variantColorResolver: VariantColorsResolver = (input) => {
    const resolved = defaultVariantColorsResolver(input);

    if (input.color !== NAVY_COLOR_KEY) {
        return resolved;
    }

    if (input.variant === LIGHT_VARIANT) {
        return {
            ...resolved,
            background: NAVY_LIGHT_BACKGROUND,
            hover: NAVY_LIGHT_HOVER,
            color: BRAND_NAVY,
        };
    }

    if (input.variant === SUBTLE_VARIANT) {
        return {
            ...resolved,
            hover: NAVY_LIGHT_BACKGROUND,
            color: BRAND_NAVY,
        };
    }

    return resolved;
};

export const theme = createTheme({
    primaryShade: NAVY_PRIMARY_SHADE,
    colors: { navy },
    variantColorResolver,
});