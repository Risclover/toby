import { toDotCssColor } from "../../utils/getEventColors";

export function EventMemberDots({ colors }: { colors: string[] }) {
    return (
        <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
            {colors.map((color, i) => (
                <span
                    key={i}
                    style={{
                        width: 11,
                        height: 11,
                        borderRadius: "50%",
                        background: toDotCssColor(color),
                        flexShrink: 0,
                        marginLeft: "-6px",
                        border: "1px solid white"
                    }}
                />
            ))}
        </div>
    );
}