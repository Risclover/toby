import { ColorInput, Input, Space, Tabs } from "@mantine/core";
import type { TasklistSettingsForm } from "./GeneralTab";
import ColorizeRoundedIcon from "@mui/icons-material/ColorizeRounded";
import { TaskViewSelector } from "./TaskViewSelector";
import { SettingsItem } from "./SettingsItem";
import { isTooLight } from "@/utils";
import { FormColorInput } from "@/components/FormColorInput";

type AppearanceTabProps = {
    form: TasklistSettingsForm;
};

export const AppearanceTab = ({ form }: AppearanceTabProps) => {
    const hasColorError = isTooLight(form.values.color);

    return (
        <Tabs.Panel value="appearance" style={{ flexGrow: 1, overflowY: "auto", padding: "16px", minHeight: 0 }}>
            <SettingsItem
                layout="column"
                label="Tasklist color"
                labelRequired={hasColorError}
                error="This color is too light. Please choose something darker."
                errorBool={hasColorError}
                description="Choose this list's accent color."
                divider={true}
            >
                <FormColorInput
                    form={form}
                />
            </SettingsItem>
            <div className="tasklist-settings-section view-tasklist-section">
                <div className="input-label-description">
                    <Input.Label>Task Display</Input.Label>
                </div>
                <Space h="xs" />
                <TaskViewSelector
                    activeTaskDisplay={form.values.viewMode}
                    setActiveTaskDisplay={(val: string) => form.setFieldValue('viewMode', val)}
                />
            </div>
        </Tabs.Panel>
    )
};