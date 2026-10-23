import { Button } from "@mantine/core"

type Props = {
    addBtnText: string;
    addBtnOnClick: () => void;
    viewAllBtnOnClick: () => void;
    color: string;
    whiteBg?: boolean;
}

export const HomepageCollapseCardFooter = ({
    addBtnText,
    addBtnOnClick,
    viewAllBtnOnClick,
    color,
    whiteBg
}: Props) => {
    return (
        <div className={`homepage-collapse-card-footer${whiteBg ? " footer-white" : ""}`}>
            <Button
                size="compact-sm"
                fw={500}
                color={color}
                c="white"
                radius="xl"
                onClick={addBtnOnClick}
            >
                {addBtnText || "Loading..."}
            </Button>
            <Button
                p={0}
                size="xs"
                fw={400}
                variant="transparent"
                radius="xl"
                color={color}
                onClick={viewAllBtnOnClick}
            >
                View all →
            </Button>
        </div>
    )
}