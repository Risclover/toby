import { createTheme, type MantineColorsTuple } from "@mantine/core";

export const BRAND_NAVY = "#050549";

const NAVY_PRIMARY_SHADE = 7;

const navy: MantineColorsTuple = [
    "#e9e9ff",
    "#b8b8f6",
    "#8f8fe5",
    "#6363d6",
    "#3333cb",
    "#2222a1",
    "#131376",
    BRAND_NAVY,
    "#04043c",
    "#030330",
];

export const theme = createTheme({
    primaryShade: NAVY_PRIMARY_SHADE,
    colors: { navy },
});