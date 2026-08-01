// components/Pricing/Pricing.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Star, TrendingUp, AccessTime, EmojiEvents } from '@mui/icons-material';
import { usePrice } from '../../context/PriceContext';
import { useCurrency } from '../../context/CurrencyContext.jsx';
import './Pricing.scss';

// Base prices in KES
const BASE_PRICES = {
    silver: 250,
    gold: 800,
    platinum: 2500
};

export default function Pricing() {
    const navigate = useNavigate();
    const { setPrice } = usePrice();
    const { 
        selectedCountry, 
        setSelectedCountry, 
        showCountrySelector, 
        setShowCountrySelector,
        userCountry,
        getSymbol,
        getCurrencyCode,
        getCountries,
        isLoadingRate,
        convertPrice
    } = useCurrency();
    
    const [convertedPrices, setConvertedPrices] = useState({
        silver: 250,
        gold: 800,
        platinum: 2500
    });

    // Convert prices when country changes
    useEffect(() => {
        const countries = getCountries();
        const rate = countries[selectedCountry]?.rate || 1;
        
        setConvertedPrices({
            silver: Math.round(BASE_PRICES.silver * rate),
            gold: Math.round(BASE_PRICES.gold * rate),
            platinum: Math.round(BASE_PRICES.platinum * rate)
        });
    }, [selectedCountry]);

    const handleClick = (price) => {
        // Convert the selected price back to KES for consistency
        const countries = getCountries();
        const rate = countries[selectedCountry]?.rate || 1;
        const priceInKES = Math.round(price / rate);
        setPrice(priceInKES);
        navigate('/pay');
    };

    const plans = [
        {
            id: 1,
            title: "Silver",
            price: 250,
            basePrice: 250,
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
            price: 800,
            basePrice: 800,
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
            price: 2500,
            basePrice: 2500,
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
    ];

    const Item = ({ data, isPopular }) => {
        const planKey = data.title.toLowerCase();
        const convertedPrice = convertedPrices[planKey] || data.basePrice;
        const currencySymbol = getSymbol();
        const currencyCode = getCurrencyCode();

        return (
            <div className={`pricing-card ${isPopular ? 'popular' : ''}`} data-plan={data.title.toLowerCase()}>
                {isPopular && <div className="popular-badge">MOST POPULAR</div>}
                <div className="card-header" style={{ background: data.gradient }}>
                    <div className="card-icon">{data.icon}</div>
                    <h1>{data.title}</h1>
                </div>
                
                <div className="card-price">
                    <span className="currency">{currencySymbol}</span>
                    <span className="price">
                        {isLoadingRate ? '...' : convertedPrice.toLocaleString()}
                    </span>
                    <span className="duration">{data.duration}</span>
                    {currencyCode !== "KES" && (
                        <div className="original-price">
                            ≈ KSH {data.basePrice.toLocaleString()}
                        </div>
                    )}
                </div>
                
                <ul className="features-list">
                    {data.features.map((item, idx) => {
                        return <li key={idx}>
                            <CheckCircle className="feature-icon" />
                            <span>{item}</span>
                        </li>
                    })}
                </ul>
                
                <button className="btn pricing-btn" onClick={() => handleClick(convertedPrice)}>
                    <TrendingUp className="btn-icon" />
                    Get Started Now
                    <span className="btn-glow"></span>
                </button>

                {currencyCode !== "KES" && (
                    <div className="currency-note">
                        💱 Price shown in {currencyCode}
                    </div>
                )}
            </div>
        );
    };

    const countries = getCountries();

    return (
        <div className="pricing-section" id='pricing'>
            <div className="pricing-header">
                <h2>Choose Your Plan</h2>
                <p>Select the perfect plan for your betting success</p>
            </div>
            
            {/* Country Selector */}
            {showCountrySelector && (<div className="pricing-country-selector">
                <div 
                    className="selected-country" 
                    onClick={() => setShowCountrySelector(!showCountrySelector)}
                >
                    <span className="flag">{countries[selectedCountry]?.flag || "🌍"}</span>
                    <span className="country-name">{selectedCountry}</span>
                    <span className="country-currency">
                        {getCurrencyCode()} ({getSymbol()})
                    </span>
                    <span className="dropdown-arrow">
                        {showCountrySelector ? "▲" : "▼"}
                    </span>
                </div>

                
                    <div className="country-dropdown">
                        {Object.entries(countries).map(([country, config]) => (
                            <div
                                key={country}
                                className={`country-option ${selectedCountry === country ? "active" : ""}`}
                                onClick={() => {
                                    setSelectedCountry(country);
                                    setShowCountrySelector(false);
                                }}
                            >
                                <span className="flag">{config.flag}</span>
                                <span className="country-name">{country}</span>
                                <span className="currency-code">{config.currency}</span>
                                <span className="currency-symbol">{config.symbol}</span>
                            </div>
                        ))}
                    </div>
                

                {userCountry && userCountry !== selectedCountry && (
                    <div className="detected-country">
                        🔍 Detected: {userCountry}
                        <button onClick={() => setSelectedCountry(userCountry)}>
                            Use {userCountry}
                        </button>
                    </div>
                )}
            </div>)}

            <div className="pricing-container">
                {plans.map((item, index) => {
                    return <Item data={item} key={item.id} isPopular={index === 1} />
                })}
            </div>
        </div>
    );
}