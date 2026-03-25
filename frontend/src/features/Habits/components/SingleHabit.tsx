import { PadlockIcon } from "@/assets/icons/PadlockIcon";
import { Checkbox } from "@mantine/core"
import { useState } from "react"

type Props = {
    name: string;
    description: string | null;
    color: string;
    isPrivate: boolean;
}

function hexToRgba(hex: string, alpha: number): string {
    if (!hex || !hex.startsWith("#")) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const SingleHabit = ({ name, description, color, isPrivate }: Props) => {
    const [checked, setChecked] = useState(false);
    return (
        <div
            className="single-habit"
            onClick={() => setChecked(prev => !prev)}
            style={{ borderLeft: `4px solid ${color}`, opacity: checked ? 0.7 : 1, transition: "opacity 0.15s" }}
        >
            <div className="single-habit-left">
                <div
                    style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: `1.5px solid ${color}`,
                        background: checked ? color : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        transition: "all 0.15s",
                    }}
                >
                    {checked && (
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="1.5,6 5,9.5 10.5,3" />
                        </svg>
                    )}
                </div>
            </div>

            <div className="single-habit-details">
                <div
                    className="single-habit-name"
                    style={{

                        color: checked ? "var(--mantine-color-dimmed)" : undefined,
                        textDecoration: checked ? "line-through" : "none",
                        transition: "all 0.15s",
                    }}
                >
                    {name}
                </div>
                {description && (
                    <div className="single-habit-description" style={{ opacity: checked ? 0.6 : 1 }}>
                        {description}
                    </div>
                )}
            </div>
            <PadlockIcon size="1rem" color="var(--mantine-color-gray-4)" />
        </div>
    )
}