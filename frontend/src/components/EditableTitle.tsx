import { useLayoutEffect, useEffect, useRef, useState, type KeyboardEvent } from "react";
import TextareaAutosize from "react-textarea-autosize";

type Props = {
    title?: string;
    onSave: (next: string) => Promise<void> | void;
    className?: string;
    placeholder?: string;
    allowEmpty?: boolean;
};

export function EditableTitle({ title, onSave, className, placeholder, allowEmpty }: Props) {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState<string>(title ?? "");
    const [saving, setSaving] = useState(false);
    const [optimistic, setOptimistic] = useState<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Sync from prop when not editing and not in optimistic state
    useEffect(() => {
        if (!editing && optimistic == null) setValue(title ?? "");
    }, [title, editing, optimistic]);

    // Clear optimistic once server catches up
    useEffect(() => {
        if (optimistic != null && title === optimistic) setOptimistic(null);
    }, [title, optimistic]);

    // Focus + move caret to end when entering edit mode
    useLayoutEffect(() => {
        if (!editing) return;
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        const len = el.value.length;
        // Safari/iOS sometimes needs a tick
        requestAnimationFrame(() => el.setSelectionRange(len, len));
    }, [editing]);

    const commit = async () => {
        const next = value.trim(); // or value.trim() if you want trimming

        if (!allowEmpty && next === "") {
            setValue(title ?? "");        // revert to original
            setEditing(false);
            return;
        }

        if (next !== (title ?? "")) {
            try {
                setSaving(true);
                setOptimistic(next);
                await onSave(next);     // <-- always send what you see
            } finally {
                setSaving(false);
            }
        } else {
            setValue(title ?? "");
        }
        setEditing(false);
    };

    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") {
            setValue(title ?? "");
            setEditing(false);
        }
    };

    const displayTitle = optimistic ?? (title ?? "");

    const base = "editable-title";
    const viewCls = `${className ?? ""} ${base} is-view`;
    const editCls = `${className ?? ""} ${base} is-editing`;

    return editing ? (
        <TextareaAutosize
            ref={inputRef}
            className={editCls}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
            disabled={saving}
            aria-label="Edit list title"
            minRows={1}
            maxRows={10}
        />
    ) : (
        <div
            role="button"
            tabIndex={0}
            aria-label="Edit list title"
            title="Click to edit"
            className={viewCls}
            onClick={() => setEditing(true)}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setEditing(true)}
        >
            {displayTitle}
        </div>
    );
}
