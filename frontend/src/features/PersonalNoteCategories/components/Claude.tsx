import { useGetCategoriesQuery, type PersonalNoteCategory } from "@/store";
import { Button, Menu, Tooltip } from "@mantine/core";
import { type MouseEvent } from "react";
import { FaFolderClosed, FaPlus } from "react-icons/fa6";
import { FaCheck } from "react-icons/fa6";

type Props = {
    setShowNoteCategoryModal: (val: boolean) => void;
    selectedCategory: PersonalNoteCategory | null;
    onSelectCategory: (category: PersonalNoteCategory | null) => void;
    isSmallScreen?: boolean;
    onOpenDrawer?: () => void;
};

export const PersonalNoteCategories = ({
    setShowNoteCategoryModal,
    selectedCategory,
    onSelectCategory,
    isSmallScreen,
    onOpenDrawer,
}: Props) => {
    const { data: categories } = useGetCategoriesQuery();

    const handleCategoryClick = (category: PersonalNoteCategory) => {
        onSelectCategory(selectedCategory === category ? null : category);
    };

    const triggerButton = (
        <Tooltip withArrow label="Choose category">
            <Button
                size="xs"
                fw={500}
                variant="light"
                className="personal-note-form-category"
                color={selectedCategory ? selectedCategory.color : "var(--mantine-color-gray-7)"}
                style={{
                    borderTopRightRadius: selectedCategory ? 0 : undefined,
                    borderBottomRightRadius: selectedCategory ? 0 : undefined,
                }}
                onClick={isSmallScreen ? onOpenDrawer : undefined}
            >
                {selectedCategory
                    ? <div className="category-item-color" style={{ background: selectedCategory.color }} />
                    : <FaFolderClosed size=".825rem" color="var(--mantine-color-gray-7)" />
                }
                {selectedCategory ? selectedCategory.name : "Uncategorized"}
            </Button>
        </Tooltip>
    );

    const menuItems = (
        <>
            {categories?.map(category => (
                <Menu.Item
                    fw={400}
                    leftSection={<div style={{ background: category.color }} className="category-item-color" />}
                    rightSection={selectedCategory === category
                        ? <FaCheck color="var(--mantine-color-green-5)" size="1rem" />
                        : null
                    }
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                >
                    {category.name}
                </Menu.Item>
            ))}
            <Menu.Item
                leftSection={<FaPlus color="var(--mantine-color-gray-7)" size="1rem" />}
                onClick={() => setShowNoteCategoryModal(true)}
            >
                Add category
            </Menu.Item>
        </>
    );

    if (isSmallScreen) {
        return <div style={{ display: "flex", alignItems: "center" }}>{triggerButton}</div>;
    }

    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            <Menu radius="md" shadow="xs" withArrow arrowOffset={20} arrowPosition="side">
                <Menu.Target>{triggerButton}</Menu.Target>
                <Menu.Dropdown>{menuItems}</Menu.Dropdown>
            </Menu>
        </div>
    );
};