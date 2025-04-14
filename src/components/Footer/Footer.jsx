import { ArrowUpward, Facebook, Telegram, WhatsApp, X, Instagram } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import './Footer.scss';
import { Link, NavLink } from 'react-router-dom';
import { socialLinks } from '../../data';

const Footer = ({ user }) => {

    const [isAdmin, setIsAdmin] = useState(null);

    const handleScroll = (e) => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        })
    }

    useEffect(() => {
        if (user !== null) {
            if (user.email === 'kkibetkkoir@gmail.com' || user.email === 'arovanzgamez@gmail.com') {
                setIsAdmin(true)
            } else {
                setIsAdmin(false)
            }
        }
    }, [user])

    return (
        <div className='footer theme'>
            <div className='social'>
                <h2>Follow us</h2>
                <div className='wrapper'>
                    <Link to={socialLinks.facebookPage} title='facebook' target='_blank'><Facebook /></Link>
                    <Link to={socialLinks.whatsappChannel} title='whatsapp' target='_blank'><WhatsApp /></Link>
                    <Link to={socialLinks.telegramChannel} title='telegram' target='_blank'><Telegram /></Link>
                </div >

            </div>
            <hr />
            <div className='footer-bottom theme'>
                <p>&copy; Myfootball Tips {new Date().getFullYear()}</p>
                <NavLink to={'/about#faq'} title='what people ask'>FAQ</NavLink>
                {isAdmin && <>
                    <NavLink to="/admin/tips" title='contact'>ADD TIP</NavLink>
                </>}
                <button className="btn-top" onClick={() => handleScroll()}><ArrowUpward /></button>
            </div>

        </div>
    );
}

export default Footer;