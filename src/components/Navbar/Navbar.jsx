import Logo from '../../assets/logo.png';
import './Navbar.scss';

import { NavLink } from "react-router-dom";
import { useContext, useState } from 'react';
import { AuthContext } from '../../AuthContext';

const Navbar1 = () => {
    const { currentUser } = useContext(AuthContext);
    const handleLogout = () => {
        signOut(auth);
    }

    return (
        <header>
            <NavLink to="/" className='logo'>
                <img src={Logo} alt='kdan_logo' />
            </NavLink>
            <nav>
                <NavLink to="/" title='home' >Home</NavLink>
                <NavLink to="/tips" title='predictions' >Tips</NavLink>
                <NavLink to="/about" title='about-us' >About</NavLink>
                <div className="btn-wrapper">
                    {currentUser ? <NavLink className="btn" onClick={handleLogout} title='signout'>Logout</NavLink> :
                        <NavLink className="btn" to="/login" title='signout'>Log In</NavLink>}
                </div>
            </nav>

        </header>
    );
}

export default Navbar1;