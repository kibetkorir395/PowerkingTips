import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

export default function AppHelmet({ title }) {
  const location = useLocation();
  const canonicalUrl = encodeURI(
    `${window.location.origin}${location.pathname}`
  );

  return (
    <Helmet>
      {/* ============================================= */}
      {/* PRIMARY TITLE (Dynamic per page)              */}
      {/* ============================================= */}
      <title>
        {title} | POWERKING TIPS - Football Predictions, Live Scores & Betting Odds
      </title>

      {/* ============================================= */}
      {/* DYNAMIC CANONICAL URL (per page)              */}
      {/* ============================================= */}
      <link rel="canonical" href={canonicalUrl} />

      {/* ============================================= */}
      {/* DYNAMIC OPEN GRAPH URL (per page)              */}
      {/* ============================================= */}
      <meta property="og:url" content={canonicalUrl} />
      <meta
        property="og:title"
        content={`${title} | POWERKING TIPS - Football Predictions & Live Scores`}
      />
      <meta
        name="twitter:title"
        content={`${title} | POWERKING TIPS - Football Predictions`}
      />

      {/* ============================================= */}
      {/* PAGE SPECIFIC META (can be overridden)        */}
      {/* ============================================= */}
      {title === "Home" && (
        <meta
          name="description"
          content="Get all the latest Football Predictions, Betting Odds, livescores, results & fixtures for all leagues. Access expert VIP tips and accurate match predictions."
        />
      )}
      {title === "About" && (
        <meta
          name="description"
          content="Learn about PowerKing Tips - your trusted source for accurate football predictions, expert analysis, and VIP betting tips."
        />
      )}
      {title === "Tips" && (
        <meta
          name="description"
          content="Daily football predictions and betting tips. Free and VIP tips for Premier League, La Liga, Bundesliga, and more."
        />
      )}
      {title === "Register" && (
        <meta
          name="description"
          content="Join PowerKing Tips for free and get access to daily football predictions and betting tips."
        />
      )}
      {title === "Login" && (
        <meta
          name="description"
          content="Login to your PowerKing Tips account to access VIP predictions and betting tips."
        />
      )}
      {title === "Pay" && (
        <meta
          name="description"
          content="Upgrade to VIP membership at PowerKing Tips. Get premium predictions and increase your winning chances."
        />
      )}
    </Helmet>
  );
}