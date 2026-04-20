import { notifications } from "@mantine/notifications";
import type { JSX, ReactNode } from "react";

type Props = {
    title: string;
    message: ReactNode | string;
    icon: string;
    color: string;
}
export const KittyNotification = ({ title, message, icon, color }: Props) => {
    let notifColor;
    if (color === "green") {
        notifColor = "rgb(154, 221, 166)"
    } else if (color === "red") {
        notifColor = "rgb(234, 118, 118)"
    } else {
        notifColor = color;
    }

    notifications.show({
        title,
        message: <span style={{ color: "var(--mantine-color-dark-7)", wordBreak: "break-word", lineHeight: `1.2 !important` }}>{message}</span>,
        autoClose: 5000,
        position: "bottom-right",
        color: notifColor,
        icon: <img src={icon} alt="Kitty Icon" style={{ width: `60px !important`, height: "auto" }} />,
        style: { borderLeft: `8px solid ${notifColor}` }
    });
}

