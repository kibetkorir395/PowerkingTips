import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Star, TrendingUp, AccessTime, EmojiEvents } from '@mui/icons-material';
import { usePrice } from '../../context/PriceContext';
import './Pricing.scss';

export default function Pricing() {
    const navigate = useNavigate();
    const { setPrice } = usePrice();

    const handleClick = (price) => {
        setPrice(price);
        navigate('/pay');
    }
    
    const plans = [
        {
            id: 1,
            title: "Silver",
            price: 250,
            duration: "/Day",
            icon: <AccessTime />,
            color: "#A8A8A8",
            gradient: "linear-gradient(135deg, #A8A8A8, #808080)",
            features: [
                "Every day is game day! Check out our daily tips and win big!",
                "Access 24 hours VIP predictions",
                "Expert Football Predictions"
            ]
        },
        {
            id: 2,
            title: "Gold",
            price: 850,
            duration: "/Week",
            icon: <Star />,
            color: "#FFD700",
            gradient: "linear-gradient(135deg, #FFD700, #FFA500)",
            features: [
                "Get the scoop on this week's matches",
                "Enjoy a full week of VIP predictions",
                "Weekly unbeatable football predictions!"
            ]
        },
        {
            id: 3,
            title: "Platinum",
            price: 3000,
            duration: "/Month",
            icon: <EmojiEvents />,
            color: "#00ae58",
            gradient: "linear-gradient(135deg, #00ae58, #007a37)",
            features: [
                "Plan ahead with our monthly predictions.",
                "Get unlimited VIP access for a month",
                "Your winning streak starts here!"
            ]
        }
    ]
    
    const Item = ({ data, isPopular }) => {
        return (
            <div className={`pricing-card ${isPopular ? 'popular' : ''}`} data-plan={data.title.toLowerCase()}>
                {isPopular && <div className="popular-badge">MOST POPULAR</div>}
                <div className="card-header" style={{ background: data.gradient }}>
                    <div className="card-icon">{data.icon}</div>
                    <h1>{data.title}</h1>
                </div>
                
                <div className="card-price">
                    <span className="currency">KSH</span>
                    <span className="price">{data.price}</span>
                    <span className="duration">{data.duration}</span>
                </div>
                
                <ul className="features-list">
                    {data.features.map((item, idx) => {
                        return <li key={idx}>
                            <CheckCircle className="feature-icon" />
                            <span>{item}</span>
                        </li>
                    })}
                </ul>
                
                <button className="btn pricing-btn" onClick={() => handleClick(data.price)}>
                    <TrendingUp className="btn-icon" />
                    Get Started Now
                    <span className="btn-glow"></span>
                </button>
            </div>
        )
    }
    
    return (
        <div className="pricing-section" id='pricing'>
            <div className="pricing-header">
                <h2>Choose Your Plan</h2>
                <p>Select the perfect plan for your betting success</p>
            </div>
            <div className="pricing-container">
                {plans.map((item, index) => {
                    return <Item data={item} key={item.id} isPopular={index === 1} />
                })}
            </div>
        </div>
    )
}