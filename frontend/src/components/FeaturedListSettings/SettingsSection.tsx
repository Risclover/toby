import type React from "react";

type Props = {
    title: string;
    children: React.ReactNode;
}

export const SettingsSection = ({ title, children }: Props) => {
    return (
        <div className="settings-section-container">
            <div className="settings-section-title">{title}</div>
            {children}
        </div>
    )
}