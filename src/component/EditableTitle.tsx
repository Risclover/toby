import { useEffect, useRef, useState, type KeyboardEvent } from "react";

type Props = {
    title: string;
    onSave: (next: string) => Promise<void> | void;
    className?: string;
};

export function EditableTitle({ title, onSave, className }: Props) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState<string>(title);
    const [saving, setSaving] = useState(false);
    const [optimistic, setOptimistic] = useState<string | null>(null); // <- new
    const inputRef = useRef<HTMLInputElement>(null);

    // When not editing, keep local value in sync with prop UNLESS we have an optimistic value
    useEffect(() => {
        if (!editing && optimistic == null) setValue(title);
    }, [title, editing, optimistic]);

    // Clear optimistic once the prop matches it (server has caught up)
    useEffect(() => {
        if (optimistic != null && title === optimistic) setOptimistic(null);
    }, [title, optimistic]);

    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    const commit = async () => {
        const trimmed = value.trim();
        if (trimmed && trimmed !== title) {
            try {
                setSaving(true);
                setOptimistic(trimmed);          // show new title immediately
                await onSave(trimmed);
            } catch {
                // rollback optimistic on error
                setOptimistic(null);
                setValue(title);
            } finally {
                setSaving(false);
            }
        } else {
            setValue(title);
        }
        setEditing(false);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
            setValue(title);
            setEditing(false);
        }
    };

    const displayTitle = optimistic ?? title; // <- use optimistic if present

    return editing ? (
        <input
            ref={inputRef}
            className={className}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
            disabled={saving}
            aria-label="Edit list title"
        />
    ) : (
        <div role="button"
            tabIndex={0}
            aria-label="Edit list title"
            title="Click to edit"
            className="editable-title"
            onClick={() => setEditing(true)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setEditing(true)}
        >
            {displayTitle || "Untitled"}
        </div>
    );
}
