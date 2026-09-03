import type { EventAttendee, User } from "@/store";

type Props = {
    color: string;
    name: string;
    ref?: React.Ref<HTMLSpanElement>;
    opened: boolean;
    setOpened: (val: boolean) => void;
};

export const MemberDot = ({ ref, color, name, opened, setOpened }: Props) => {
    return <span
        tabIndex={0}
        onFocus={() => setOpened(true)}
        onBlur={() => setOpened(false)}
        onMouseEnter={() => setOpened(true)}
        onMouseLeave={() => setOpened(false)}
        onTouchStart={(e) => {
            e.stopPropagation();
            setOpened(true);
        }}
        onClick={(e) => {
            e.stopPropagation();
            setOpened(!opened);
        }}
        className="events-member-dot" role="img" ref={ref} aria-label={name} style={{ '--dot-color': color } as React.CSSProperties} />;
};