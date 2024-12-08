import React from "react";
import "./UserCard.scss";

const UserCard = ({user}) => {

  function formatDate(dateString) {
    const date = new Date(dateString);
    let day = date.getDate();
    
    // Append the suffix for the day (st, nd, rd, th)
    const suffix = (day) => {
        if (day > 3 && day < 21) return 'th'; // 11th to 13th are special
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };
    
    const formattedDate = `${day}${suffix(day)} ${date.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}`;
    return formattedDate;
}
  return (  
  <div className="card">
    <div className="cover-bg"></div>
    <div className="user-info-wrap">
      <div className="user-photo"></div>
      <div className="user-info">
        <div className="user-name">{user.subscription ? user.subscription : " Free"} Plan</div>
        <div className="user-title">@{user.username}</div>
      </div>
    </div>
    <div className="user-bio">
      <p>
        {user.subDate && `subscribed to ${user.subscription} VIP on: ${formatDate(user.subDate)}`}
      </p>
      <a href="/users/id" className="btn">Edit</a>
    </div>
  </div>
)};

export default UserCard;
