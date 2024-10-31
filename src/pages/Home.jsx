import React, { useContext, useEffect, useState } from 'react'
import { getAllTips, getNews} from '../firebase';
import AppHelmet from '../components/AppHelmet';
import Flyer from '../components/Flyer/Flyer';
import Slider from '../components/Slider/Slider';
import {NavLink} from 'react-router-dom';
import Testimonials from '../components/Testimonials/Testimonials';
import { PriceContext } from '../PriceContext';
import { Error, Verified } from '@mui/icons-material';
import Pricing from '../components/Pricing/Pricing';

export default function Home() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allTips, setAllTips] = useState(null);
  const [filteredTips, setFilteredTips] = useState(null);
  const {setPrice} = useContext(PriceContext);
  const [status, setStatus] = useState(false);
  const [isOnline] = useState(() =>{
    return navigator.onLine
  })



  useEffect(() =>{
    getNews(6, "all", setNews, setLoading);
    getAllTips(setAllTips, setLoading)
  }, [isOnline]);

  useEffect(() => {
    loading && setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, [loading]);


  useEffect(() => {
    if(allTips !== null){
      const groupedData = allTips.reduce((acc, item) => {
        // Use the date as the key for grouping
        const dateKey = item.date;
    
        // If the date key doesn't exist in the accumulator, create a new array
        if (!acc[dateKey]) {
            acc[dateKey] = [];
        }
    
        // Push the current item into the corresponding date group
        acc[dateKey].push(item);
    
        return acc;
      }, {});
    
    // Convert the result to an array of grouped objects
    const result = Object.keys(groupedData).map(date => ({
        date,
        items: groupedData[date]
    })).sort((a, b) => new Date(b.date) - new Date(a.date));;
    setFilteredTips(result);
    } 

  }, [allTips]);

  return (
    <div className='Home'>
      <AppHelmet title={"Home"} location={''}/>
      <section>
        <Flyer/>
      </section>
      <section>
        <h1>Pricing</h1>
        <h2>Find a plan that's right for you.</h2>
        <Pricing />
      </section>
      <section className='tables'>
        {
          filteredTips && <>
            <h1>WINNING HISTORY</h1>
            <span className='btn-holder'>
              <div className={`btn ${!status && "selected"}`} onClick={() => setStatus(false)}>Free</div>
              <div className={`btn ${status && "selected"}`} onClick={() => setStatus(true)}>Premium</div>
              <NavLink to={"/tips"} className='btn'>VIP TIPS&raquo;</NavLink>
            </span>
          </>
        }
        {
        filteredTips && filteredTips.map(filteredTip => {
          return (<>
            {filteredTip.items && filteredTip.items.filter((tip) => (tip.status === 'finished') && (tip.premium === status)).length !== 0 && (<h2>
              {filteredTip.date}
            </h2>)}
            <table className='wrapper' >

              {
              filteredTip.items && filteredTip.items.filter((tip) => (tip.status === 'finished') && (tip.premium === status)).length !== 0 && (
              <tr>
                
                <th>HOME</th>
                <th>AWAY</th>
                <th>PICK</th>
                <th>ODDS</th>
                <th>RESULTS</th>
              </tr>
                )
              }

              {filteredTip.items && filteredTip.items.filter((tip) => (tip.status === 'finished') && (tip.premium === status)).map(tip => {
              return (
                <tr key={filteredTip.items.indexOf(tip)}>
                  
                  <td>{tip.home}</td>
                  <td>{tip.away}</td>
                  <td>{tip.pick}</td>
                  <td>{tip.odd}</td>
                  <td>
                    {tip.won === 'won' ? 
                      <span className='won'>
                        <p>Won</p> 
                        <Verified className='icon'/>
                      </span>  : 
                      <span className='lost'>
                        <p>Lost</p> 
                        <Error className='icon'/>
                      </span>
                    }
                  </td>
                </tr>
                )
            })}
            </table>
          </>)
        })
        }
      </section>
      {/*<section className='tables'>
      {
        allTips && <h2>WINNING HISTORY</h2>
      }

      <span className='btn-holder'>
        <div className={`btn ${!status && "selected"}`} onClick={() => setStatus(false)}>Free</div>
        <div className={`btn ${status && "selected"}`} onClick={() => setStatus(true)}>Premium</div>
        <NavLink to={"/tips"} className='btn'>VIP TIPS&raquo;</NavLink>
      </span>

      {
        allTips &&(
        <table className='wrapper'>
          <tr>
            <th>DATE</th>
            <th>HOME</th>
            <th>AWAY</th>
            <th>PICK</th>
            <th>ODDS</th>
            <th>RESULTS</th>
          </tr>

          {
             allTips.filter((tip) => (tip.status === 'finished') && (tip.premium === status)).map(tip => {
              return (<tr key={allTips.indexOf(tip)}>
                        <td>{tip.date}</td>
                        <td>{tip.home}</td>
                        <td>{tip.away}</td>
                        <td>{tip.pick}</td>
                        <td>{tip.odd}</td>
                        <td>{tip.won === 'won' ? <span className='won'><p>Won</p> <Verified className='icon'/></span>  : <span className='lost'><p>Lost</p> <Error className='icon'/></span>}</td>
                      </tr>)
            })
          }
  
        </table>)
      }
      </section>*/}
      <section>
          <h1>Testimonials</h1>
          <h2>What clients say:</h2>
          <Testimonials />
      </section>
      <section>
        <div className="jobs-flyer" style={{width: '100%', padding: '5px'}}>
          <h1>Join The Winning Team</h1>
          <h1>Get VIP memmbership for 1 month with as little as KSH 3000.</h1>
          <NavLink to={"/pay"} className='btn' onClick={() => setPrice(3000)}>Subscribe Now</NavLink>
        </div>
      </section>
      <section>
        {news.length && <><h1>ARTICLES</h1><h2>Trending Posts</h2></> }
        {news.length && <Slider data={news}/>}
      </section>
    </div>
  )
}
