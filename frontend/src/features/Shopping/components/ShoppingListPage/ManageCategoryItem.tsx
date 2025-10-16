import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";

export type ManageCategoryItemHandle = {
    startEdit: () => void;
    focus: () => void;
};

type Props = {
    categoryName: string;
    categoryId: number;
    onSave?: (id: number, next: string) => void;
    onCancel?: (id: number) => void;
};

// focus helper
function focusCaretAtEnd(el: HTMLInputElement | null) {
    if (!el) return;
    el.focus({ preventScroll: true });
    const end = el.value.length;
    try { el.setSelectionRange(end, end); } catch { }
}

export const ManageCategoryItem = forwardRef<ManageCategoryItemHandle, Props>(
    ({ categoryName, categoryId, onSave, onCancel }, ref) => {
        const [editing, setEditing] = useState(false);
        const [value, setValue] = useState(categoryName);
        const inputRef = useRef<HTMLInputElement | null>(null);

        // Remember the last prop we saw so we only resync on real prop changes
        const lastPropNameRef = useRef(categoryName);

        useEffect(() => {
            // If prop changed externally (not our own commit), adopt it when not editing
            if (!editing && categoryName !== lastPropNameRef.current) {
                lastPropNameRef.current = categoryName;
                setValue(categoryName);
            }
        }, [categoryName, editing]);

        useImperativeHandle(ref, () => ({
            startEdit: () => {
                if (!editing) setEditing(true);
                requestAnimationFrame(() => focusCaretAtEnd(inputRef.current));
            },
            focus: () => focusCaretAtEnd(inputRef.current),
        }));

        const commit = () => {
            const next = value?.trim();
            setEditing(false);
            // Do NOT overwrite local value from prop; we already show `value` below
            onSave?.(categoryId, next);
            // When server/cache updates `categoryName`, effect above will sync if it truly changed
        };

        const cancel = () => {
            // revert local value to the last known prop
            setValue(lastPropNameRef.current);
            setEditing(false);
            onCancel?.(categoryId);
        };

        return (
            <div className="edit-category-item">
                {!editing && (
                    <div className="edit-category-item-name">
                        {value /* ← show local value to avoid snap-back */}
                    </div>
                )}

                {editing && (
                    <input
                        ref={inputRef}
                        type="text"
                        className="edit-category-input"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onFocus={(e) => focusCaretAtEnd(e.currentTarget)}
                        onBlur={commit}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                inputRef.current?.blur(); // triggers commit()
                            } else if (e.key === "Escape") {
                                e.preventDefault();
                                cancel();
                            }
                        }}
                    />
                )}
            </div>
        );
    }
);
