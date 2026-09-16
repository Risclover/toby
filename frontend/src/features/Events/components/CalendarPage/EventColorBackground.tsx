import type { ReactNode } from "react";
import { toLightCssColor } from "../../utils/getEventColors";

export function EventColorBackground({ color, children }: { color: string; children: ReactNode }) {
    return <div style={{ height: "100%", background: toLightCssColor(color) }}>{children}</div>;
}