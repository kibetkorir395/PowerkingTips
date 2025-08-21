import React from "react";
import "./UserCard.scss";
import backgroundImage from "../../assets/l1.jpg";
import backgroundImage2 from "../../assets/l3.jpg";
import backgroundImage3 from "../../assets/l4.jpg";
import { NavLink } from "react-router-dom";
import { EmailOutlined, CalendarToday, Grade } from "@mui/icons-material";

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
			className="user-card-minimal"
			to={`/users/${user.username ? "@" + user.username : user.email}`}
			state={user}
		>
			<div className="card-header-minimal">
				<div
					className="cover-minimal"
					style={{
						background: `linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 100%), url(${
							user.isPremium ? backgroundImage3 : backgroundImage2
						}) center/cover no-repeat`,
					}}
				>
					{user.isPremium && (
						<div className="premium-indicator">
							<Grade fontSize="inherit" />
						</div>
					)}
				</div>

				<div className="avatar-wrapper">
					<img
						src={user.isPremium ? backgroundImage : backgroundImage2}
						alt="User avatar"
						className="avatar-minimal"
					/>
				</div>
			</div>

			<div className="card-body-minimal">
				<div className="user-info-compact">
					<h3 className="plan-name">
						{user.subscription ? user.subscription : "Free"} Plan
					</h3>
					<p className="user-handle">@{user.username}</p>
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
			</div>
		</NavLink>
	);
};

export default UserCard;
