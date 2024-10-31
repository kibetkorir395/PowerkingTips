import { useContext, useEffect, useState } from 'react'
import './Flyer.scss'
import { Link} from 'react-router-dom';
import { PriceContext } from '../../PriceContext';
import { getWonTips } from '../../firebase';
import { ErrorTwoTone, TimelapseOutlined, Verified } from '@mui/icons-material';

export default function Flyer() {
  const {setPrice} = useContext(PriceContext);
  const [tips, setTips] = useState(null);
  const [isOnline] = useState(() =>{
    return navigator.onLine
  })

  useEffect(() =>{
    getWonTips(10,setTips);
  }, [isOnline]);


  function truncateLeague(input, value) {
    if (input.length > value) {
       return input.substring(0, value) + '...';
    }
    return input;
  };

  return (
    <div className='flyer'>
          <h1 className='title'>Expert Football Predictions!</h1>
          <h2 className='title'>Unlock the secret of winning high today!</h2>
          <Link to={'pay'} className='btn' onClick={() => setPrice(3000)}>GET STARTED</Link>
          <div className="scroll">
            <div className="scroll-track">
            {
              tips && tips.filter((tip) =>(tip.won === 'won')).map((tip) => {
                return (
                <div className="post-card" key={tip.id} style={{borderLeft: tip.premium ? "5px solid #FFBD59" : "5px solid green"}}>
                  <div className="center">
                    <div className="teams">
                      <p className="name">{truncateLeague(tip.home , 10)}</p>
                      <div className="results">{tip.results}</div>
                      <p className="name">{truncateLeague(tip.away , 15)}</p>
                    </div>
                    <div className='info'>
                      <p><TimelapseOutlined className='icon'/>{tip.date}</p>
                      <p>{tip.won ? <>{tip.odd} <Verified className='icon won'/></> : <>{tip.odd} <ErrorTwoTone className='icon lost'/></>  }</p>
                    </div>
                  </div>
                </div>
                )
              })
            }
            </div>
          </div>
    </div>
  )
}
