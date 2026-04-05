import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import PostDetail from '../components/PostDetails/PostDetails';
import { NavLink } from 'react-router-dom';
import { getTips } from '../firebase';
import Loader from '../components/Loader/Loader';
import AppHelmet from '../components/AppHelmet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle, faWifi, faSpinner, faLock, faEye } from '@fortawesome/free-solid-svg-icons';

export default function Tips({ userData }) {
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState([]);
  const [days, setDays] = useState(null);
  const [currentDate, setCurrentDate] = useState(null);
  const [tipsPerPage] = useState(25);
  const [active, setActive] = useState(null);
  const [category, setCategory] = useState('premium');
  const [isPremium, setIsPremium] = useState(false);
  const [isOnline] = useState(navigator.onLine);
  
  // Reference for the filter container
  const filterRef = useRef(null);

  const date = new Date();
  const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const returnDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' });
  };

  useEffect(() => {
    if (userData) {
      const isAdmin = userData.email === 'kkibetkkoir@gmail.com' || userData.email === 'arovanzgamez@gmail.com';
      setIsPremium(isAdmin || userData.isPremium);
    }
  }, [userData]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    getTips(tipsPerPage, setTips, setLoading, formatDate(currentDate));
  }, [isOnline, tipsPerPage, currentDate]);

  useEffect(() => {
    const dates = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    setDays(dates);
    setCurrentDate(dates[dates.length - 1]);
  }, []);

  // Auto-scroll to the far right (today's date) when days are loaded
  useEffect(() => {
    if (days && days.length > 0 && filterRef.current) {
      // Small delay to ensure DOM is fully rendered
      setTimeout(() => {
        const filterContainer = filterRef.current;
        // Scroll to the far right
        filterContainer.scrollLeft = filterContainer.scrollWidth;
      }, 100);
    }
  }, [days]);

  useEffect(() => {
    if (tips.length > 0) {
      const filteredTips = tips.filter(tip => 
        category === 'free' ? !tip.premium : tip.premium
      );
      setActive(filteredTips[0]);
    }
  }, [tips, category]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleReload = () => {
    getTips(tipsPerPage, setTips, setLoading, formatDate(currentDate));
  };

  const handleClick = (tip) => {
    setActive(tip);
    document.querySelector(".post-detail")?.classList.add("active");
  };

  const isTipLocked = (tip) => {
    return !isPremium && tip.premium && tip.date === formatDate(days?.[days.length - 1]);
  };

  const filteredTips = tips.filter(tip => 
    category === 'free' ? !tip.premium : tip.premium
  );

  // Function to scroll to a specific date when clicked
  const handleDateClick = (day, index) => {
    setCurrentDate(day);
    // Optional: Scroll the clicked button into view
    const filterContainer = filterRef.current;
    const buttons = filterContainer?.querySelectorAll('.btn-filter');
    if (buttons && buttons[index]) {
      buttons[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  };

  return (
    <div className="tips">
      <AppHelmet title={"Powerking Tips"} location={'/'} />
      <div className='container'>
        <div className="filter-wrapper">
          <p>{formattedDate}</p>
          <select onChange={(e) => setCategory(e.target.value)} value={category}>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        <div className="filter" ref={filterRef}>
          {days?.map((day, index) => (
            <button 
              key={index}
              className={`btn-filter ${currentDate === day ? 'active' : ''}`} 
              onClick={() => handleDateClick(day, index)}
            >
              <span>{returnDate(day).split(" ")[1]?.substring(0, 3)}</span>
              <span>{returnDate(day).split(" ")[0]}</span>
            </button>
          ))}
        </div>

        <table className='tips-table'>
          <thead>
            <tr>
              <th>TIME</th>
              <th>HOME</th>
              <th>AWAY</th>
              <th>TIP</th>
              <th>ODDS</th>
              <th>RESULTS</th>
            </tr>
          </thead>
          <tbody>
            {filteredTips.map(tip => {
              const isLocked = isTipLocked(tip);
              return (
                <tr key={tip.id} onClick={() => handleClick(tip)}>
                  <td>{tip.time}</td>
                  <td>{isLocked ? "Join VIP To View" : tip.home}</td>
                  <td>{isLocked ? "Closed" : tip.away}</td>
                  <td>{isLocked ? <FontAwesomeIcon icon={faLock} /> : tip.pick}</td>
                  <td>{tip.odd}</td>
                  <td>
                    {tip.won === 'won' ? (
                      <span className='won'>
                        <p>Won</p>
                        <FontAwesomeIcon icon={faCheckCircle} className='icon' />
                      </span>
                    ) : tip.status === "pending" ? (
                      <span><FontAwesomeIcon icon={faSpinner} spin /> Pending</span>
                    ) : (
                      <span className='lost'>
                        <p>Lost</p>
                        <FontAwesomeIcon icon={faTimesCircle} className='icon' />
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="wrapper">
          {!isOnline && tips.length === 0 && !loading && (
            <div className='no-network'>
              <h1>Nothing Yet!</h1>
              <p>This could be a network issue. Check your internet and try again.</p>
              <FontAwesomeIcon icon={faWifi} className='wifi' />
              <NavLink className="btn" onClick={handleReload}>Reload</NavLink>
            </div>
          )}

          {tips.length === 0 && loading && <Loader />}
        </div>
      </div>

      {active && <PostDetail data={active} userData={userData} />}
    </div>
  );
}