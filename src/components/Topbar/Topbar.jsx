import { Facebook, Instagram, Telegram, WhatsApp, X } from '@mui/icons-material';
import React from 'react';
import './Topbar.scss';
import { Link } from 'react-router-dom';
import { socialLinks } from '../../data';

export default function Topbar() {
  return (
    <div className='topbar'>
        <Link to={socialLinks.telegramChannel} title='@powerkingtips' target='_blank' className='linkedin'><Telegram /></Link>
        <Link to={socialLinks.whatsappChannel} title='whatsappa' target='_blank' className='whatsapp'><WhatsApp /></Link>
        <Link to={socialLinks.facebookPage} title='facebook' target='_blank' className='facebook'><Facebook /></Link>
        <Link to={socialLinks.xPage} title='twitter' target='_blank' className='twitter'><X /></Link>
        {/*<Link to={socialLinks.instagramPage} title='instagram' target='_blank' className='instagram'><Instagram /></Link>*/}
    </div>
  )
}