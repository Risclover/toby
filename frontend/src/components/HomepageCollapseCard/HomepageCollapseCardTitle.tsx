import { type ReactNode, type SetStateAction } from "react";
import { RightClosedChevronIcon } from "@/assets/icons/RightClosedChevronIcon";

type Props = {
    title: string;
    dotColor: string;
    showCard: boolean;
    setShowCard: React.Dispatch<SetStateAction<boolean>>;
    badge?: ReactNode;
}

export const HomepageCollapseCardTitle = ({ title, dotColor, showCard, setShowCard, badge }: Props) => {
    const handleClick = () => {
        setShowCard(prev => !prev);
    }

    return (
        <div className={`homepage-collapse-card-title${showCard ? " title-active" : ""}`} onClick={handleClick}>
            <div className="homepage-collapse-card-title-left">
                <span style={{ backgroundColor: dotColor }} className="homepage-collapse-card-title-dot"></span>
                {title} {badge}
            </div>
            <RightClosedChevronIcon size="9px" color="var(--mantine-color-dark-3)" open={showCard} /></div>
    )
}