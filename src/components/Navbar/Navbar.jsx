import Logo from '../../assets/logo.png';
import './Navbar.scss';

import { NavLink } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";

const Navbar1 = ({ user }) => {
	const { currentUser } = useContext(AuthContext);

	const [isAdmin, setIsAdmin] = useState(null);

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
		} catch (err) {
			console.error("Logout failed:", err);
		}
	};

	return (
		<header>
			<NavLink to="/" className="logo">
				<img src={Logo} alt="kdan_logo" />
			</NavLink>
			<nav>
				<NavLink to="/" title="predictions">
					Home
				</NavLink>
				<NavLink to="/about" title="about-us">
					About
				</NavLink>
				<div className="btn-wrapper">
					{currentUser ? (
						<NavLink className="btn" onClick={handleLogout} title="signout">
							Logout
						</NavLink>
					) : (
						<NavLink className="btn" to="/login" title="signout">
							Log In
						</NavLink>
					)}
					{isAdmin && currentUser && (
						<NavLink to="/users" className="btn" title="users">
							USERS
						</NavLink>
					)}
				</div>
			</nav>
		</header>
	);
};

export default Navbar1;