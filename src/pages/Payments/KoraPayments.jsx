import { useContext, useState, useEffect } from 'react'
import './Ticket2.scss';
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
  const [convertedPrices, setConvertedPrices] = useState({
    daily: 250,
    weekly: 800,
    monthly: 3000,
    yearly: 8000
  });
  const [exchangeRates, setExchangeRates] = useState({});
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [userCountry, setUserCountry] = useState(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);

  // Country configurations
  const countries = {
    'Nigeria': { code: 'NG', currency: 'NGN', flag: '🇳🇬', defaultPrice: 2500 },
    //'Cameroon': { code: 'CM', currency: 'XAF', flag: '🇨🇲', defaultPrice: 1500 },
    //'Ghana': { code: 'GH', currency: 'GHS', flag: '🇬🇭', defaultPrice: 20 },
    //'South Africa': { code: 'ZA', currency: 'ZAR', flag: '🇿🇦', defaultPrice: 50 },
    'Kenya': { code: 'KE', currency: 'KES', flag: '🇰🇪', defaultPrice: 250 },
    //'Egypt': { code: 'EG', currency: 'EGP', flag: '🇪🇬', defaultPrice: 80 },
    //'Ivory Coast': { code: 'CI', currency: 'XOF', flag: '🇨🇮', defaultPrice: 1000 }
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
      
      setSelectedCountry('Kenya');
      setUserCountry('Kenya');
    } catch (error) {
      console.error('Error detecting country:', error);
      setSelectedCountry('Kenya');
      setUserCountry('Kenya');
    }
  };

  // Fetch exchange rate for all plans
  const fetchAllExchangeRates = async (toCurrency) => {
    if (toCurrency === 'KES') {
      setConvertedPrices({
        daily: 250,
        weekly: 800,
        monthly: 3000,
        yearly: 8000
      });
      return;
    }

    setIsLoadingRate(true);
    try {
      const plans = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
      const newConvertedPrices = {};
      const newExchangeRates = {};

      for (const plan of plans) {
        const amountInKES = priceOptions[plan];
        
        const response = await fetch('https://api.korapay.com/api/v1/conversions/rates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_API_KEY'
          },
          body: JSON.stringify({
            amount: amountInKES,
            from_currency: 'KES',
            to_currency: toCurrency,
            reference: `rate-${currentUser?.email || 'guest'}-${plan}-${Date.now()}`
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch exchange rate');
        }

        const result = await response.json();
        
        if (result.status && result.data) {
          newConvertedPrices[plan.toLowerCase()] = result.data.to_amount;
          newExchangeRates[plan] = result.data.rate;
        } else {
          throw new Error('Invalid response');
        }
      }
      
      //setConvertedPrices(newConvertedPrices);
      //setExchangeRates(newExchangeRates);

      const fallbackRate = getFallbackRate(toCurrency);
      setConvertedPrices({
        daily: 250 * fallbackRate,
        weekly: 800 * fallbackRate,
        monthly: 3000 * fallbackRate,
        yearly: 8000 * fallbackRate
      });
      
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Fallback to manual conversion
      const fallbackRate = getFallbackRate(toCurrency);
      setConvertedPrices({
        daily: 250 * fallbackRate,
        weekly: 800 * fallbackRate,
        monthly: 3000 * fallbackRate,
        yearly: 8000 * fallbackRate
      });
    } finally {
      setIsLoadingRate(false);
    }
  };

  // Fallback rates if API fails
  const getFallbackRate = (toCurrency) => {
    const fallbackRates = {
      'NGN': 10.63,
      'XAF': 4.37,
      'GHS': 0.084,
      'ZAR': 0.13,
      'KES': 1,
      'EGP': 0.41,
      'XOF': 4.37
    };
    return fallbackRates[toCurrency] || 1;
  };

  // Update all prices when country changes
  useEffect(() => {
    const updatePricesForCountry = async () => {
      const countryConfig = countries[selectedCountry];
      await fetchAllExchangeRates(countryConfig.currency);
    };
    
    updatePricesForCountry();
  }, [selectedCountry]);

  // Detect user country on component mount
  useEffect(() => {
    detectUserCountry();
  }, []);

  const returnPeriod = () => {
    if (price === 250) return 'Daily';
    if (price === 800) return 'Weekly';
    if (price === 3000) return 'Monthly';
    return 'Yearly';
  };

  const getCurrentConvertedPrice = () => {
    const period = returnPeriod().toLowerCase();
    return convertedPrices[period] || price;
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
        amountPaidKES: price,
        amountPaidLocal: getCurrentConvertedPrice(),
        exchangeRate: exchangeRates[returnPeriod()]
      }, { merge: true });
      
      alert(`You Have Upgraded To ${returnPeriod()} VIP (${selectedCountry})`);
      await getUser(currentUser.email, setUserData);
      window.location.pathname = '/';
    } catch (error) {
      console.error("Error upgrading user:", error.message);
      alert(error.message);
    }
  };

  const handlePayment = () => {
    const countryConfig = countries[selectedCountry];
    
    const paymentOptions = {
      key: "pk_live_Gu3aUUGAzWj1zeonHdwBAi4oDD9Vc4AViyHWqALp",
      reference: `ref-${Date.now()}`,
      amount: Math.round(getCurrentConvertedPrice()),
      currency: countryConfig.currency,
      customer: {
        name: currentUser.email,
        email: currentUser.email,
      },
      /*metadata: {
        country: selectedCountry,
        plan: returnPeriod(),
        original_price_KES: price,
        converted_amount: getCurrentConvertedPrice(),
        exchange_rate: exchangeRates[returnPeriod()],
        from_currency: 'KES',
        to_currency: countryConfig.currency
      },*/
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
            {isLoadingRate ? 'Loading...' : `${countries[selectedCountry].currency} ${Math.round(convertedPrices.daily)}`}
          </span>
        </fieldset>
        <fieldset>
          <input name="prices" type="radio" value={800} id="weekly" checked={price === 800} onChange={(e) => setPrice(800)} />
          <label htmlFor="weekly">7 Days VIP</label>
          <span className="price">
            {isLoadingRate ? 'Loading...' : `${countries[selectedCountry].currency} ${Math.round(convertedPrices.weekly)}`}
          </span>
        </fieldset>
        <fieldset>
          <input name="prices" type="radio" value={3000} id="monthly" checked={price === 3000} onChange={(e) => setPrice(3000)} />
          <label htmlFor="monthly">30 Days VIP</label>
          <span className="price">
            {isLoadingRate ? 'Loading...' : `${countries[selectedCountry].currency} ${Math.round(convertedPrices.monthly)}`}
          </span>
        </fieldset>
        <fieldset>
          <input name="prices" type="radio" value={8000} id="yearly" checked={price === 8000} onChange={(e) => setPrice(8000)} />
          <label htmlFor="yearly">1 Year VIP</label>
          <span className="price">
            {isLoadingRate ? 'Loading...' : `${countries[selectedCountry].currency} ${Math.round(convertedPrices.yearly)}`}
          </span>
        </fieldset>
      </form>
      
      <h4>
        GET {returnPeriod().toUpperCase()} VIP FOR {' '}
        {isLoadingRate ? 'Loading...' : `${countries[selectedCountry].currency} ${Math.round(getCurrentConvertedPrice())}`}
      </h4>
      
      <button onClick={handlePayment} className="btn" disabled={isLoadingRate}>
        Pay Now
      </button>
    </div>
  );
}
