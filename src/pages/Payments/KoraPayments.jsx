import { useContext, useState, useEffect } from 'react'
import './Ticket.scss';
import { PriceContext } from '../../PriceContext';
import AppHelmet from '../../components/AppHelmet';
import KoraPayment from 'kora-checkout';
import { AuthContext } from '../../AuthContext';
import { db, getUser } from '../../firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function KoraPayments({ setUserData }) {
  const { price, setPrice } = useContext(PriceContext);
  const { currentUser } = useContext(AuthContext);
  const [selectedCountry, setSelectedCountry] = useState('Kenya');
  const [convertedPrice, setConvertedPrice] = useState(price);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [userCountry, setUserCountry] = useState(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  // Country configurations
  const countries = {
    'Nigeria': { code: 'NG', currency: 'NGN', flag: '🇳🇬', defaultPrice: 2500 },
    'Cameroon': { code: 'CM', currency: 'XAF', flag: '🇨🇲', defaultPrice: 1500 },
    'Ghana': { code: 'GH', currency: 'GHS', flag: '🇬🇭', defaultPrice: 20 },
    'South Africa': { code: 'ZA', currency: 'ZAR', flag: '🇿🇦', defaultPrice: 50 },
    'Kenya': { code: 'KE', currency: 'KES', flag: '🇰🇪', defaultPrice: 250 },
    'Egypt': { code: 'EG', currency: 'EGP', flag: '🇪🇬', defaultPrice: 80 },
    'Ivory Coast': { code: 'CI', currency: 'XOF', flag: '🇨🇮', defaultPrice: 1000 }
  };

  // Price options in KES (base currency)
  const priceOptions = {
    'Daily': 250,
    'Weekly': 800,
    'Monthly': 3000,
    'Yearly': 8000
  };

  // Detect user's country using IP geolocation
  const detectUserCountry = async () => {
    try {
      // Try multiple APIs for reliability
      const apis = [
        'https://ipapi.co/json/',
        'https://ipwho.is/',
        'https://api.country.is/'
      ];

      for (const apiUrl of apis) {
        try {
          const response = await fetch(apiUrl);
          if (!response.ok) continue;
          
          const data = await response.json();
          let countryCode = '';
          
          if (apiUrl.includes('ipapi.co')) {
            countryCode = data.country_code;
          } else if (apiUrl.includes('ipwho.is')) {
            countryCode = data.country_code;
          } else if (apiUrl.includes('country.is')) {
            countryCode = data.country;
          }
          
          // Find matching country
          const matchedCountry = Object.entries(countries).find(
            ([_, config]) => config.code === countryCode
          );
          
          if (matchedCountry) {
            setSelectedCountry(matchedCountry[0]);
            setUserCountry(matchedCountry[0]);
            return;
          }
        } catch (err) {
          console.log('IP detection failed:', err);
          continue;
        }
      }
      
      // Default to Kenya if detection fails
      setSelectedCountry('Kenya');
      setUserCountry('Kenya');
    } catch (error) {
      console.error('Error detecting country:', error);
      setSelectedCountry('Kenya');
      setUserCountry('Kenya');
    }
  };

  // Fetch exchange rate from Kora API
  const fetchExchangeRate = async (toCurrency, amountInKES) => {
    // If the selected country is Kenya, no conversion needed
    if (toCurrency === 'KES') {
      setConvertedPrice(amountInKES);
      setExchangeRate(1);
      setIsLoadingRate(false);
      return amountInKES;
    }

    setIsLoadingRate(true);
    try {
      const response = await fetch('https://api.korapay.com/api/v1/conversions/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY' // Add your Kora API key here
        },
        body: JSON.stringify({
          amount: amountInKES,
          from_currency: 'KES', // Always KES as source currency
          to_currency: toCurrency,
          reference: `rate-${currentUser?.email || 'guest'}-${Date.now()}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exchange rate');
      }

      const result = await response.json();
      
      if (result.status && result.data) {
        setExchangeRate(result.data.rate);
        setConvertedPrice(result.data.to_amount);
        return result.data.to_amount;
      } else {
        throw new Error('Invalid response from exchange rate API');
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Fallback to manual conversion if API fails
      const fallbackRate = getFallbackRate(toCurrency);
      const manualConverted = amountInKES * fallbackRate;
      setConvertedPrice(manualConverted);
      return manualConverted;
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Fallback rates if API fails (approximate rates from KES)
  const getFallbackRate = (toCurrency) => {
    const fallbackRates = {
      'NGN': 1.5,    // 1 KES ≈ 1.5 NGN
      'XAF': 6,      // 1 KES ≈ 6 XAF
      'GHS': 0.12,   // 1 KES ≈ 0.12 GHS
      'ZAR': 0.13,   // 1 KES ≈ 0.13 ZAR
      'KES': 1,      // Base currency
      'EGP': 0.47,   // 1 KES ≈ 0.47 EGP
      'XOF': 6       // 1 KES ≈ 6 XOF
    };
    return fallbackRates[toCurrency] || 1;
  };

  // Update price when country or selected plan changes
  useEffect(() => {
    const updatePriceForCountry = async () => {
      const basePrice = priceOptions[returnPeriod()];
      const countryConfig = countries[selectedCountry];
      
      // Always convert from KES to selected country's currency
      await fetchExchangeRate(countryConfig.currency, basePrice);
    };
    
    updatePriceForCountry();
  }, [selectedCountry, price]);

  // Detect user country on component mount
  useEffect(() => {
    detectUserCountry();
  }, []);

  const returnPeriod = () => {
    if (price === 250) {
      return 'Daily';
    } else if (price === 800) {
      return 'Weekly';
    } else if (price === 3000) {
      return 'Monthly';
    } else {
      return 'Yearly';
    }
  };

  const handleUpgrade = async () => {
    try {
      const currentDate = new Date().toISOString();
      const userDocRef = doc(db, "users", currentUser.email);
      await setDoc(userDocRef, {
        email: currentUser.email,
        username: currentUser.email,
        isPremium: true,
        subscription: returnPeriod(),
        subDate: currentDate,
        country: selectedCountry,
        currency: countries[selectedCountry].currency,
        amountPaidKES: price, // Original amount in KES
        amountPaidLocal: convertedPrice, // Converted amount
        exchangeRate: exchangeRate
      }, { merge: true }).then(async (response) => {
        alert(`You Have Upgraded To ${returnPeriod()} VIP (${selectedCountry})`);
      }).then(async () => {
        await getUser(currentUser.email, setUserData);
      }).then(async () => {
        window.location.pathname = '/';
      }).catch(async (error) => {
        const errorMessage = await error.message;
        alert(errorMessage);
      });
    } catch (error) {
      console.error("Error upgrading user:", error.message);
    }
  };

  const handlePayment = () => {
    const countryConfig = countries[selectedCountry];
    
    const paymentOptions = {
      key: "pk_live_Gu3aUUGAzWj1zeonHdwBAi4oDD9Vc4AViyHWqALp",
      reference: `ref-${Date.now()}`,
      amount: convertedPrice,
      currency: countryConfig.currency,
      customer: {
        name: currentUser.email,
        email: currentUser.email,
      },
      metadata: {
        country: selectedCountry,
        plan: returnPeriod(),
        original_price_KES: price,
        converted_amount: convertedPrice,
        exchange_rate: exchangeRate,
        from_currency: 'KES',
        to_currency: countryConfig.currency
      },
      onSuccess: () => {
        handleUpgrade();
      },
      onFailed: (err) => {
        console.error(err.message);
        alert('Payment failed. Please try again.');
      }
    };

    const payment = new KoraPayment();
    payment.initialize(paymentOptions);
  };

  return (
    <div className="pay">
      <AppHelmet title={"Pay"} location={'/pay'} />
      
      {/* Country Selection Section */}
      <div className="country-selector">
        <div className="selected-country" onClick={() => setShowCountrySelector(!showCountrySelector)}>
          <span className="flag">{countries[selectedCountry].flag}</span>
          <span className="country-name">{selectedCountry}</span>
          <span className="dropdown-arrow">{showCountrySelector ? '▲' : '▼'}</span>
        </div>
        
        {showCountrySelector && (
          <div className="country-dropdown">
            {Object.entries(countries).map(([country, config]) => (
              <div 
                key={country}
                className={`country-option ${selectedCountry === country ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCountry(country);
                  setShowCountrySelector(false);
                }}
              >
                <span className="flag">{config.flag}</span>
                <span className="country-name">{country}</span>
                <span className="currency">{config.currency}</span>
              </div>
            ))}
          </div>
        )}
        
        {userCountry && userCountry !== selectedCountry && (
          <div className="detected-country">
            🔍 Detected: {userCountry} 
            <button onClick={() => setSelectedCountry(userCountry)}>
              Use detected
            </button>
          </div>
        )}
      </div>

      <form>
        <fieldset>
          <input name="prices" type="radio" value={250} id="daily" checked={price === 250} onChange={(e) => setPrice(250)} />
          <label htmlFor="daily">Daily VIP</label>
          <span className="price">
            {isLoadingRate ? 'Loading...' : `${countries[selectedCountry].currency} ${Math.round(convertedPrice)}`}
          </span>
          <small className="original-price">
            (≈ KES {price})
          </small>
        </fieldset>
        <fieldset>
          <input name="prices" type="radio" value={800} id="weekly" checked={price === 800} onChange={(e) => setPrice(800)} />
          <label htmlFor="weekly">7 Days VIP</label>
          <span className="price">
            {isLoadingRate ? 'Loading...' : `${countries[selectedCountry].currency} ${Math.round(convertedPrice)}`}
          </span>
          <small className="original-price">
            (≈ KES {price})
          </small>
        </fieldset>
        <fieldset>
          <input name="prices" type="radio" value={3000} id="monthly" checked={price === 3000} onChange={(e) => setPrice(3000)} />
          <label htmlFor="monthly">30 Days VIP</label>
          <span className="price">
            {isLoadingRate ? 'Loading...' : `${countries[selectedCountry].currency} ${Math.round(convertedPrice)}`}
          </span>
          <small className="original-price">
            (≈ KES {price})
          </small>
        </fieldset>
        <fieldset>
          <input name="prices" type="radio" value={8000} id="yearly" checked={price === 8000} onChange={(e) => setPrice(8000)} />
          <label htmlFor="yearly">1 Year VIP</label>
          <span className="price">
            {isLoadingRate ? 'Loading...' : `${countries[selectedCountry].currency} ${Math.round(convertedPrice)}`}
          </span>
          <small className="original-price">
            (≈ KES {price})
          </small>
        </fieldset>
      </form>
      
      <h4>
        GET {returnPeriod().toUpperCase()} VIP FOR {' '}
        {isLoadingRate ? 'Loading...' : `${countries[selectedCountry].currency} ${Math.round(convertedPrice)}`}
        <small className="original-price-h4">
          (KES {price})
        </small>
      </h4>
      
      <button onClick={handlePayment} className="btn" disabled={isLoadingRate}>
        Pay Now
      </button>
    </div>
  );
}
