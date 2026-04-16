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
      {/* BASIC DOCUMENT STRUCTURE & CHARACTER SET      */}
      {/* ============================================= */}
      <meta charSet="UTF-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

      {/* ============================================= */}
      {/* PRIMARY TITLE (Dynamic with fallback)         */}
      {/* ============================================= */}
      <title>
        {title} | POWERKING TIPS - Football Predictions, Live Scores & Betting
        Odds
      </title>

      {/* ============================================= */}
      {/* PRIMARY DESCRIPTION (Most comprehensive)      */}
      {/* ============================================= */}
      <meta
        name="description"
        content="Get all the latest ✓Football Predictions, ✓Latest Football Betting Odds and livescores, results & fixtures for all leagues and competitions, including the Premier League, Championship and across the world. Access expert VIP tips, accurate match predictions, live scores, and betting insights. Get instant online loans to M-Pesa in minutes. No paperwork, no guarantors required. Enjoy fast approval, low interest rates, and flexible repayment options."
      />

      {/* ============================================= */}
      {/* VIEWPORT CONFIGURATION (Mobile optimization)   */}
      {/* ============================================= */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover"
      />

      {/* ============================================= */}
      {/* THEME COLORS (Primary & iOS)                   */}
      {/* ============================================= */}
      <meta name="theme-color" content="#00BFFF" />
      <meta name="background-color" content="#ebf4fc" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content="POWERKING TIPS" />

      {/* ============================================= */}
      {/* SEO & SEARCH ENGINE META TAGS                  */}
      {/* ============================================= */}
      <meta
        name="robots"
        content="index, follow, max-snippet:-1, max-image-preview:large"
      />
      <meta name="googlebot" content="index, follow" />
      <meta name="bingbot" content="index, follow" />
      <meta name="author" content="POWERKING TIPS" />
      <meta name="copyright" content="POWERKING TIPS" />
      <meta name="rating" content="General" />
      <meta name="revisit-after" content="1 days" />
      <meta name="language" content="English" />
      <meta name="application-name" content="POWERKING TIPS" />
      <link rel="canonical" href={canonicalUrl} />

      {/* ============================================= */}
      {/* COMPREHENSIVE KEYWORDS (Merged from all inputs)*/}
      {/* ============================================= */}
      <meta
        name="keywords"
        content="Football Predictions, Betting Odds, Live Scores, Live Sports, Football Results, Football Fixtures, Football Today, Premier League, Championship, Super Sports, Laliga, Bundesliga, Serie A, Live Bet, Casino, football tips, live football scores, football leagues, football betting, live football updates, soccer predictions, betting tips, live match scores, football match results, match schedules, football stats, football news, league standings, football competitions, soccer betting odds, instant loans, M-Pesa loans, online loans Kenya, quick loans, no paperwork loans, low interest loans, payday loans, fast loan approval, emergency loans, financial services, sports accessories, football gear, sports equipment, football boots, jerseys, training gear, protective equipment, sportswear, fitness accessories, athletic apparel, football gloves, shin guards, football kits, sports shop, running shoes, gym accessories, team uniforms, sports merchandise, health, nutrition, lifestyle, CRB Checker, credit score Kenya, loan eligibility, credit report, mobile loan, instant loan eligibility, credit history, credit rating, borrow money Kenya, loan apps Kenya, CRB listing check, CRB delisted, personal loans, no guarantor loans, mobile loans, same day loans, easy loan application, short term loans, cash loans, loan disbursement"
      />

      {/* ============================================= */}
      {/* FAVICONS & APPLE TOUCH ICONS (All sizes)       */}
      {/* ============================================= */}
      {/* Primary favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="shortcut icon" type="image/x-icon" href="/logo512.png" />

      {/* PNG favicons for multiple resolutions */}
      <link rel="icon" type="image/png" sizes="512x512" href="/logo512.png" />
      <link rel="icon" type="image/png" sizes="192x192" href="/logo192.png" />
      <link rel="icon" type="image/png" sizes="128x128" href="/logo128.png" />
      <link rel="icon" type="image/png" sizes="96x96" href="/logo96.png" />
      <link rel="icon" type="image/png" sizes="64x64" href="/logo64.png" />
      <link rel="icon" type="image/png" sizes="48x48" href="/logo48.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/logo32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/logo16.png" />

      {/* Apple Touch Icons (iOS home screen) */}
      <link rel="apple-touch-icon" href="/logo192.png" />
      <link rel="apple-touch-icon" sizes="57x57" href="/logo57.png" />
      <link rel="apple-touch-icon" sizes="60x60" href="/logo60.png" />
      <link rel="apple-touch-icon" sizes="72x72" href="/logo72.png" />
      <link rel="apple-touch-icon" sizes="76x76" href="/logo76.png" />
      <link rel="apple-touch-icon" sizes="114x114" href="/logo114.png" />
      <link rel="apple-touch-icon" sizes="120x120" href="/logo120.png" />
      <link rel="apple-touch-icon" sizes="144x144" href="/logo144.png" />
      <link rel="apple-touch-icon" sizes="152x152" href="/logo152.png" />
      <link rel="apple-touch-icon" sizes="167x167" href="/logo167.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/logo180.png" />

      {/* ============================================= */}
      {/* PWA MANIFEST                                   */}
      {/* ============================================= */}
      <link rel="manifest" href="/manifest.json" crossOrigin="anonymous" />

      {/* ============================================= */}
      {/* OPEN GRAPH / SOCIAL MEDIA (Facebook, LinkedIn)*/}
      {/* ============================================= */}
      <meta
        property="og:title"
        content={`${title} | POWERKING TIPS - Football Predictions & Live Scores`}
      />
      <meta
        property="og:description"
        content="Get all the latest ✓Fixed VIP Tips ✓Football Predictions, ✓Latest Football Betting Odds and livescores, results & fixtures for all leagues and competitions. Apply for instant M-Pesa loans with fast approval and no paperwork."
      />
      <meta
        property="og:image"
        content={`${window.location.origin}/logo512.png`}
      />
      <meta
        property="og:image:secure_url"
        content={`${window.location.origin}/logo512.png`}
      />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:site_name" content="POWERKING TIPS" />

      {/* ============================================= */}
      {/* TWITTER CARD META TAGS                         */}
      {/* ============================================= */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@powerking_tips" />
      <meta name="twitter:creator" content="@powerking_tips" />
      <meta
        name="twitter:title"
        content={`${title} | POWERKING TIPS - Football Predictions`}
      />
      <meta
        name="twitter:description"
        content="Get all the latest ✓Fixed VIP Tips ✓Football Predictions, ✓Latest Football Betting Odds and livescores, results & fixtures for all leagues and competitions. Need cash fast? Apply for instant online loans to M-Pesa."
      />
      <meta
        name="twitter:image"
        content={`${window.location.origin}/logo512.png`}
      />
      <meta name="twitter:image:alt" content="POWERKING TIPS Logo" />

      {/* ============================================= */}
      {/* ALTERNATE LANGUAGE VERSIONS                    */}
      {/* ============================================= */}
      <link rel="alternate" href="https://powerking-tips.onrender.com" hreflang="en" />
      <link rel="alternate" href="https://powerking-tips.onrender.com/sw" hreflang="sw" />

      {/* ============================================= */}
      {/* PRELOAD & PRECONNECT (Performance optimization)*/}
      {/* ============================================= */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
      <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
      <link rel="preconnect" href="https://kit.fontawesome.com" />
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com" />

      {/* ============================================= */}
      {/* GOOGLE FONTS (Comprehensive collection)       */}
      {/* ============================================= */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
        rel="stylesheet"
      />

      {/* ============================================= */}
      {/* ADDITIONAL META TAGS (Various purposes)        */}
      {/* ============================================= */}
      {/* Google AdSense */}
      <meta name="google-adsense-account" content="ca-pub-9576945242972545" />
      <meta
        name="google-site-verification"
        content="-D3IYDAgJdZnqRkgCB7jGGaeKfmB2S7lI5RWLIYqB0c"
      />

      {/* Other verification */}
      <meta name="msvalidate.01" content="YOUR_BING_VERIFICATION_CODE" />
      <meta
        name="yandex-verification"
        content="YOUR_YANDEX_VERIFICATION_CODE"
      />

      {/* Theme name (for template detection) */}
      <meta name="theme-name" content="powerking-tips" />

      {/* ============================================= */}
      {/* IOS SPECIFIC META TAGS                         */}
      {/* ============================================= */}
      <meta name="format-detection" content="telephone=no" />
      <meta
        name="apple-mobile-web-app-status-bar-style"
        content="black-translucent"
      />

      {/* ============================================= */}
      {/* ANDROID SPECIFIC META TAGS                     */}
      {/* ============================================= */}
      <meta name="msapplication-TileColor" content="#00BFFF" />
      <meta name="msapplication-TileImage" content="/logo144.png" />
      <meta name="msapplication-config" content="/browserconfig.xml" />

      {/* ============================================= */}
      {/* CSS FRAMEWORKS & LIBRARIES (Preload)           */}
      {/* ============================================= */}
      <link
        rel="preload"
        as="style"
        href="https://unpkg.com/tailwindcss@0.7.4/dist/tailwind.min.css"
      />
      <link
        rel="preload"
        as="style"
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
      />
      <link
        rel="preload"
        as="style"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
      />
      <link
        rel="preload"
        as="style"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
      />

      {/* ============================================= */}
      {/* FLASH VIP TIPS SPECIFIC META TAGS              */}
      {/* ============================================= */}
      <meta
        name="flash-vip-tips"
        content="Fixed VIP Football Tips, Insights and News"
      />
      <meta name="football-tips-verification" content="premium-vip-access" />

      {/* ============================================= */}
      {/* GOAL KINGS & BETTING SITES SPECIFIC META TAGS  */}
      {/* ============================================= */}
      <meta
        name="betting-platforms"
        content="Betika, Sportpesa, 365Bet, Odibets"
      />
      <meta
        name="league-coverage"
        content="Premier League, Championship, La Liga, Bundesliga, Serie A"
      />
      <meta
        name="match-coverage"
        content="Live scores, fixtures, results, standings, statistics"
      />

      {/* ============================================= */}
      {/* EMAILJS & FIREBASE VERIFICATION META           */}
      {/* ============================================= */}
      <meta name="email-service" content="contact form email integration" />
      <meta name="firebase-project" content="powerking-tips-pwa" />
    </Helmet>
  );
}
