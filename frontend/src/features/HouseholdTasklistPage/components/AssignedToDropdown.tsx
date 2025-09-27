import { useGetHouseholdQuery } from "@/store/householdSlice";
import { useGetTodoListQuery } from "@/store/todoSlice";
import { Combobox, Input, InputBase, useCombobox } from "@mantine/core"
import { useState } from "react";

type Props = {
    householdId: number | undefined;
    listId: number;
}

export const AssignedToDropdown = ({ householdId, listId }: Props) => {
    const [value, setValue] = useState();
    const { data: household } = useGetHouseholdQuery(householdId)
    const { data: todoList } = useGetTodoListQuery(listId)

    const membersList = household?.members.filter(member => todoList?.memberIds?.includes(member.id)).map((member) => { return { id: member.id, profileImg: member.profileImg, username: member.username } })
    const memberOptions = membersList?.map((m) => ({ value: String(m.id), label: <><img src={m.profileImg} />{m.username}</> })) ?? [];

    const combobox = useCombobox({
        onDropdownClose: () => combobox.resetSelectedOption(),
    });

    const options = membersList.map((item) => (
        <Combobox.Option value={item} key={item.id}>
            <><img src={item.profileImg} />{item.username}</>
        </Combobox.Option>
    ));

    return <Combobox store={combobox}
        onOptionSubmit={(val) => {
            setValue(val);
            combobox.closeDropdown();
        }}>
        <Combobox.Target>
            <InputBase
                component="button"
                type="button"
                pointer
                rightSection={<Combobox.Chevron />}
                rightSectionPointerEvents="none"
                onClick={() => combobox.toggleDropdown()}
            >
                {value || <Input.Placeholder>Pick value</Input.Placeholder>}
            </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown>
            <Combobox.Options>{options}</Combobox.Options>
        </Combobox.Dropdown>
    </Combobox>
}