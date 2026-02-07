type Props = {
    size: string;
    color: string;
}

export const SoonIcon = ({ size, color }: Props) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Outer Circle - 1.5 Stroke to match the set */}
            <circle
                cx="12"
                cy="12"
                r="10"
                stroke={color}
                strokeWidth="2"
            />

            {/* Up Arrow - Skinny and centered */}
            <path
                d="M12 16V8M12 8L8 12M12 8L16 12"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}