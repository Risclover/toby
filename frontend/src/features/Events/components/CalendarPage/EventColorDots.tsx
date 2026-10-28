import { Tooltip } from "@mantine/core";
import { toDotCssColor } from "../../utils/cssColors";
import type { EventMember } from "../../utils/eventColorPayload";
import { MemberTooltipLabel } from "./MemberTooltipLabel";

type Props = {
    colors: string[];
    /** Same order as `colors`; a dot with no matching member gets no tooltip. */
    members?: EventMember[];
};

const CONTAINER_STYLE = { display: "flex", gap: 3, flexShrink: 0, marginLeft: "6px" } as const;

const DOT_STYLE = {
    width: 11,
    height: 11,
    borderRadius: "50%",
    flexShrink: 0,
    marginLeft: "-6px",
    border: "1px solid white",
} as const;

export function EventColorDots({ colors, members }: Props) {
    return (
        <div style={CONTAINER_STYLE}>
            {colors.map((color, i) => {
                const dotStyle = { ...DOT_STYLE, background: toDotCssColor(color) };
                const member = members?.[i];

                if (!member) {
                    return <span key={i} style={dotStyle} />;
                }

                return (
                    <Tooltip
                        key={i}
                        label={<MemberTooltipLabel member={member} />}
                        withArrow
                        events={{ hover: true, focus: true, touch: true }}
                    >
                        <span style={dotStyle} />
                    </Tooltip>
                );
            })}
        </div>
    );
}