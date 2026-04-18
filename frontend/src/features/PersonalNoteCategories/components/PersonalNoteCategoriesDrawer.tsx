import { useGetCategoriesQuery, type PersonalNoteCategory } from "@/store";
import { Drawer, Menu } from "@mantine/core";
import { useIsSmallScreen } from "@/hooks";
import { FaPlus } from "react-icons/fa6";
import { FaCheck } from "react-icons/fa6";
import { getLightColor } from "@/utils/getLightColor";
import type { UseFormReturnType } from "@mantine/form";
import type { NoteFormValues } from "@/features/PersonalNotes/components/CreatePersonalNote";

type Props = {
    showNoteCategoryDrawer: boolean;
    setShowNoteCategoryDrawer: (val: boolean) => void;
    setShowNoteCategoryModal: (val: boolean) => void;
    selectedCategory: PersonalNoteCategory | null;
    onSelectCategory: (category: PersonalNoteCategory | null) => void;
    form: UseFormReturnType<NoteFormValues, (values: NoteFormValues) => NoteFormValues>;
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

    const handleCategoryClick = (category: PersonalNoteCategory) => {
        onSelectCategory(selectedCategory === category ? null : category);
        setShowNoteCategoryDrawer(false);

        form.setFieldValue("categoryId", category.id)
    };

    return (
        <Drawer
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
                },
            }}
            opened={showNoteCategoryDrawer}
            onClose={() => setShowNoteCategoryDrawer(false)}
            position="bottom"
            withCloseButton={false}
        >
            <div className="h-1 w-12 bg-muted mx-auto rounded-full mb-4" />
            <div className="category-drawer-items">
                {categories?.map(category => (
                    <div
                        key={category.id}
                        className={`category-drawer-item ${selectedCategory === category ? "active" : ""}`}
                        onClick={() => handleCategoryClick(category)}
                        style={{
                            color: category.color,
                            "--item-bg": category.color ? getLightColor(category.color) : "transparent",
                        } as React.CSSProperties}
                    >
                        <div className="category-drawer-item-details">
                            <div style={{ background: category.color }} className="category-item-color" />
                            <span className="category-drawer-item-name">{category.name}</span>
                        </div>
                        {selectedCategory === category && (
                            <span className="category-drawer-check"><FaCheck color="var(--mantine-color-green-5)" size="20px" /></span>
                        )}
                    </div>
                ))}
                <div
                    className="category-drawer-item add-note-category"
                    onClick={() => {
                        setShowNoteCategoryModal(true);
                        setShowNoteCategoryDrawer(false);
                    }}
                >
                    <FaPlus color="var(--mantine-color-gray-7)" size="20px" />
                    Add category
                </div>
            </div>
        </Drawer >
    );
};