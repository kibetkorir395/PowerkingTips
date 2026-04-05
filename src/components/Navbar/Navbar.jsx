import Logo from '../../assets/logo.png';
import './Navbar.scss';

import { NavLink } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { Menu, Close, Person, AdminPanelSettings } from '@mui/icons-material';

const Navbar1 = ({ user }) => {
	const { currentUser } = useContext(AuthContext);
	const [isAdmin, setIsAdmin] = useState(null);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	useEffect(() => {
		if (user !== null) {
			if (
				user.email === "kkibetkkoir@gmail.com" ||
				user.email === "arovanzgamez@gmail.com"
			) {
				setIsAdmin(true);
			} else {
				setIsAdmin(false);
			}
		}
	}, [user]);

	const handleLogout = async () => {
		try {
			await signOut(auth);
			console.log("Logged out successfully");
			setMobileMenuOpen(false);
		} catch (err) {
			console.error("Logout failed:", err);
		}
	};

	const toggleMobileMenu = () => {
		setMobileMenuOpen(!mobileMenuOpen);
	};

	const closeMobileMenu = () => {
		setMobileMenuOpen(false);
	};

	return (
		<header className={mobileMenuOpen ? "mobile-open" : ""}>
			<div className="header-container">
				<NavLink to="/" className="logo" onClick={closeMobileMenu}>
					<img src={Logo} alt="powerking_logo" />
					<span className="logo-text">PowerKing Tips</span>
				</NavLink>
				
				<button className="mobile-menu-btn" onClick={toggleMobileMenu}>
					{mobileMenuOpen ? <Close /> : <Menu />}
				</button>
				
				<nav className={mobileMenuOpen ? "active" : ""}>
					<NavLink 
						to="/" 
						className="nav-link" 
						onClick={closeMobileMenu}
						title="Predictions"
					>
						Home
					</NavLink>
					<NavLink 
						to="/about" 
						className="nav-link" 
						onClick={closeMobileMenu}
						title="About Us"
					>
						About
					</NavLink>
					
					<div className="btn-wrapper">
						{currentUser ? (
							<>
								<div className="user-greeting">
									<Person className="user-icon" />
									<span>Hi, {user?.email?.split('@')[0]}</span>
								</div>
								<button className="btn logout-btn" onClick={handleLogout} title="Sign out">
									Logout
								</button>
							</>
						) : (
							<NavLink className="btn login-btn" to="/login" onClick={closeMobileMenu} title="Log in">
								Log In
							</NavLink>
						)}
						
						{isAdmin && currentUser && (
							<NavLink to="/users" className="btn admin-btn" onClick={closeMobileMenu} title="Users">
								<AdminPanelSettings className="admin-icon" />
								Users
							</NavLink>
						)}
					</div>
				</nav>
			</div>
		</header>
	);
};

export default Navbar1;