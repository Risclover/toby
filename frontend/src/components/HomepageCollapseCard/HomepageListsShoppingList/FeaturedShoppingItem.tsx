import { useEffect, useState, type ChangeEvent, type MouseEvent } from "react";
import { Checkbox, Text, Transition } from "@mantine/core";
import { useAuthenticateQuery, useToggleShoppingItemMutation, type ShoppingItem } from "@/store";
import { ShoppingListItemDetailPill } from "@/features/Shopping/components/ShoppingList/ShoppingListItemDetailPill";
import TextSnippetIcon from '@mui/icons-material/TextSnippet';

export type FeaturedShoppingItemProps = {
    item: ShoppingItem;
    listId: number;
    // True only when CHECKING this item will make it leave the array it's
    // currently being rendered from (grouped mode always relocates it into
    // "Checked off"/off-screen; flat mode only does this when completed
    // items are hidden — with them shown, checking just re-sorts within the
    // same visible list, so nothing should fade/unmount).
    fadesOutOnCheck: boolean;
    color: string;
    view: string;
}

// Small delay before an item leaves its current spot, so the user actually
// sees the checkmark land before the item disappears/relocates. Mirrors the
// same pattern already used for tasklist items (setTimeout + Transition).
const DISAPPEAR_DELAY_MS = 300;

export const FeaturedShoppingItem = ({ item, listId, fadesOutOnCheck, color, view }: FeaturedShoppingItemProps) => {
    const { data: user } = useAuthenticateQuery();
    const [toggleItem] = useToggleShoppingItemMutation();

    // Local isChecked here is NOT duplicating the mutation's own optimistic
    // cache patch (that concern is unchanged — toggleShoppingItem still
    // handles its own patch/rollback). This state exists for a different
    // reason: to let the CHECKBOX flip instantly while deliberately delaying
    // WHEN we tell the cache about it, so the item has a moment to visibly
    // sit checked before it disappears/relocates.
    const [isChecked, setIsChecked] = useState(item.isChecked);

    useEffect(() => {
        setIsChecked(item.isChecked);
    }, [item.isChecked]);

    // Only fade/unmount when checking this item will ACTUALLY remove it from
    // the array it's currently rendered from (see fadesOutOnCheck on props).
    // Also gated on canonical item.isChecked (not local isChecked) so an
    // item that was already checked when rendered — e.g. sitting in the
    // "Checked off" section — is never treated as mid-exit.
    const shouldFadeOnCheck = fadesOutOnCheck && !item.isChecked;

    const triggerMutation = async (checked: boolean) => {
        if (!user?.householdId) return;
        try {
            await toggleItem({ itemId: item.id, listId, householdId: user.householdId }).unwrap();
        } catch (err) {
            console.error("Failed to toggle shopping item:", err);
            setIsChecked(!checked); // rollback the visual state on failure
        }
    };

    // Checking always gets the delay, in every mode, per the original ask —
    // long enough to see it checked before anything happens to it, whether
    // that means fading away (grouped mode / hide completed) or just
    // quietly re-sorting in place. Unchecking fires immediately — no delay
    // was ever actually needed there. The "jump on uncheck" that looked like
    // a timing problem was CSS scroll anchoring (fixed in the stylesheet via
    // overflow-anchor: none), not something a delay could have solved.
    const handleToggle = (nextChecked: boolean) => {
        setIsChecked(nextChecked);

        if (nextChecked) {
            setTimeout(() => {
                triggerMutation(nextChecked);
            }, DISAPPEAR_DELAY_MS);
        } else {
            triggerMutation(nextChecked);
        }
    };

    const onRowClick = (e: MouseEvent<HTMLLIElement>) => {
        if (window.getSelection()?.toString().length) return;
        handleToggle(!isChecked);
    };

    const onCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleToggle(e.currentTarget.checked);
    };

    return (
        <Transition
            mounted={shouldFadeOnCheck ? !isChecked : true}
            transition="fade-down"
            duration={DISAPPEAR_DELAY_MS}
            timingFunction="linear"
        >
            {styles => (
                <li
                    className={isChecked ? "featured-completed-item" : ""}
                    onClick={onRowClick}
                    style={{ ...styles, cursor: "pointer" }}
                >
                    <div className="featured-shopping-item--top" onClick={(e) => e.stopPropagation()}>
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: "0.5rem" }}
                        >
                            <Checkbox
                                size="16px"
                                radius="xl"
                                label={item.name}
                                checked={isChecked}
                                onChange={onCheckboxChange}
                                style={{ textDecoration: isChecked ? "line-through" : "none", color: isChecked ? "gray" : "inherit" }}
                                styles={{ root: { alignSelf: "center" }, label: { fontSize: "14px", cursor: "pointer" }, input: { cursor: "pointer" } }}
                                color={color}
                            />
                            {!isChecked && <ShoppingListItemDetailPill item={item} />}
                        </div>
                    </div>
                    {view === "detailed" && <div className="shopping-list-item--bottom">
                        <div className="invisible-wall"></div>
                        {item?.notes && !item.isChecked &&
                            <div className="shopping-list-item-notes">
                                <TextSnippetIcon style={{ color: color }} />
                                <Text size="xs" maw="100%" truncate>{item?.notes}</Text>
                            </div>
                        }
                    </div>}p
                </li>
            )}
        </Transition>
    );
};