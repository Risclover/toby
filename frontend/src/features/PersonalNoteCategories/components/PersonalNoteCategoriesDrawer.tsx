import { useGetCategoriesQuery, type PersonalNoteCategory } from "@/store";
import { Drawer, Menu } from "@mantine/core";
import { useIsSmallScreen } from "@/hooks";
import { FaPlus } from "react-icons/fa6";
import { FaCheck } from "react-icons/fa6";
import { getLightColor } from "@/utils/getLightColor";
import type { UseFormReturnType } from "@mantine/form";
import { getContrastTextColor } from "@/utils/getContrastTextColor";
import { FaPencilAlt } from "react-icons/fa";
import { PiNotePencilFill } from "react-icons/pi";
import { useState } from "react";
import { ManageCategories } from "./ManageCategories";

type Props = {
    showNoteCategoryDrawer: boolean;
    setShowNoteCategoryDrawer: (val: boolean) => void;
    setShowNoteCategoryModal: (val: boolean) => void;
    selectedCategory: PersonalNoteCategory | null;
    onSelectCategory: (category: PersonalNoteCategory | null) => void;
    form: UseFormReturnType<{
        title: string;
        body: string;
        isPrivate: boolean;
        categoryId: number | undefined;
    }, (values: {
        title: string;
        body: string;
        isPrivate: boolean;
        categoryId: number | undefined;
    }) => {
        title: string;
        body: string;
        isPrivate: boolean;
        categoryId: number | undefined;
    }>
};

export const PersonalNoteCategoriesDrawer = ({
    showNoteCategoryDrawer,
    setShowNoteCategoryDrawer,
    setShowNoteCategoryModal,
    selectedCategory,
    onSelectCategory,
    form
}: Props) => {
    const isSmall = useIsSmallScreen();
    const { data: categories } = useGetCategoriesQuery();
    const [showManageCategories, setShowManageCategories] = useState(false);

    const handleCategoryClick = (category: PersonalNoteCategory) => {
        onSelectCategory(selectedCategory === category ? null : category);
        setShowNoteCategoryDrawer(false);

        form.setFieldValue("categoryId", category.id)
    };

    return (
        <>
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
                        paddingTop: 0
                    },
                }}
                opened={showNoteCategoryDrawer}
                onClose={() => setShowNoteCategoryDrawer(false)}
                position="bottom"
                withCloseButton={true}
            >
                <div className="category-drawer-items">
                    {categories?.map(category => (
                        <div
                            key={category.id}
                            className={`category-drawer-item ${selectedCategory === category ? "active" : ""}`}
                            onClick={() => handleCategoryClick(category)}
                            style={{
                                // color: category.color,
                                "--item-bg": category.color ? getLightColor(category.color) : "transparent",
                                color: getContrastTextColor(category.color)
                            } as React.CSSProperties}
                        >
                            <div className="category-drawer-item-details">
                                <div style={{ background: category.color }} className="category-item-color" />
                                <span className="category-drawer-item-name">{category.name}</span>
                            </div>
                            {selectedCategory === category && (
                                <span className="category-drawer-check"><FaCheck color={category.color} size="1rem" /></span>
                            )}
                        </div>
                    ))}
                    <div style={{ borderTop: categories && categories.length > 0 ? "1px solid var(--mantine-color-gray-4)" : "", marginTop: categories && categories.length > 0 ? ".5rem" : "", paddingTop: categories && categories.length > 0 ? ".5rem" : "" }} className="category-drawer-extra-options">
                        <div
                            className={`category-drawer-item add-note-category ${categories && categories.length >= 10 ? "add-category-disabled" : ""}`}
                            onClick={() => {
                                setShowNoteCategoryModal(true);
                                setShowNoteCategoryDrawer(false);
                            }}
                        >
                            <div className="add-note-category"><FaPlus color="var(--mantine-color-gray-7)" size="18px" />
                                Add category</div>
                            <div style={{ justifySelf: "flex-end", alignSelf: "flex-end", fontSize: "12px" }}>{categories && categories.length >= 10 ? <div style={{ color: "red", marginLeft: ".25rem" }}>Limit reached</div> : `(Used: ${categories?.length}/10)`}</div>
                        </div>
                        {categories && categories.length > 0 && <div className="category-drawer-item manage-note-category" onClick={() => { setShowNoteCategoryDrawer(false); setShowManageCategories(true); }}>
                            <PiNotePencilFill color="var(--mantine-color-gray-7)" size="18px" />
                            Manage categories
                        </div>}
                    </div>
                </div>
            </Drawer>
            <ManageCategories opened={showManageCategories} setShowManageCategories={setShowManageCategories} />
        </>
    );
};