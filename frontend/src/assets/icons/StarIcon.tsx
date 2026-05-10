import { ActionIcon } from "@mantine/core";
import { forwardRef } from "react";

type Props = {
    size: string;
    color?: string;
}

export const StarIcon = ({ size, color }: Props) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill={color} viewBox="124.93 -832 710.13 678.55"><path d="M480-270.5 293.5-158q-8 5-16.75 4.5T261.5-159q-6.5-5-10-12.5t-1-17.5l49-212.5L135-545q-7.5-6.5-9.25-14.5t.25-16q2-8 9-13.25t16.5-6.25L369-614l84.5-200.5q3.5-8.5 11-13T480-832q8 0 15.5 4.5t11.5 13L591.5-614 809-595q9 1 16 6.25t9 13.25q2 8 .25 16T825-545L660.5-401.5 710-189q2 10-1.5 17.5t-10 12.5q-6.5 5-15.25 5.5T667-158L480-270.5Z"></path></svg>
    )
}

export const StarIconOutline = ({ size, color }: Props) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill={color} viewBox="124.93 -832 710.13 678.55"><path d="m321-242.5 159-95 159 96-42.5-180 140-121.5L552-559.5l-72-170L408.5-560 224-544l140 121-43 180.5Zm159-28L293.5-158q-8 5-16.75 4.5T261.5-159q-6.5-5-10-12.5t-1-17.5l49-212.5L135-545q-7.5-6.5-9.25-14.5t.25-16q2-8 9-13.25t16.5-6.25L369-614l84.5-200.5q3.5-8.5 11-13T480-832q8 0 15.5 4.5t11.5 13L591.5-614 809-595q9 1 16 6.25t9 13.25q2 8 .25 16T825-545L660.5-401.5 710-189q2 10-1.5 17.5t-10 12.5q-6.5 5-15.25 5.5T667-158L480-270.5Zm0-205Z"></path></svg>
    )
}