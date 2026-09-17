import { Tooltip } from "@mantine/core";
import { toDotCssColor } from "../../utils/getEventColors";

type Props = {
    colors: string[];
    /**
     * Parallel to `colors` -- when provided, each dot shows that member's
     * name in a tooltip (hover on desktop, tap on mobile). Omit to render
     * plain dots with no tooltip, e.g. the grid event chips, which don't
     * want this.
     */
    names?: string[];
};

export function EventMemberDots({ colors, names }: Props) {
    return (
        <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
            {colors.map((color, i) => {
                const dotStyle = {
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: toDotCssColor(color),
                    flexShrink: 0,
                    marginLeft: "-6px",
                    border: "1px solid white",
                } as const;
                const name = names?.[i];

                if (!name) {
                    return <span key={i} style={dotStyle} />;
                }

                return (
                    <Tooltip key={i} label={name} withArrow events={{ hover: true, focus: true, touch: true }}>
                        <span style={dotStyle} />
                    </Tooltip>
                );
            })}
        </div>
    );
}