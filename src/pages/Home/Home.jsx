import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Error, Verified } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { usePrice } from '../../context/PriceContext';
import { tipsService } from '../../services/firestore.service';
import AppHelmet from '../../components/AppHelmet';
import Tips from '../Tips/Tips';
import Pricing from '../../components/Pricing/Pricing';
import Testimonials from '../../components/Testimonials/Testimonials';

export default function Home() {
  const { userData, isPremium, isAdmin } = useAuth();
  const { setPrice } = usePrice(); // Use the hook instead of useContext
  const [loading, setLoading] = useState(false);
  const [allTips, setAllTips] = useState([]);
  const [filteredTips, setFilteredTips] = useState([]);
  const [status, setStatus] = useState(true);
  const [visibleTips, setVisibleTips] = useState(3);
  const tipsPerPage = 3;

  // Fetch all tips from Firebase
  const fetchAllTips = useCallback(async () => {
    setLoading(true);
    try {
      const result = await tipsService.getAllTips(1, 100);
      setAllTips(result.tips || []);
    } catch (error) {
      console.error('Error fetching tips:', error);
      setAllTips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllTips();
  }, [fetchAllTips]);

  // Group tips by date and filter by status
  useEffect(() => {
    if (allTips && allTips.length > 0) {
      // Filter tips that are finished
      const finishedTips = allTips.filter(tip => tip.status === 'finished');
      
      // Group by date
      const groupedData = finishedTips.reduce((acc, item) => {
        const dateKey = item.date;
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(item);
        return acc;
      }, {});

      // Convert to array and sort by date (newest first)
      const result = Object.keys(groupedData)
        .map(date => ({
          date,
          items: groupedData[date]
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setFilteredTips(result);
    } else {
      setFilteredTips([]);
    }
  }, [allTips]);

  // Load more tips
  const loadMoreTips = useCallback(() => {
    setVisibleTips(prev => prev + tipsPerPage);
  }, []);

  // Handle filter change (Free vs Premium)
  const handleFilterChange = useCallback((isPremiumStatus) => {
    setStatus(isPremiumStatus);
    setVisibleTips(3);
  }, []);

  // Get visible tips based on current filter and pagination
  const visibleFilteredTips = useMemo(() => {
    if (!filteredTips.length) return [];

    return filteredTips
      .map(filteredTip => {
        const filteredItems = filteredTip.items.filter(tip =>
          tip.premium === status
        );
        return {
          ...filteredTip,
          items: filteredItems
        };
      })
      .filter(filteredTip => filteredTip.items.length > 0)
      .slice(0, visibleTips);
  }, [filteredTips, status, visibleTips]);

  // Check if there are more tips to load
  const hasMoreTips = useMemo(() => {
    if (!filteredTips.length) return false;
    
    let totalVisibleCount = 0;
    for (const filteredTip of filteredTips) {
      const count = filteredTip.items.filter(tip => tip.premium === status).length;
      if (count > 0) totalVisibleCount++;
    }
    
    return totalVisibleCount > visibleTips;
  }, [filteredTips, status, visibleTips]);

  // Handle subscribe click
  const handleSubscribeClick = useCallback(() => {
    setPrice(3000);
  }, [setPrice]);

  return (
    <div className='Home'>
      <AppHelmet title="Home" />
      
      <section>
        <Tips />
      </section>
      
      <section>
        <h1>Pricing</h1>
        <h2>Get VIP Membership</h2>
        <Pricing />
      </section>
      
      <section className='tables'>
        {filteredTips.length > 0 && (
          <>
            <h1>WINNING HISTORY</h1>
            {/*<span className='btn-holder'>
              <div 
                className={`btn ${!status && "selected"}`} 
                onClick={() => handleFilterChange(false)}
              >
                Free
              </div>
              <div 
                className={`btn ${status && "selected"}`} 
                onClick={() => handleFilterChange(true)}
              >
                Premium VIP
              </div>
            </span>*/}
          </>
        )}
        
        {visibleFilteredTips.length > 0 ? (
          visibleFilteredTips.map(filteredTip => (
            <React.Fragment key={filteredTip.date}>
              <h2>{filteredTip.date}</h2>
              <table className='wrapper'>
                <thead>
                  <tr>
                    <th>HOME</th>
                    <th>AWAY</th>
                    <th>PICK</th>
                    <th>ODDS</th>
                    <th>RESULTS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTip.items.map((tip, index) => (
                    <tr key={tip.id || index}>
                      <td>{tip.home}</td>
                      <td>{tip.away}</td>
                      <td>{tip.pick}</td>
                      <td>{tip.odd}</td>
                      <td>
                        {tip.won === 'won' ? (
                          <span className='won'>
                            <p>Won</p>
                            <Verified className='icon' />
                          </span>
                        ) : (
                          <span className='lost'>
                            <p>Lost</p>
                            <Error className='icon' />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </React.Fragment>
          ))
        ) : (
          !loading && filteredTips.length === 0 && (
            <div className="no-tips-message">
              <p>No tips available. Check back later!</p>
            </div>
          )
        )}
        
        {hasMoreTips && (
          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            <button className='btn' onClick={loadMoreTips}>
              Load More
            </button>
          </div>
        )}
      </section>

      <section>
        <h1>Testimonials</h1>
        <h2>What clients say:</h2>
        <Testimonials />
      </section>
      
      <section>
        <div className="jobs-flyer" style={{ width: '100%', padding: '5px' }}>
          <h1>Join The Winning Team</h1>
          <h1>Get VIP membership for 1 month with as little as KSH 3000.</h1>
          <NavLink to="/pay" className='btn' onClick={handleSubscribeClick}>
            Subscribe Now
          </NavLink>
        </div>
      </section>
    </div>
  );
}