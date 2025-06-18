import React, { useContext } from 'react'
import './Pricing.scss'
import { PriceContext } from '../../PriceContext';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
    const navigate = useNavigate();
    const { setPrice } = useContext(PriceContext);

    const handleClick = (price) => {
        setPrice(price)
        navigate('/pay')
    }
    const plans = [
        {
            id: 1,
            title: "Silver",
            price: 200,
            duration: "/Day",
            features: [
                "Every day is game day! Check out our daily tips and win big!",
                "Access 24 hours VIP predictions",
                "Expert Football Predictions"
            ]
        },
        {
            id: 2,
            title: "Gold",
            //slogan: "30% cashback on your first purchase",
            price: 600,
            duration: "/Week",
            features: [
                "Get the scoop on this week’s matches",
                "Enjoy a full week of VIP predictions",
                "Weekly unbeatable football predictions!"
            ]
        },
        {
            id: 3,
            title: "Platinum",
            //slogan: "50% cashback on your first purchase",
            price: 3000,
            duration: "/Month",
            features: [
                "Plan ahead with our monthly predictions.",
                "Get unlimited VIP access for a month",
                "Your winning streak starts here!"
            ]
        }
    ]
    const Item = ({ data }) => {
        return (
            <div className="item" key={data.duration}>
                <h1>{data.title} {data.slogan && <><br /><div className='slogan'>{data.slogan}</div></>} </h1>

                <p><span>KSH</span><span>{data.price}</span><span>{data.duration}</span></p>
                <ul>
                    {
                        data.features.map(item => {
                            return <li key={item}>{item}</li>
                        })
                    }
                </ul>
                <button className="btn" onClick={() => handleClick(data.price)}>Get Started Now</button>
            </div>
        )
    }
    return (
        <div className="pricing" id='pricing'>
            {
                plans.map(item => {
                    return <Item data={item} key={item.id} />
                })
            }
        </div>
    )
}
