import { useContext, useEffect, useState } from 'react'
import './Flyer.scss'
import { NavLink } from 'react-router-dom';
import { PriceContext } from '../../PriceContext';
import { getWonTips } from '../../firebase';
import { ErrorTwoTone, TimelapseOutlined, Verified, TrendingUp, EmojiEvents } from '@mui/icons-material';

export default function Flyer() {
  const { setPrice } = useContext(PriceContext);
  const [tips, setTips] = useState(null);
  const [isOnline] = useState(() => {
    return navigator.onLine
  })

  useEffect(() => {
    getWonTips(12, setTips);
  }, [isOnline]);


  function truncateLeague(input, value) {
    if (input.length > value) {
      return input.substring(0, value) + '...';
    }
    return input;
  };

  return (
    <div className='flyer'>
      <div className="flyer-overlay"></div>
      <div className="flyer-content">
        <div className="badge">
          <EmojiEvents className="badge-icon" />
          <span>Hot Tips Today!</span>
        </div>
        <h1 className='title'>Expert Football Tips!</h1>
        <h2 className='subtitle'>Join Us and Win High Today!</h2>
        <NavLink to={'pay'} className='btn cta-btn' onClick={() => setPrice(3000)}>
          <TrendingUp className="btn-icon" />
          GET STARTED
          <span className="btn-glow"></span>
        </NavLink>
      </div>
      
      <div className="scroll">
        <div className="scroll-track">
          {tips && tips.filter((tip) => (tip.won === 'won')).map((tip, index) => {
            return (
              <div className="post-card" key={tip.id} data-premium={tip.premium}>
                <div className="card-inner">
                  <div className="teams">
                    <p className="team home">{truncateLeague(tip.home, 10)}</p>
                    <div className="results">{tip.results}</div>
                    <p className="team away">{truncateLeague(tip.away, 15)}</p>
                  </div>
                  <div className='info'>
                    <p className="date">
                      <TimelapseOutlined className='icon' />
                      {tip.date}
                    </p>
                    <p className="odds">
                      {tip.won ? (
                        <>
                          <span className="odd-value">{tip.odd}</span>
                          <Verified className='icon won' />
                        </>
                      ) : (
                        <>
                          <span className="odd-value">{tip.odd}</span>
                          <ErrorTwoTone className='icon lost' />
                        </>
                      )}
                    </p>
                  </div>
                  {tip.premium && (
                    <div className="premium-badge">
                      Premium
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}