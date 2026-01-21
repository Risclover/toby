import { Divider, Input } from "@mantine/core"
import type React from "react";

type Props = {
    layout: string;
    label: string;
    labelRequired?: boolean;
    error?: string;
    errorBool?: boolean;
    description?: string;
    divider: boolean;
    children: React.ReactNode;
}
export const SettingsItem = ({ layout, label, labelRequired, error, errorBool, description, divider, children }: Props) => {
    return (
        <>
            <div className={`tasklist-settings-section${layout === "column" ? " section-column" : ""}${layout === "delete" ? " delete-section" : ""}`}>
                <div className="input-label-description">
                    <Input.Label required={labelRequired}>{label}</Input.Label>
                    <Input.Description>{description}</Input.Description>
                    {errorBool && <Input.Error>{error}</Input.Error>}
                </div>
                {children}
            </div>
            {divider && <Divider my="lg" />}
        </>
    )
}