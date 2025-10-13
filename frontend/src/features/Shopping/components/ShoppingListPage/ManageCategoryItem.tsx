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

// helper: focus input and put caret at end
function focusCaretAtEnd(el: HTMLInputElement | null) {
    if (!el) return;
    el.focus({ preventScroll: true });
    const end = el.value.length;
    try {
        el.setSelectionRange(end, end);
    } catch {
        // some input types won't allow setSelectionRange; ignore
    }
}

export const ManageCategoryItem = forwardRef<ManageCategoryItemHandle, Props>(
    ({ categoryName, categoryId, onSave, onCancel }, ref) => {
        const [editing, setEditing] = useState(false);
        const [value, setValue] = useState(categoryName);
        const inputRef = useRef<HTMLInputElement | null>(null);

        useEffect(() => {
            if (!editing) setValue(categoryName);
        }, [categoryName, editing]);

        useImperativeHandle(ref, () => ({
            startEdit: () => {
                if (!editing) setEditing(true);
                // ensure input is mounted before focusing
                requestAnimationFrame(() => focusCaretAtEnd(inputRef.current));
            },
            focus: () => {
                focusCaretAtEnd(inputRef.current);
            },
        }));

        const commit = () => {
            setEditing(false);
            onSave?.(categoryId, value.trim());
        };

        const cancel = () => {
            setValue(categoryName);
            setEditing(false);
            onCancel?.(categoryId);
        };

        return (
            <div className="edit-category-item">
                {!editing && (
                    <div
                        className="edit-category-item-name"

                    >
                        {categoryName}
                    </div>
                )}

                {editing && (
                    <input
                        ref={inputRef}
                        type="text"
                        className="edit-category-input"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onFocus={(e) => {
                            // guard against browsers that auto-select on focus
                            focusCaretAtEnd(e.currentTarget);
                        }}
                        onBlur={commit}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                inputRef.current?.blur(); // triggers commit
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
