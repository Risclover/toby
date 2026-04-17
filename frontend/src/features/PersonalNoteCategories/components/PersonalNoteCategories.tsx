import { useGetCategoriesQuery, type PersonalNoteCategory } from "@/store";
import { Button, Menu, Tooltip, ActionIcon } from "@mantine/core"
import { useState, type MouseEvent, type MouseEventHandler } from "react"
import { FaFolderClosed, FaPlus } from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { IoCloseOutline } from "react-icons/io5";
import { VscClose } from "react-icons/vsc";
import { FaCheck } from "react-icons/fa6";

export const PersonalNoteCategories = ({ setShowNoteCategoryModal }: { setShowNoteCategoryModal: (val: boolean) => void }) => {
    const { data: categories } = useGetCategoriesQuery();
    const [selectedCategory, setSelectedCategory] = useState<PersonalNoteCategory | null>(null);

    const handleCategoryClick = (category: PersonalNoteCategory) => {
        if (selectedCategory === category) {
            setSelectedCategory(null);
        } else {
            setSelectedCategory(category);
        }
    }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "0" }}>
            <Menu radius="md" shadow="xs" withArrow arrowOffset={20} arrowPosition="side">
                <Menu.Target>
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
                        >
                            {selectedCategory
                                ? <div className="category-item-color" style={{ background: selectedCategory.color }} />
                                : <FaFolderClosed size=".825rem" color="var(--mantine-color-gray-7)" />
                            }
                            {selectedCategory ? selectedCategory.name : "Uncategorized"}
                        </Button>
                    </Tooltip>
                </Menu.Target>
                <Menu.Dropdown>
                    {categories?.map(category => (
                        <Menu.Item
                            fw={400}
                            leftSection={<div style={{ background: category.color, color: category.color }} className="category-item-color" />}
                            rightSection={selectedCategory === category && <div className="category-check"><FaCheck color="var(--mantine-color-green-5)" size="1rem" /></div>}
                            key={category.id}
                            color={category.color}
                            onClick={() => handleCategoryClick(category)}
                        >
                            <div className="category-menu-item">
                                {category.name}
                            </div>

                        </Menu.Item>
                    ))}
                    <Menu.Item leftSection={<FaPlus color="var(--mantine-color-gray-7)" size="1rem" />} onClick={() => setShowNoteCategoryModal(true)}>
                        <div className="category-menu-item">
                            Add category
                        </div>
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </div>
    );
};