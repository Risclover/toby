import { RightClosedChevronIcon } from "@/assets/icons/RightClosedChevronIcon";
import { useState, type SetStateAction } from "react";

type Props = {
    title: string;
    dotColor: string;
    showCard: boolean;
    setShowCard: React.Dispatch<SetStateAction<boolean>>;
}

export const HomepageCollapseCardTitle = ({ title, dotColor, showCard, setShowCard }: Props) => {
    const [active, setActive] = useState(showCard);
    const handleClick = () => {
        console.log('showCard:', showCard)
        setShowCard(prev => !prev);
    }

    return (
        <div className={`homepage-collapse-card-title${showCard ? " title-active" : ""}`} onClick={handleClick}>
            <div className="homepage-collapse-card-title-left">
                <span style={{ backgroundColor: dotColor }} className="homepage-collapse-card-title-dot"></span>
                {title}
            </div>
            <RightClosedChevronIcon size="9px" color="var(--mantine-color-dark-3)" open={showCard} /></div>
    )
}