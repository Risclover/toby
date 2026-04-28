import type { NoteFormValues } from "@/features/PersonalNotes/components/CreatePersonalNote";
import { useGetCategoriesQuery, type PersonalNoteCategory } from "@/store";
import { getContrastTextColor } from "@/utils/getContrastTextColor";
import { getLightColor } from "@/utils/getLightColor";
import { Button, Menu, Tooltip } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import { type MouseEvent } from "react";
import { FaFolderClosed, FaPlus } from "react-icons/fa6";
import { FaCheck } from "react-icons/fa6";

type Props = {
    setShowNoteCategoryModal: (val: boolean) => void;
    selectedCategory: PersonalNoteCategory | null;
    onSelectCategory: (category: PersonalNoteCategory | null) => void;
    isSmallScreen?: boolean;
    onOpenDrawer?: () => void;
    form: UseFormReturnType<NoteFormValues, (values: NoteFormValues) => NoteFormValues>;
};

export const PersonalNoteCategories = ({
    setShowNoteCategoryModal,
    selectedCategory,
    onSelectCategory,
    isSmallScreen,
    onOpenDrawer,
    form
}: Props) => {
    const { data: categories } = useGetCategoriesQuery();

    const handleCategoryClick = (category: PersonalNoteCategory) => {
        onSelectCategory(selectedCategory === category ? null : category);
        setShowNoteCategoryModal(false);
        form.setFieldValue("categoryId", category.id)
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
                styles={{
                    root: { border: `1px solid ${selectedCategory?.color || "#000000"}` }
                }}
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
                    fw={500}
                    leftSection={<div style={{ background: category.color }} className="category-item-color" />}
                    rightSection={selectedCategory === category
                        ? <FaCheck color="var(--mantine-color-green-5)" size="1rem" />
                        : null
                    }
                    key={category.id}
                    onClick={() => handleCategoryClick(category)}
                    color={category.color}
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

    const buttonContent = (
        <>
            {!selectedCategory ?
                < FaFolderClosed size=".825rem" color="var(--mantine-color-gray-7)" /> : null
            }
            {selectedCategory ? selectedCategory.name : "Uncategorized"}
        </>
    );

    const buttonProps = {
        size: "xs" as const,
        fw: 500,
        variant: "light" as const,
        className: "personal-note-form-category",
        color: selectedCategory?.color || "var(--mantine-color-gray-7)",
        styles: {
            label: {
                color: selectedCategory ? getContrastTextColor(selectedCategory.color) : undefined,
            }
        },
        style: {
            borderTopRightRadius: selectedCategory ? 0 : undefined,
            borderBottomRightRadius: selectedCategory ? 0 : undefined,
        },
    };

    if (isSmallScreen) {
        return (
            <div style={{ display: "flex", alignItems: "center" }}>
                <Tooltip withArrow label="Choose category">
                    <Button {...buttonProps} onClick={onOpenDrawer}>
                        {buttonContent}
                    </Button>
                </Tooltip>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            <Menu radius="md" shadow="xs" withArrow arrowOffset={20} arrowPosition="side">
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
                            rightSection={
                                selectedCategory === category && (
                                    <div className="category-check"><FaCheck color={category.color} size="1rem" /></div>
                                )
                            }
                            key={category.id}
                            color={category.color}
                            onClick={() => handleCategoryClick(category)}
                            style={{
                                color: "black",
                                "--item-bg": category.color ? getLightColor(category.color) : "transparent",
                            } as React.CSSProperties}
                            className={`category-menu-item${selectedCategory === category ? " active" : ""}`}
                        >
                            {category.name}

                        </Menu.Item>
                    ))}
                    <Menu.Item leftSection={<FaPlus color="var(--mantine-color-gray-7)" size="18px" />} onClick={() => setShowNoteCategoryModal(true)}>
                        <div className="category-menu-item">
                            Add category
                        </div>
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </div >
    );

};

