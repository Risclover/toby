import { Tooltip } from "@mantine/core";
import { toDotCssColor } from "../../utils/cssColors";

type Props = {
    colors: string[];
    names?: string[];
};

export function EventColorDots({ colors, names }: Props) {
    return (
        <div style={{ display: "flex", gap: 3, flexShrink: 0, marginLeft: "6px" }}>
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