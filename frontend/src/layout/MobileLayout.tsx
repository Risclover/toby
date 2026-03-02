import { MobileHomeHeader } from "@/components/MobileHomeHeader"
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
                <MobileHomeHeader />
                {titleComponent}
            </div>
            <div className="mobile-home-container-bottom">
                {children}
            </div>
        </div>
    )
}