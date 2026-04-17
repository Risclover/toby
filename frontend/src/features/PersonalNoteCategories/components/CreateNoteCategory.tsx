import { FormColorInput } from "@/components/FormColorInput";
import { useCreateNoteCategoryMutation, useGetCategoriesQuery } from "@/store/noteCategorySlice";
import { Button, Modal, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form";
import "../styles/PersonalNoteCategories.css"

interface CreateCategoryForm {
    name: string;
    color?: string;
}

type Props = {
    opened: boolean;
    close: () => void;
}
export const CreateNoteCategory = ({ opened, close }: Props) => {
    const [createCategory] = useCreateNoteCategoryMutation();
    const { data: categories } = useGetCategoriesQuery();
    console.log('CATEGORIES:', categories)
    const form = useForm<CreateCategoryForm>({
        initialValues: {
            name: "",
            color: ""
        },
        validate: {
            'name': (value) => value.trim().length === 0 && "Name required"
        }
    })

    const handleSubmit = form.onSubmit(async () => {
        const data = await createCategory({
            name: form.values.name,
            color: form.values.color || ""
        }).unwrap();

        console.log('new category:', data);

        form.reset();
        close();
    })

    if (!categories) return null;

    return (
        <Modal opened={opened} onClose={close} title="Create notes category" radius="md" size="md">
            <form onSubmit={handleSubmit}>
                <TextInput
                    label="Name"
                    required
                    radius="md"
                    {...form.getInputProps("name")}
                />

                <FormColorInput form={form} required={false} />

                <Button type="submit">Submit</Button>
            </form>
            <div className="categories-list">
                {categories.map(category => <div className="single-category"><div className="category-color" style={{ backgroundColor: category.color }}></div>{category?.name}</div>)}
            </div>
        </Modal>
    )
}