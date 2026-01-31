import { useRef, useState } from "react";

export function InlineEditable({
    value,
    onSave,
    placeholder,
    className,
}: {
    value: string;
    onSave: (next: string) => void | Promise<void>;
    placeholder?: string;
    className?: string;
}) {
    const [editing, setEditing] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const commit = async () => {
        const next = ref.current?.innerText ?? "";
        if (next !== value) await onSave(next);
        setEditing(false);
    };

    return (
        <div
            ref={ref}
            className={`editable-title ${editing ? "is-editing" : "is-view"} ${className ?? ""}`}
            contentEditable={editing}
            suppressContentEditableWarning
            onClick={() => setEditing(true)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } if (e.key === "Escape") { document.execCommand("undo"); setEditing(false); } }}
            data-placeholder={placeholder}
        >
            {value}
        </div>
    );
}