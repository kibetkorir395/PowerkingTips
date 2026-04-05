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
  const [userTimezone, setUserTimezone] = useState(null);
  
  // Reference for the filter container
  const filterRef = useRef(null);

  // Get user's timezone
  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setUserTimezone(timezone);
  }, []);

  // Function to get current date in user's timezone
  const getCurrentDateInUserTimezone = () => {
    const now = new Date();
    const userDate = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
    return userDate;
  };

  // Format date consistently across timezones
  const formatDate = (dateString, useUserTimezone = true) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (useUserTimezone && userTimezone) {
      return date.toLocaleDateString('en-US', { 
        timeZone: userTimezone,
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    }
    return date.toLocaleDateString('en-US');
  };

  const returnDate = (dateString) => {
    const date = new Date(dateString);
    const today = getCurrentDateInUserTimezone();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return 'Today';
    }
    
    return date.toLocaleDateString('en-US', { 
      timeZone: userTimezone,
      weekday: 'long', 
      day: 'numeric' 
    });
  };

  const getShortDay = (dateString) => {
    const date = new Date(dateString);
    const today = getCurrentDateInUserTimezone();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return 'Today';
    }
    
    return date.toLocaleDateString('en-US', { 
      timeZone: userTimezone,
      weekday: 'short' 
    });
  };

  // Generate dates based on user's timezone
  const generateDates = () => {
    const dates = [];
    const today = getCurrentDateInUserTimezone();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    return dates;
  };

  // Check if a date is today in user's timezone
  const isToday = (dateString) => {
    const date = new Date(dateString);
    const today = getCurrentDateInUserTimezone();
    return date.toDateString() === today.toDateString();
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
    if (currentDate) {
      getTips(tipsPerPage, setTips, setLoading, formatDate(currentDate, false));
    }
  }, [isOnline, tipsPerPage, currentDate]);

  useEffect(() => {
    if (userTimezone) {
      const dates = generateDates();
      setDays(dates);
      setCurrentDate(dates[dates.length - 1]); // Set to today's date
    }
  }, [userTimezone]);

  // Auto-scroll to the far right (today's date) when days are loaded
  useEffect(() => {
    if (days && days.length > 0 && filterRef.current) {
      setTimeout(() => {
        const filterContainer = filterRef.current;
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
    getTips(tipsPerPage, setTips, setLoading, formatDate(currentDate, false));
  };

  const handleClick = (tip) => {
    setActive(tip);
    document.querySelector(".post-detail")?.classList.add("active");
  };

  const isTipLocked = (tip) => {
    const todayDate = generateDates()[generateDates().length - 1];
    return !isPremium && tip.premium && tip.date === formatDate(todayDate, false);
  };

  const filteredTips = tips.filter(tip => 
    category === 'free' ? !tip.premium : tip.premium
  );

  const handleDateClick = (day, index) => {
    setCurrentDate(day);
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

  // Get formatted month/year in user's timezone
  const getFormattedMonthYear = () => {
    const today = getCurrentDateInUserTimezone();
    return today.toLocaleDateString('en-US', { 
      timeZone: userTimezone,
      year: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="tips">
      <AppHelmet title={"Powerking Tips"} location={'/'} />
      <div className='container'>
        <div className="filter-wrapper">
          <p>{getFormattedMonthYear()}</p>
          <select onChange={(e) => setCategory(e.target.value)} value={category}>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </select>
        </div>

        <div className="filter" ref={filterRef}>
          {days?.map((day, index) => {
            const todayFlag = isToday(day);
            return (
              <button 
                key={index}
                className={`btn-filter ${currentDate === day ? 'active' : ''} ${todayFlag ? 'today-btn' : ''}`} 
                onClick={() => handleDateClick(day, index)}
              >
                {todayFlag && <span className="today-badge">Today</span>}
                <span className="day-short">{getShortDay(day)}</span>
                <span className="date-num">{new Date(day).getDate()}</span>
              </button>
            );
          })}
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
                  <td>{isLocked ? "🔒 Join VIP" : tip.home}</td>
                  <td>{isLocked ? "🔒 To View" : tip.away}</td>
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