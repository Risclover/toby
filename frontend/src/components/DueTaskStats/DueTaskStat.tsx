import { useIsSmallScreen } from "@/hooks";
import { Badge, Indicator, Skeleton, Space, ThemeIcon } from "@mantine/core";
import type { JSX } from "react";

type Props = {
    title: string;
    color: string | undefined;
    count: number;
    icon: JSX.Element;
    isLoading: boolean;
}

export const DueTaskStat = ({ title, color, count, icon, isLoading }: Props) => {
    const isSmall = useIsSmallScreen(375);
    const isMedium = useIsSmallScreen(425);
    return (
        <div className="due-task-stat-container">
            {isLoading ? <DueTaskStatSkeleton /> :
                <>
                    <Indicator fw={600} label={count} size={isSmall ? 20 : isMedium ? 24 : 24} offset={3} position="top-end" color={color} withBorder>
                        <ThemeIcon size={isSmall ? "md" : isMedium ? "lg" : "xl"} color={color} variant="light" p={isSmall ? "1rem" : isMedium ? "1.5rem" : "1.5rem"} radius="sm" className="due-task-stat-main">
                            <div className="due-task-stat-icon">{icon}</div>
                        </ThemeIcon>
                    </Indicator>
                    <Space h={isSmall ? ".25rem" : isMedium ? "0.5rem" : "0.75rem"} />
                    <div className={`due-task-stat-title${isSmall ? " title-sm" : ""}`}>
                        {title}
                    </div>
                </>
            }
        </div >
    )
}

export const DueTaskStatSkeleton = () => {
    const isSmall = useIsSmallScreen(375);
    const isMedium = useIsSmallScreen(425);
    return (
        <div className="due-task-stat-skeleton">
            <Skeleton height={isSmall ? 34 : 50} width={isSmall ? 34 : 50} />
            <div className="indicator-skeleton">
                <Skeleton radius="xl" height={isSmall ? 16 : 22} width={isSmall ? 16 : 22} />
            </div>
            <Skeleton height={isSmall ? 6 : 8} mt={isSmall ? ".5rem" : isMedium ? "0.75rem" : "1rem"} mb="2px" width={isSmall ? 34 : 50} radius="xl" />
        </div>
    )
}