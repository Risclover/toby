import { Button } from "@mantine/core"

type Props = {
    isLoading?: boolean;
    onClick?: (() => void) | ((e: any) => void);
    label: string;
    variant: string;
    disabled?: boolean;
    color?: string;
    loaderProps?: {
        children: string;
    }
    type?: "button" | "submit" | "reset" | undefined;
}
export const ButtonStandard = ({ isLoading, onClick, label, variant, disabled, color, loaderProps, type }: Props) => {
    return (
        <Button
            loading={isLoading}
            onClick={onClick}
            variant={variant}
            disabled={disabled}
            h="auto"
            p=".5rem 1rem"
            size="sm"
            fw={500}
            radius="sm"
            color={color || "rgb(5, 5, 73)"}
            loaderProps={loaderProps}
            type={type || "button"}
        >
            {label}
        </Button>
    )
}