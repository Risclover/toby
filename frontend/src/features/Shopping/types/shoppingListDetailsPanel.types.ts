import type { ShoppingItem } from "@/store";

export type DraftState = {
    name: string;
    quantity: number | "";
    unit: string;
    categoryId: number | null;
    notes: string;
}

export const buildDraft = (item: ShoppingItem): DraftState => ({
    name: item.name,
    quantity: item.quantity ?? "",
    unit: item.unit ?? "",
    categoryId: item.categoryId ?? null,
    notes: item.notes ?? "",
});

export const isDirty = (draft: DraftState, original: DraftState): boolean =>
    draft.name !== original.name ||
    draft.quantity !== original.quantity ||
    draft.unit !== original.unit ||
    draft.categoryId !== original.categoryId ||
    draft.notes !== original.notes;