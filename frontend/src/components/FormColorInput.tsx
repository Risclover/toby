import { ColorInput } from "@mantine/core";
import ColorizeRoundedIcon from "@mui/icons-material/ColorizeRounded";

type Props = {
    form: any;
    label?: string;
}
export const FormColorInput = ({ form, label }: Props) => {
    return (
        <ColorInput
            size="sm"
            radius="md"
            label={label}
            placeholder="Choose color"
            eyeDropperIcon={<ColorizeRoundedIcon fontSize="small" />}
            closeOnColorSwatchClick
            defaultValue="#000"
            {...form.getInputProps('color')}
            swatches={["#fa5252", "#fd7e14", "#fab005", "#40c057", "#12b886", "#15aabf", "#228be6", "#4c6ef5", "#7950f2", "#be4bdb", "#e64980", "#868e96", "#2e2e2e", "rgb(5, 5, 73)"]}
        />
    )
}