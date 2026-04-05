import React from "react";
import "./UserCard.scss";
import backgroundImage from "../../assets/l1.jpg";
import backgroundImage2 from "../../assets/l3.jpg";
import backgroundImage3 from "../../assets/l4.jpg";
import { NavLink } from "react-router-dom";
import { EmailOutlined, CalendarToday, Grade, Verified, Star } from "@mui/icons-material";

const UserCard = ({ user }) => {
	function formatDate(dateString) {
		const date = new Date(dateString);
		let day = date.getDate();

		// Append the suffix for the day (st, nd, rd, th)
		const suffix = (day) => {
			if (day > 3 && day < 21) return "th"; // 11th to 13th are special
			switch (day % 10) {
				case 1:
					return "st";
				case 2:
					return "nd";
				case 3:
					return "rd";
				default:
					return "th";
			}
		};

		const formattedDate = `${day}${suffix(day)} ${date.toLocaleString("en-GB", {
			month: "long",
			year: "numeric",
		})}`;
		return formattedDate;
	}

	return (
		<NavLink
			className={`user-card-minimal ${user.isPremium ? 'premium-card' : ''}`}
			to={`/users/${user.username ? "@" + user.username : user.email}`}
			state={user}
		>
			<div className="card-header-minimal">
				<div
					className="cover-minimal"
					style={{
						background: `linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.2) 100%), url(${
							user.isPremium ? backgroundImage3 : backgroundImage2
						}) center/cover no-repeat`,
					}}
				>
					{user.isPremium && (
						<div className="premium-indicator">
							<Grade fontSize="inherit" />
							<span className="premium-tooltip">VIP Member</span>
						</div>
					)}
					{!user.isPremium && (
						<div className="free-badge">Free</div>
					)}
				</div>

				<div className="avatar-wrapper">
					<img
						src={user.isPremium ? backgroundImage : backgroundImage2}
						alt="User avatar"
						className="avatar-minimal"
					/>
					{user.isPremium && (
						<div className="avatar-verified">
							<Verified className="verified-icon" />
						</div>
					)}
				</div>
			</div>

			<div className="card-body-minimal">
				<div className="user-info-compact">
					<div className="plan-badge">
						{user.isPremium ? (
							<Star className="star-icon" />
						) : (
							<div className="dot-icon"></div>
						)}
						<h3 className="plan-name">
							{user.subscription ? user.subscription : "Free"} Plan
						</h3>
					</div>
					<p className="user-handle">@{user.username || user.email?.split('@')[0]}</p>
				</div>

				<div className="details-compact">
					<div className="detail-line">
						<EmailOutlined className="icon-small" />
						<span className="text-email">{user.email}</span>
					</div>

					{user.subDate && (
						<div className="detail-line">
							<CalendarToday className="icon-small" />
							<span className="text-date">{formatDate(user.subDate)}</span>
						</div>
					)}
				</div>
				
				<div className="card-footer">
					<span className="view-profile">View Profile →</span>
				</div>
			</div>
		</NavLink>
	);
};

export default UserCard;