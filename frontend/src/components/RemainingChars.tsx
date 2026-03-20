export const RemainingChars = ({ count, max, light }: { count: number; max: number | undefined; light?: boolean }) => {
    return (
        <div className={`remaining-chars-container${light ? " light-variant" : ""}`}>
            <span className={`remaining-chars${count === 0 || count === max ? " remaining-none" : ""}`}>{count}</span>
            /{max}
        </div>
    )
}