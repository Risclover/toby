export const RemainingChars = ({ count, max }: { count: number; max: number }) => {
    return (
        <div className="remaining-chars-container">
            <span className={`remaining-chars${count === 0 ? " remaining-none" : ""}`}>{count}</span>
            /{max}
        </div>
    )
}