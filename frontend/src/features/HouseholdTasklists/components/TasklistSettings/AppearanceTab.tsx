import { ColorInput, Input, Tabs } from "@mantine/core";
import type { TasklistSettingsForm } from "./GeneralTab";
import ColorizeRoundedIcon from "@mui/icons-material/ColorizeRounded";
import { TaskViewSelector } from "./TaskViewSelector";
import { SettingsItem } from "./SettingsItem";

type AppearanceTabProps = {
    form: TasklistSettingsForm;
};

export const AppearanceTab = ({ form }: AppearanceTabProps) => {
    const isTooLight = (hexColor: string) => {
        // 1. Remove hash
        let c = hexColor.replace('#', '');

        // 2. Expand shorthand (3 digits -> 6 digits)
        if (c.length === 3) {
            c = c.split('').map(char => char + char).join('');
        }

        // 3. Safety check: ensure we have 6 chars before parsing
        if (c.length !== 6) return false; // Or handle invalid input

        const r = parseInt(c.substring(0, 2), 16);
        const g = parseInt(c.substring(2, 4), 16);
        const b = parseInt(c.substring(4, 6), 16);

        // Calculate relative luminance
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        return brightness > 240;
    };

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
    )
};