type Props = {
    size: string;
    color: string;
}

export const OverdueIcon = ({ size, color = "currentColor" }: Props) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24" // Standard coordinate system
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Outer Circle - Thin Stroke */}
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke={color}
                strokeWidth="2"
            />

            {/* Exclamation Bar - Narrowed */}
            <path
                d="M12 7V13"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
            />

            {/* Bottom Dot */}
            <circle
                cx="12"
                cy="17"
                r="1"
                fill={color}
            />
        </svg>
    );
}