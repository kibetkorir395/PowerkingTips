import React, { useContext, useEffect, useState } from 'react'
import './PostDetails.scss';
import Profile from '../../assets/vip.jpg';
import Logo from '../../assets/logo.png';
import { Close, ErrorTwoTone, Verified} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { PriceContext } from '../../PriceContext';
import { AuthContext } from '../../AuthContext';


export default function PostDetail({data, userData}) {
    const {setPrice} = useContext(PriceContext);
    const {currentUser} = useContext(AuthContext);
    const [isPremium, setIsPremium] = useState(false);
    var x = window.matchMedia("(min-width: 576px)")
    const [isAdmin, setIsAdmin] = useState(null);

    const handleClick = () => {
      document.querySelector(".post-detail").classList.remove("active")
    }

    useEffect(() => {
      if(userData !== null){
        setIsPremium(userData.isPremium)
      }
    }, [userData]) 


    useEffect(() => {
      if(currentUser !== null){
          if(currentUser.email === 'kkibetkkoir@gmail.com' || currentUser.email === 'charleykibet254@gmail.com') {
              setIsAdmin(true)
          } else {
              setIsAdmin(false)
          }
      }
    }, [currentUser])

    function formatDate() {
      const date = new Date();
      return date.toLocaleDateString('en-US');
    }
  return (
    <div className={`post-detail ${x.matches && "active"}`} >
        <Close className='close' onClick={handleClick}/>
        <div className="detail-header">
            <img src={data.premium ? Profile : Logo} alt="powerking_vip" />
            <h3>{data.date} - {data.time}</h3>
        </div>
        <h4>
          odd: {data.odd}
          {
            //(data.status === 'finished' && data.won !== 'pending') && data.won !== 'won' ?<h4 className='icon'>Won <Verified className='icon won'/></h4> :  <h4 className='icon'>Lost <ErrorTwoTone className='icon lost'/></h4>
          }
          </h4>
        <hr className="divider"/>
        <h4><span style={{
                           color: (data.premium && (data.status !== 'finished') && (!isPremium && data.date === formatDate())) && 'transparent',
                           textShadow: (data.premium && (data.status !== 'finished') && (!isPremium && data.date === formatDate())) && '0 0 5px rgba(0,0,0,.1)'}}>{data.home}</span> <span>{data.results ? data.results.split('-')[0] : "?" }</span></h4>
        <hr className="divider"/>
        <h4><span style={{
                           color: (data.premium && (data.status !== 'finished') && (!isPremium && data.date === formatDate())) && 'transparent',
                           textShadow: (data.premium && (data.status !== 'finished') && (!isPremium && data.date === formatDate())) && '0 0 5px rgba(0,0,0,.1)'}}>{data.away}</span> <span>{data.results ? data.results.split('-')[1] : "?" }</span></h4>
        <hr className="divider"/>
        <div className="detail-btn">
          <button className="btn" disabled aria-label="premium">💡{data.pick}</button>
          {(data.premium && !isPremium) && <Link to={'/pay'} className='btn' onClick={() => setPrice(1)}>GET VIP</Link>}

          {isAdmin && <Link to={'/edit'} className='btn'  state={data}>Edit</Link>}
        </div>
    </div>
  )
}