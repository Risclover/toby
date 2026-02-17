import type { FeaturedTasklistSettingsForm } from "@/components/FeaturedListSettings/FeaturedTasklistTab";
import { FeaturedTasklistTabUrgencyFilter } from "@/components/FeaturedListSettings/FeaturedTasklistTabUrgencyFilter";
import { Collapse, Divider, Group, Input, Space } from "@mantine/core"
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
    collapse?: boolean;
    showUrgencyFilters?: boolean;
    form?: FeaturedTasklistSettingsForm | null;
}
export const SettingsItem = ({ layout, label, labelRequired, error, errorBool, description, divider, collapse = false, showUrgencyFilters = false, form = null, children }: Props) => {
    return (
        <>
            <div className={`tasklist-settings-section${layout === "column" ? " section-column" : ""}${layout === "delete" ? " delete-section" : ""}`}>
                <div className={`collapse-special${layout === "column" ? " section-column" : ""}${layout === "delete" ? " delete-section" : ""}`}>
                    <div className="input-label-description">
                        <Input.Label required={labelRequired}>{label}</Input.Label>
                        <Input.Description>{description}</Input.Description>
                        {errorBool && <Input.Error>{error}</Input.Error>}
                    </div>
                    {children}
                </div>
                {showUrgencyFilters && <Space h="sm" />}
                {collapse &&
                    <Collapse className="urgency-collapse" in={showUrgencyFilters} transitionDuration={100} transitionTimingFunction="ease-in-out">
                        {showUrgencyFilters &&
                            <Group gap="0.5rem">
                                <FeaturedTasklistTabUrgencyFilter form={form} label="Overdue" />
                                <FeaturedTasklistTabUrgencyFilter form={form} label="Due today" />
                                <FeaturedTasklistTabUrgencyFilter form={form} label="Due soon" />
                            </Group>
                        }
                    </Collapse>
                }
            </div>
            {divider && <Divider my="lg" />}
        </>
    )
}