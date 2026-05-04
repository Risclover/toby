import { useState } from "react";
import { Button, Drawer, Menu, Tooltip } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";

import type { NoteFormValues } from "@/features";
import { ManageCategories, CreateNoteCategory } from "..";
import { CategoryPickerFooter } from "./CategoryPickerFooter";
import { useIsSmallScreen } from "@/hooks";
import { useCategoryPicker } from "../../hooks";
import type { PersonalNoteCategory } from "@/store";
import { getContrastTextColor, getLightColor } from "@/utils";

import { FaCheck } from "react-icons/fa6";

type Props = {
    /** The currently selected category, or null if uncategorized. */
    selectedCategory: PersonalNoteCategory | null;
    /** Called when a category is selected/deselected. */
    onSelectCategory: (category: PersonalNoteCategory | null) => void;
    /** The note form instance. */
    form: UseFormReturnType<NoteFormValues, (values: NoteFormValues) => NoteFormValues>;
}

/**
 * Category picker for the note creation form.
 *
 * Renders a dropdown menu on larger screens and a bottom drawer on small screens.
 * Owns all category-related sub-modal state internally.
 */
export const CategoryPicker = ({ selectedCategory, onSelectCategory, form }: Props) => {
    const isSmall = useIsSmallScreen();
    const [menuOpen, setMenuOpen] = useState(false);

    const {
        isSmallScreen,
        showDrawer,
        setShowDrawer,
        showCreateModal,
        setShowCreateModal,
        showManageCategories,
        setShowManageCategories,
        categories,
        handleCategoryClick,
        handleDrawerCategoryClick,
        handleAddCategory,
        handleManageOpen,
        buttonContent,
        buttonProps,
    } = useCategoryPicker({ selectedCategory, onSelectCategory, form });

    return (
        <>
            {isSmallScreen ? (
                <>
                    <div className="category-picker-small">
                        <Tooltip withArrow label="Choose category">
                            <Button {...buttonProps} onClick={() => setShowDrawer(true)}>
                                {buttonContent}
                            </Button>
                        </Tooltip>
                    </div>
                    <Drawer
                        title="Categories"
                        className="filter-drawer"
                        size="auto"
                        styles={{
                            content: {
                                height: "min-content",
                                borderTopLeftRadius: "1rem",
                                borderTopRightRadius: "1rem",
                            },
                            body: {
                                padding: isSmall ? ".5rem" : ".75rem",
                                paddingTop: 0,
                            },
                        }}
                        opened={showDrawer}
                        onClose={() => setShowDrawer(false)}
                        position="bottom"
                        withCloseButton
                    >
                        <div className="category-drawer-items">
                            {categories?.map(category => (
                                <div
                                    key={category.id}
                                    className={`category-drawer-item${selectedCategory?.id === category.id ? " active" : ""}`}
                                    onClick={() => handleDrawerCategoryClick(category)}
                                    style={{
                                        "--item-bg": category.color ? getLightColor(category.color) : "transparent",
                                        color: getContrastTextColor(category.color),
                                    } as React.CSSProperties}
                                >
                                    <div className="category-drawer-item-details">
                                        <div style={{ background: category.color }} className="category-item-color" />
                                        <span className="category-drawer-item-name">{category.name}</span>
                                    </div>
                                    {selectedCategory?.id === category.id && (
                                        <span className="category-drawer-check">
                                            <FaCheck color={category.color} size="1rem" />
                                        </span>
                                    )}
                                </div>
                            ))}
                            <CategoryPickerFooter
                                categoryCount={categories?.length ?? 0}
                                onAddClick={handleAddCategory}
                                onManageClick={handleManageOpen}
                            />
                        </div>
                    </Drawer>
                </>
            ) : (
                <Menu
                    opened={menuOpen}
                    onChange={setMenuOpen}
                    radius="md"
                    shadow="xs"
                    withArrow
                    arrowOffset={20}
                    arrowPosition="side"
                    closeOnEscape
                >
                    <Tooltip withArrow label="Choose category">
                        <Menu.Target>
                            <Button autoContrast {...buttonProps}>
                                {buttonContent}
                            </Button>
                        </Menu.Target>
                    </Tooltip>
                    <Menu.Dropdown>
                        {categories?.map(category => (
                            <Menu.Item
                                fw={400}
                                leftSection={
                                    <div style={{ background: category.color }} className="category-item-color" />
                                }
                                rightSection={selectedCategory?.id === category.id && (
                                    <div className="category-check">
                                        <FaCheck color={category.color} size="1rem" />
                                    </div>
                                )}
                                key={category.id}
                                color={category.color}
                                onClick={() => handleCategoryClick(category)}
                                style={{
                                    "--item-bg": category.color ? getLightColor(category.color) : "transparent",
                                    color: getContrastTextColor(category.color),
                                } as React.CSSProperties}
                                className={`category-menu-item${selectedCategory?.id === category.id ? " active" : ""}`}
                            >
                                {category.name}
                            </Menu.Item>
                        ))}
                        <CategoryPickerFooter
                            categoryCount={categories?.length ?? 0}
                            onAddClick={() => {
                                setMenuOpen(false);
                                setShowCreateModal(true);
                            }}
                            onManageClick={() => {
                                setMenuOpen(false);
                                handleManageOpen();
                            }}
                        />
                    </Menu.Dropdown>
                </Menu>
            )}

            <CreateNoteCategory
                opened={showCreateModal}
                close={() => setShowCreateModal(false)}
                onCategoryCreated={(cat) => {
                    onSelectCategory(cat);
                    form.setFieldValue("categoryId", cat.id);
                }}
            />

            <ManageCategories
                opened={showManageCategories}
                setShowManageCategories={setShowManageCategories}
            />
        </>
    );
};