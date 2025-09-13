import { Link } from "react-router-dom"
import { useAuthenticateQuery } from "../store/authSlice"


export const Navbar = () => {
    const { data: user } = useAuthenticateQuery();

    return (
        <ul className='navbar'>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/login">Log In</Link></li>
            <li><Link to="/signup">Sign Up</Link></li>
            <li><Link to="/todo_lists">Todo Lists</Link></li>
            <li><Link to={`/users/${user?.id}`}>Profile</Link></li>
        </ul>
    )
}