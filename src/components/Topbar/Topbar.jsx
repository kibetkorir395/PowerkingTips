import { Facebook, Instagram, Telegram, WhatsApp, X, Bolt } from '@mui/icons-material';
import "./Topbar.scss";
import { Link } from "react-router-dom";
import { socialLinks } from "../../data";
import { useEffect, useState } from "react";

export default function Topbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className={`topbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="topbar-container">
                <div className="topbar-left">
                    <Bolt className="live-icon" />
                    <span className="live-text">Live Tips Today!</span>
                </div>
                
                <div className="topbar-social">
                    <Link
                        to={socialLinks.telegramChannel}
                        title="Join our Telegram"
                        target="_blank"
                        className="social-icon telegram"
                    >
                        <Telegram />
                        <span className="tooltip">Telegram</span>
                    </Link>
                    <Link
                        to={socialLinks.whatsappChannel}
                        title="Join our WhatsApp"
                        target="_blank"
                        className="social-icon whatsapp"
                    >
                        <WhatsApp />
                        <span className="tooltip">WhatsApp</span>
                    </Link>
                    <Link
                        to={socialLinks.facebookPage}
                        title="Follow us on Facebook"
                        target="_blank"
                        className="social-icon facebook"
                    >
                        <Facebook />
                        <span className="tooltip">Facebook</span>
                    </Link>
                    <Link
                        to={socialLinks.xPage}
                        title="Follow us on X"
                        target="_blank"
                        className="social-icon twitter"
                    >
                        <X />
                        <span className="tooltip">X (Twitter)</span>
                    </Link>
                    <Link
                        to={socialLinks.instagramPage}
                        title="Follow us on Instagram"
                        target="_blank"
                        className="social-icon instagram"
                    >
                        <Instagram />
                        <span className="tooltip">Instagram</span>
                    </Link>
                </div>
                
                <div className="topbar-right">
                    <span className="tips-count">🏆 Daily Tips</span>
                </div>
            </div>
        </div>
    );
}