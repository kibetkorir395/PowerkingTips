import { Close, Menu } from '@mui/icons-material';
import Logo from '../../assets/logo.png';
import './Navbar.scss';
import { NavLink} from "react-router-dom";
import { useContext, useState } from 'react';
import { AuthContext } from '../../AuthContext';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

const Navbar = () => {
    const { currentUser } = useContext(AuthContext);
    const [closed, setClosed] = useState(true)

    const handleToggleNav = async () => {
        document.querySelector('.btn-wrapper').classList.toggle('closed');
        document.querySelector('nav').classList.toggle('closed');
        setClosed(!closed)
    }

    const handleLogout = () => {
        signOut(auth);
    }
    return (
        <header>
            <NavLink to="/" className='logo'>
                    <img src={Logo} alt='powerking_logo'/>
            </NavLink> 
            <nav className='closed'>
                <NavLink to="/" title='home' onClick={handleToggleNav}>Home</NavLink>
                <NavLink to="/tips" title='explore' onClick={handleToggleNav}>Tips</NavLink>
                <NavLink to="/blogs" title='blogs' onClick={handleToggleNav}>Blogs</NavLink>
                <NavLink to="/about" title='contact' onClick={handleToggleNav}>About</NavLink>
            </nav>
            <div className="btn-wrapper  closed" onClick={handleToggleNav}>
                {
                    currentUser ? <span className='btn' onClick={handleLogout}>Logout</span> : <>

                <NavLink to={'/register'} className="btn"  title='contribute'>Register</NavLink>
                <NavLink to={'/login'} className="btn" title='contribute'>Login</NavLink>
                    </>
                }
            </div>
            <div className="close" onClick={handleToggleNav}>{
                closed ? <Menu /> : <Close />
            }</div>
        </header>
    );
}

export default Navbar;