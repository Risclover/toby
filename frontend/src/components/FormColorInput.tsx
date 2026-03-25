import { ColorInput } from "@mantine/core";
import ColorizeRoundedIcon from "@mui/icons-material/ColorizeRounded";

type Props = {
    form: any;
    label?: string;
    required?: boolean;
}
export const FormColorInput = ({ form, label, required }: Props) => {
    return (
        <ColorInput
            size="sm"
            radius="md"
            required={required}
            label={label}
            placeholder="Choose color"
            eyeDropperIcon={<ColorizeRoundedIcon fontSize="small" />}
            closeOnColorSwatchClick
            defaultValue="#050549"
            {...form.getInputProps('color')}
            swatches={["#fa5252", "#fd7e14", "#fab005", "#40c057", "#12b886", "#15aabf", "#228be6", "#4c6ef5", "#7950f2", "#be4bdb", "#e64980", "#868e96", "#2e2e2e", "#050549"]}
        />
    )
}