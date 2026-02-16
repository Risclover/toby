import React, { useState } from "react"
import { Collapse } from "@mantine/core"
import { HomepageCollapseCardBody } from "./HomepageCollapseCardBody"
import { HomepageCollapseCardTitle } from "./HomepageCollapseCardTitle"

type Props = {
    title: string;
    children: React.ReactNode;
}
export const HomepageCollapseCard = ({ title, children }: Props) => {
    const [showCard, setShowCard] = useState(false);

    return (
        <div className="homepage-collapse-card">
            <HomepageCollapseCardTitle dotColor="var(--mantine-color-cyan-6)" title={title} setShowCard={setShowCard} showCard={showCard} />
            <Collapse
                in={showCard}
                transitionDuration={100}
                transitionTimingFunction="ease-in-out"
            >
                <HomepageCollapseCardBody>{children}</HomepageCollapseCardBody>
            </Collapse>
        </div>
    )
}