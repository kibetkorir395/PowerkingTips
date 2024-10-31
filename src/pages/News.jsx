import React, {useState, useEffect, useLayoutEffect} from 'react';
import NewsItem from '../components/NewsItem/NewsItem';
import { getNews } from '../firebase';
import {NavLink } from 'react-router-dom';
import {NetworkWifi1Bar} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import Loader from '../components/Loader/Loader'
import { Helmet } from 'react-helmet-async';
import AppHelmet from '../components/AppHelmet';


export default function News() {
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [newsPerPage] = useState(16);
  const [category, setCategory] = useState('all');
  let location = useLocation();

  const [isOnline] = useState(() =>{
    return navigator.onLine
  })

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  });
  
  useEffect(() =>{
    getNews(currentPage * newsPerPage, category, setNews, setLoading);
  }, [currentPage, category, isOnline, newsPerPage, location]);
  
  useEffect(() => {
    loading && setTimeout(() => {
      setLoading(false);
    }, 3000);
  }, [loading]);
  
  const handleReload = () => {
    getNews(currentPage * newsPerPage, category, setNews, setLoading);
  }
  
  useEffect(() => {
    location.search.split("=")[1] && setCategory(location.search.split("=")[1]);
  }, [location.search]);

  return (
    <div className='news'>
      <AppHelmet title={"News"} location={'/news'}/>
      <div className="news-flyer">
        <h1>SPORTS TIMES</h1>
        <div className="order-categories">
          <NavLink title='all' to='?category=all' className={category === 'all' && "current"}>All</NavLink>
          <NavLink title='football' to='?category=football' className={category === 'football' && "current"}>Football</NavLink>
          <NavLink title='betting' to='?category=betting' className={category === 'betting' && "current"}>Betting</NavLink>
          <NavLink title='insights' to='?category=insights' className={category === 'insights' && "current"}>Insights</NavLink>
        </div>
      </div>
      <div className='post-container'>
          {
            news.length > 0 && news.map((blog) => {
              return <NewsItem key={blog.id} data={blog}/>
            })
          }
          {
            (!isOnline && (news.length === 0) && !loading) && <div className='no-network'>
              <h1>Nothing Yet!</h1>
              <p>This could be a network issue. Check you internet and try again.</p>
              <NetworkWifi1Bar className='wifi'/>
              <NavLink className="btn" onClick={handleReload}>Reload</NavLink>
            </div>
          }
                    
          {
            ((!news.length > 0) && loading) && <Loader />
          }
      </div>
    </div>
  )
}
