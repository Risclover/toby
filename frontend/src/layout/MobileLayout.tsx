import { MobileHeader } from "@/component/MobileHomeHeader"
import { MobileHomeNavGrid } from "@/component/MobileHomeNavGrid"
import { MobileHomeNoticeBoard } from "@/component/MobileHomeNoticeBoard"
import type React from "react"
import type { JSX } from "react"

type Props = {
    titleComponent: JSX.Element;
    children: React.ReactNode
}
export const MobileLayout = ({ titleComponent, children }: Props) => {
    return (
        <div className="mobile-home-container">
            <div className="mobile-home-container-top">
                <MobileHeader />
                {titleComponent}
            </div>
            <div className="mobile-home-container-bottom">
                {children}
            </div>
        </div>
    )
}