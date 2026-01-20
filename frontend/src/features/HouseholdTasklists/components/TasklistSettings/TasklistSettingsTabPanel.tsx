import { Tabs } from "@mantine/core"

export const TasklistSettingsTabPanel = () => {
    return (
        <Tabs.Panel
            value="appearance"
            style={{
                flexGrow: 1,
                overflowY: "auto",
                padding: "16px",
                minHeight: 0,
            }}
        >
            <div className="tasklist-settings-section section-column">
                <div className="input-label-description">
                    <Input.Label>Tasklist color</Input.Label>
                    <Input.Description>Choose this list's accent color. Accepts all valid color formats. </Input.Description>
                </div>
                <ColorInput
                    size="sm"
                    radius="md"
                    placeholder="Choose color"
                    defaultValue="#15aabf"
                    eyeDropperIcon={<ColorizeRoundedIcon fontSize="small" />}
                    closeOnColorSwatchClick
                    swatches={[
                        "#fa5252",
                        "#fd7e14",
                        "#fab005",
                        "#82c91e",
                        "#40c057",
                        "#12b886",
                        "#15aabf",
                        "#228be6",
                        "#4c6ef5",
                        "#7950f2",
                        "#be4bdb",
                        "#e64980",
                        "#868e96",
                        "#2e2e2e",
                    ]}
                    value={tasklistColor}
                    onChange={handleChangeTasklistColor}
                />
            </div>
            <Divider my="lg" />
            <div className="tasklist-settings-section view-tasklist-section">
                <div className="input-label-description">
                    <Input.Label>Task Display</Input.Label>

                </div>
                <TaskViewSelector activeTaskDisplay={activeTaskDisplay} setActiveTaskDisplay={setActiveTaskDisplay} />
            </div>
        </Tabs.Panel>
    )
}