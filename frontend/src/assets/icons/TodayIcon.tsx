type Props = {
    size: string;
    color: string;
}

export const TodayIcon = ({ size, color }: Props) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Outer Circle - Thin Stroke (1.5 matches the exclamation) */}
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke={color}
                strokeWidth="2"
            />

            {/* Checkmark - Narrow and Crisp */}
            <path
                d="M8 12.5L11 15.5L16 9.5"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}