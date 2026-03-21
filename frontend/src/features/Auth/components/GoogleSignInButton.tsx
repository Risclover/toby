import { Button } from "@mantine/core";

type Props = { onClick: () => void; label?: string }

export const GoogleSignInButton = ({ onClick, label = "Sign in with Google" }: Props) => (
    <Button
        className="google-signin-btn"
        size="md"
        radius="xl"
        variant="outline"
        color="gray"
        fullWidth
        fw={500}
        onClick={onClick}
        leftSection={<img src="https://www.google.com/favicon.ico" width={16} />}
    >
        {label}
    </Button>
);