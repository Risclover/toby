import { ColorInput, Divider, Input, Tabs } from "@mantine/core";
import type { TasklistSettingsForm } from "./GeneralTab";
import ColorizeRoundedIcon from "@mui/icons-material/ColorizeRounded";
import { TaskViewSelector } from "./TaskViewSelector";
import { SettingsItem } from "./SettingsItem";

type AppearanceTabProps = {
    form: TasklistSettingsForm;
};

export const AppearanceTab = ({ form }: AppearanceTabProps) => (
    <Tabs.Panel value="appearance" style={{ flexGrow: 1, overflowY: "auto", padding: "16px", minHeight: 0 }}>
        <SettingsItem
            layout="column"
            label="Tasklist color"
            description="Choose this list's accent color."
            divider={true}
        >
            <ColorInput
                size="sm"
                radius="md"
                placeholder="Choose color"
                eyeDropperIcon={<ColorizeRoundedIcon fontSize="small" />}
                closeOnColorSwatchClick
                {...form.getInputProps('color')}
                swatches={["#fa5252", "#fd7e14", "#fab005", "#82c91e", "#40c057", "#12b886", "#15aabf", "#228be6", "#4c6ef5", "#7950f2", "#be4bdb", "#e64980", "#868e96", "#2e2e2e"]}
            />
        </SettingsItem>
        <div className="tasklist-settings-section view-tasklist-section">
            <div className="input-label-description">
                <Input.Label>Task Display</Input.Label>
            </div>
            <TaskViewSelector
                activeTaskDisplay={form.values.viewMode}
                setActiveTaskDisplay={(val: string) => form.setFieldValue('viewMode', val)}
            />
        </div>
    </Tabs.Panel>
);