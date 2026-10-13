import { createTheme, type MantineColorsTuple } from "@mantine/core";

const navy: MantineColorsTuple = [
    "#e9e9ff",
    "#b0b0f4",
    "#8080df",
    "#4f4fcc",
    "#2b2bac",
    "#16167c",
    "#050549", // brand color: rgb(5, 5, 73)
    "#04043c",
    "#030330",
    "#020225",
];

export const theme = createTheme({ colors: { navy } });