import { Button, Checkbox } from "@mantine/core"
import { useState } from "react";
import type { FeaturedTasklistSettingsForm } from "./FeaturedTasklistTab";

type Props = {
    label: string;
    form: FeaturedTasklistSettingsForm | null;
}
export const FeaturedTasklistTabUrgencyFilter = ({ label, form }: Props) => {
    const [isActive, setIsActive] = useState(false);
    return (
        <Button
            key={label}
            color="cyan.7"
            size='compact-xs'
            h="auto"
            p="0.375rem .625rem"
            fw={500}
            radius="xl"
            variant={isActive ? "filled" : "outline"}
            onClick={() => {
                setIsActive(prev => !prev);
            }}
            {...form?.getInputProps("urgencyFilter")}
        >{label}</Button>
    )
}