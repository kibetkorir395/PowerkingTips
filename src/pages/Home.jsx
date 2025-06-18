import React, { useContext, useEffect, useState } from 'react'
import { getAllTips } from '../firebase';
import AppHelmet from '../components/AppHelmet';
import Flyer from '../components/Flyer/Flyer';
import { NavLink } from 'react-router-dom';
import Testimonials from '../components/Testimonials/Testimonials';
import { PriceContext } from '../PriceContext';
import { Error, Verified } from '@mui/icons-material';
import Pricing from '../components/Pricing/Pricing';
import Tips from './Tips';

export default function Home({ userData }) {
  const [loading, setLoading] = useState(false);
  const [allTips, setAllTips] = useState(null);
  const [filteredTips, setFilteredTips] = useState(null);
  const { setPrice } = useContext(PriceContext);
  const [status, setStatus] = useState(true);
  const [isOnline] = useState(() => {
    return navigator.onLine
  });
  const [visibleTips, setVisibleTips] = useState(3); // Number of tips to show initially
  const tipsPerPage = 3; // Tips to load each time

  useEffect(() => {
    getAllTips(setAllTips, setLoading)
  }, [isOnline]);

  useEffect(() => {
    loading && setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, [loading]);

  useEffect(() => {
    if (allTips !== null) {
      const groupedData = allTips.reduce((acc, item) => {
        const dateKey = item.date;
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(item);
        return acc;
      }, {});

      const result = Object.keys(groupedData).map(date => ({
        date,
        items: groupedData[date]
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
      setFilteredTips(result);
    }
  }, [allTips]);

  // Function to load more tips
  const loadMoreTips = () => {
    setVisibleTips(prevVisibleTips => prevVisibleTips + tipsPerPage);
  };

  // Filter and slice the tips to show only the visible ones
  const getVisibleTips = () => {
    if (!filteredTips) return [];

    return filteredTips
      .map(filteredTip => {
        const filteredItems = filteredTip.items.filter((tip) =>
          (tip.status === 'finished') && (tip.premium === status)
        );

        return {
          ...filteredTip,
          items: filteredItems
        };
      })
      .filter(filteredTip => filteredTip.items.length > 0)
      .slice(0, visibleTips);
  };

  const visibleFilteredTips = getVisibleTips();
  const hasMoreTips = filteredTips &&
    filteredTips.filter(filteredTip =>
      filteredTip.items.filter((tip) =>
        (tip.status === 'finished') && (tip.premium === status)
      ).length > visibleTips);

  return (
    <div className='Home'>
      <AppHelmet title={"Home"} location={''} />
      <section>
        <Tips userData={userData} />
      </section>
      <section>
        <h1>Pricing</h1>
        <h2>Get VIP Membership</h2>
        <Pricing />
      </section>
      <section className='tables'>
        {
          filteredTips && filteredTips.length > 0 && <>
            <h1>WINNING HISTORY</h1>
            <span className='btn-holder'>
              <div className={`btn ${!status && "selected"}`} onClick={() => {
                setStatus(false);
                setVisibleTips(3); // Reset visible tips when changing filter
              }}>Free</div>
              <div className={`btn ${status && "selected"}`} onClick={() => {
                setStatus(true);
                setVisibleTips(3); // Reset visible tips when changing filter
              }}>Premium VIP</div>
            </span>
          </>
        }
        {
          visibleFilteredTips.map(filteredTip => {
            return (
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
                    {filteredTip.items.map(tip => {
                      return (
                        <tr key={tip.id || filteredTip.items.indexOf(tip)}>
                          <td>{tip.home}</td>
                          <td>{tip.away}</td>
                          <td>{tip.pick}</td>
                          <td>{tip.odd}</td>
                          <td>
                            {tip.won === 'won' ?
                              <span className='won'>
                                <p>Won</p>
                                <Verified className='icon' />
                              </span> :
                              <span className='lost'>
                                <p>Lost</p>
                                <Error className='icon' />
                              </span>
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </React.Fragment>
            )
          })
        }
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
          <h1>Get VIP memmbership for 1 month with as little as KSH 3000.</h1>
          <NavLink to={"/pay"} className='btn' onClick={() => setPrice(3000)}>Subscribe Now</NavLink>
        </div>
      </section>
    </div>
  )
}