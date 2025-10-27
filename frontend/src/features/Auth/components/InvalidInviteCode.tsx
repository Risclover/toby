import { Button, Space } from "@mantine/core"
import "../styles/InvalidInviteCode.css"
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import { useNavigate } from "react-router-dom";

export function InvalidInviteCode() {
    const navigate = useNavigate();

    return (
        <div className="invalid-invite-code-page">
            <div className="invalid-invite-code-img"></div>
            <div className="invalid-invite-code-text">
                <h1>Whoops!</h1>
                <p>Looks like your invite code is invalid.</p><p>Ask the person that gave it to you to give you an updated code.</p>
                <Space h="lg" />
                <Button onClick={() => navigate("/")} leftSection={<HomeRoundedIcon fontSize="small" />} color="cyan">Go home</Button>
            </div>
        </div>
    )
}
