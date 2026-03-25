import { TobyIcon } from '@/assets/icons/TobyIcon';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import HowToRegRoundedIcon from '@mui/icons-material/HowToRegRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthenticateQuery } from '@/store/authSlice';
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import { Avatar } from '@mantine/core';
import { useGetUserQuery } from '@/store';

export const MobileHomeHeader = () => {
    const navigate = useNavigate();
    const { data: currentUser } = useAuthenticateQuery()
    const { data: user } = useGetUserQuery(currentUser?.id);

    console.log('user:', user)
    return (
        <div className="mobile-header-container">
            <div className="mobile-header-left">
                {/* TASK: Animated hamburger menu icon */}
                <MenuRoundedIcon />
                <div className="brand"><Link to="/"><TobyIcon size="1.25rem" color="white" /><div className="title">Toby</div></Link></div>
            </div>
            <div className="mobile-header-right">
                <div className="mobile-header-icon-btns">
                    {/* Search button */}

                    {/* Daily check-in button */}
                    <HowToRegRoundedIcon />
                    <GroupAddRoundedIcon />
                </div>

                {/* Separator */}
                <div className="mobile-header-separator" />

                {/* User avatar */}
                <Avatar variant="outline" color="white" size={32} onClick={() => navigate(`/profile/${user.id}`)} src={user?.profileImg} />
                {user?.errors && user?.errors[0] === "Unauthorized" && <Link to="/login">Login</Link>}
            </div>
        </div>
    )
}