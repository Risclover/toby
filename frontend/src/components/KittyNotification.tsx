import { notifications } from "@mantine/notifications";
import type { JSX, ReactNode } from "react";

type Props = {
    title: string;
    message: ReactNode | string;
    icon: string;
    color: string;
}
export const KittyNotification = ({ title, message, icon, color }: Props) => {
    notifications.show({
        title,
        message: <span style={{ color: "var(--mantine-color-dark-7)", wordBreak: "break-word", lineHeight: `1.2 !important` }}>{message}</span>,
        autoClose: false,
        position: "bottom-right",
        color,
        icon: <img src={icon} alt="Kitty Icon" style={{ width: `60px !important`, height: "auto" }} />,
        style: { borderLeft: `8px solid ${color}` }
    });
}