export const TablistSettingsSetting = () => {
    return (
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
    )
}