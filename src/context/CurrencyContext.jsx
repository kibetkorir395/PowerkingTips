// context/CurrencyContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Country configurations with exchange rates
const COUNTRIES = {
    Nigeria: { code: "NG", currency: "NGN", symbol: "₦", flag: "🇳🇬", rate: 11.63 },
    Kenya: { code: "KE", currency: "KES", symbol: "KSH", flag: "🇰🇪", rate: 1 },
    SouthAfrica: { code: "ZA", currency: "ZAR", symbol: "R", flag: "🇿🇦", rate: 0.22 },
    Ghana: { code: "GH", currency: "GHS", symbol: "₵", flag: "🇬🇭", rate: 0.06 },
    Uganda: { code: "UG", currency: "UGX", symbol: "USh", flag: "🇺🇬", rate: 1.5 },
    Tanzania: { code: "TZ", currency: "TZS", symbol: "TSh", flag: "🇹🇿", rate: 1.15 },
    US: { code: "US", currency: "USD", symbol: "$", flag: "🇺🇸", rate: 0.0077 },
    UK: { code: "GB", currency: "GBP", symbol: "£", flag: "🇬🇧", rate: 0.006 },
};

const CurrencyContext = createContext();

export const useCurrency = () => {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
};

export const CurrencyProvider = ({ children }) => {
    const [selectedCountry, setSelectedCountry] = useState("Kenya");
    const [userCountry, setUserCountry] = useState(null);
    const [showCountrySelector, setShowCountrySelector] = useState(false);
    const [isLoadingRate, setIsLoadingRate] = useState(false);
    const [detectionFailed, setDetectionFailed] = useState(false);

    // Detect country from browser timezone
    const detectCountryFromBrowser = () => {
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            
            const timezoneMap = {
                "Africa/Nairobi": "Kenya",
                "Africa/Lagos": "Nigeria",
                "Africa/Johannesburg": "SouthAfrica",
                "Africa/Accra": "Ghana",
                "Africa/Kampala": "Uganda",
                "Africa/Dar_es_Salaam": "Tanzania",
                "America/New_York": "US",
                "America/Los_Angeles": "US",
                "Europe/London": "UK",
            };
            
            for (const [tz, country] of Object.entries(timezoneMap)) {
                if (timezone.includes(tz) || timezone === tz) {
                    return country;
                }
            }
            
            const language = navigator.language || navigator.userLanguage;
            const languageMap = {
                "sw": "Kenya",
                "sw-KE": "Kenya",
                "en-KE": "Kenya",
                "en-NG": "Nigeria",
                "en-ZA": "SouthAfrica",
                "en-GH": "Ghana",
                "en-UG": "Uganda",
                "en-TZ": "Tanzania",
                "en-US": "US",
                "en-GB": "UK",
            };
            
            return languageMap[language] || null;
        } catch (error) {
            console.error("Browser detection error:", error);
            return null;
        }
    };

    // Detect using freegeoip.app
    const detectCountryFromFreeGeoIP = async () => {
        try {
            const response = await fetch("https://api.freegeoip.app/json/", {
                method: "GET",
                headers: { "Accept": "application/json" },
            });
            
            if (response.ok) {
                const data = await response.json();
                const countryCode = data.country_code;
                
                const codeMap = {
                    "KE": "Kenya",
                    "NG": "Nigeria",
                    "ZA": "SouthAfrica",
                    "GH": "Ghana",
                    "UG": "Uganda",
                    "TZ": "Tanzania",
                    "US": "US",
                    "GB": "UK",
                };
                
                return codeMap[countryCode] || null;
            }
            return null;
        } catch (error) {
            console.error("FreeGeoIP detection error:", error);
            return null;
        }
    };

    // Detect using ip-api.com
    const detectCountryFromIPAPI = async () => {
        try {
            const response = await fetch("https://ip-api.com/json/", {
                method: "GET",
                headers: { "Accept": "application/json" },
            });
            
            if (response.ok) {
                const data = await response.json();
                const countryCode = data.countryCode;
                
                const codeMap = {
                    "KE": "Kenya",
                    "NG": "Nigeria",
                    "ZA": "SouthAfrica",
                    "GH": "Ghana",
                    "UG": "Uganda",
                    "TZ": "Tanzania",
                    "US": "US",
                    "GB": "UK",
                };
                
                return codeMap[countryCode] || null;
            }
            return null;
        } catch (error) {
            console.error("IP-API detection error:", error);
            return null;
        }
    };

    // Detect using ipapi.co
    const detectCountryFromIPAPIco = async () => {
        try {
            const response = await fetch("https://ipapi.co/json/");
            if (response.ok) {
                const data = await response.json();
                const countryCode = data.country_code;
                
                const matchedCountry = Object.entries(COUNTRIES).find(
                    ([_, config]) => config.code === countryCode
                );
                
                if (matchedCountry) {
                    return matchedCountry[0];
                }
            }
            return null;
        } catch (error) {
            console.error("IPAPI.co detection error:", error);
            return null;
        }
    };

    // Get stored country from localStorage
    const getStoredCountry = () => {
        try {
            const stored = localStorage.getItem("userCountry");
            if (stored && COUNTRIES[stored]) {
                return stored;
            }
            return null;
        } catch (error) {
            return null;
        }
    };

    // Save country to localStorage
    const saveCountryToStorage = (country) => {
        try {
            localStorage.setItem("userCountry", country);
        } catch (error) {
            console.error("Error saving country:", error);
        }
    };

    // Main country detection function
    const detectUserCountry = async () => {
        setDetectionFailed(false);
        
        // Check localStorage first
        const storedCountry = getStoredCountry();
        if (storedCountry) {
            setSelectedCountry(storedCountry);
            setUserCountry(storedCountry);
            return;
        }
        
        // Try browser detection first (fastest)
        const browserCountry = detectCountryFromBrowser();
        if (browserCountry && COUNTRIES[browserCountry]) {
            setSelectedCountry(browserCountry);
            setUserCountry(browserCountry);
            saveCountryToStorage(browserCountry);
            return;
        }
        
        // Try IPAPI.co
        try {
            const ipapiCoCountry = await detectCountryFromIPAPIco();
            if (ipapiCoCountry && COUNTRIES[ipapiCoCountry]) {
                setSelectedCountry(ipapiCoCountry);
                setUserCountry(ipapiCoCountry);
                saveCountryToStorage(ipapiCoCountry);
                return;
            }
        } catch (error) {
            console.log("IPAPI.co failed, trying next method...");
        }
        
        // Try FreeGeoIP
        try {
            const freeGeoIPCountry = await detectCountryFromFreeGeoIP();
            if (freeGeoIPCountry && COUNTRIES[freeGeoIPCountry]) {
                setSelectedCountry(freeGeoIPCountry);
                setUserCountry(freeGeoIPCountry);
                saveCountryToStorage(freeGeoIPCountry);
                return;
            }
        } catch (error) {
            console.log("FreeGeoIP failed, trying next method...");
        }
        
        // Try IP-API
        try {
            const ipAPICountry = await detectCountryFromIPAPI();
            if (ipAPICountry && COUNTRIES[ipAPICountry]) {
                setSelectedCountry(ipAPICountry);
                setUserCountry(ipAPICountry);
                saveCountryToStorage(ipAPICountry);
                return;
            }
        } catch (error) {
            console.log("IP-API failed, using default...");
        }
        
        // Final fallback - Kenya
        setSelectedCountry("Kenya");
        setUserCountry(null);
        setDetectionFailed(true);
    };

    // Set country manually
    const setCountry = (countryName) => {
        if (COUNTRIES[countryName]) {
            setSelectedCountry(countryName);
            saveCountryToStorage(countryName);
            return true;
        }
        return false;
    };

    // Get all countries
    const getCountries = () => {
        return COUNTRIES;
    };

    // Get country config
    const getCountryConfig = () => {
        return COUNTRIES[selectedCountry];
    };

    // Get currency symbol
    const getSymbol = () => {
        return COUNTRIES[selectedCountry]?.symbol || "KSH";
    };

    // Get currency code
    const getCurrencyCode = () => {
        return COUNTRIES[selectedCountry]?.currency || "KES";
    };

    // Convert a single price from KES to local currency
    const convertPrice = (priceInKES) => {
        const rate = COUNTRIES[selectedCountry]?.rate || 1;
        return Math.round(priceInKES * rate);
    };

    // Convert from local currency back to KES
    const convertToKES = (priceInLocal) => {
        const rate = COUNTRIES[selectedCountry]?.rate || 1;
        return Math.round(priceInLocal / rate);
    };

    // Convert multiple prices
    const convertPrices = async (basePrices) => {
        setIsLoadingRate(true);
        try {
            const rate = COUNTRIES[selectedCountry]?.rate || 1;
            const converted = {};
            Object.keys(basePrices).forEach((key) => {
                converted[key] = Math.round(basePrices[key] * rate);
            });
            return converted;
        } catch (error) {
            console.error("Error converting prices:", error);
            return basePrices;
        } finally {
            setIsLoadingRate(false);
        }
    };

    // Detect country on mount
    useEffect(() => {
        detectUserCountry();
    }, []);

    const value = {
        // State
        selectedCountry,
        userCountry,
        showCountrySelector,
        isLoadingRate,
        detectionFailed,
        
        // Methods
        setSelectedCountry,
        setShowCountrySelector,
        setCountry,
        detectUserCountry,
        getCountries,
        getCountryConfig,
        getSymbol,
        getCurrencyCode,
        convertPrice,
        convertToKES,
        convertPrices,
        saveCountryToStorage,
        getStoredCountry,
        
        // Convenience
        symbol: getSymbol(),
        currency: getCurrencyCode(),
        countries: COUNTRIES,
    };

    return (
        <CurrencyContext.Provider value={value}>
            {children}
        </CurrencyContext.Provider>
    );
};

export default CurrencyContext;