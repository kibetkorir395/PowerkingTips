import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from 'react';
import { tipsService } from '../../services/firestore.service';
import { useAuth } from '../../context/AuthContext';
import { usePagination } from '../../hooks/usePagination';
import Loader from '../../components/Loader/Loader';

const PostDetail = lazy(() =>
  import('../../components/PostDetails/PostDetails')
);

export default function Tips() {
  const { isPremium, isAdmin, currentUser, userData } = useAuth();
  const [tips, setTips] = useState([]);
  const [selectedTip, setSelectedTip] = useState(null);
  const [category, setCategory] = useState('premium');
  const [days, setDays] = useState([]);
  const [currentDate, setCurrentDate] = useState('');
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const { loading, setLoading, lastElementRef } = usePagination(25);

  // User has premium access if they are premium OR admin
  const hasPremiumAccess = useMemo(
    () => isPremium || isAdmin,
    [isPremium, isAdmin]
  );

  const getCurrentDateInUserTimezone = useCallback(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }, []);

  const formatDateForFirestore = useCallback((date) => {
    return new Date(date).toLocaleDateString('en-US');
  }, []);

  const fetchTips = useCallback(async () => {
    setLoading(true);
    const date = currentDate || getCurrentDateInUserTimezone();
    const formattedDate = formatDateForFirestore(date);
    const isPremiumFilter = category === 'premium';

    const data = await tipsService.getTipsByDate(
      formattedDate,
      50,
      isPremiumFilter
    );
    setTips(data);
    setLastUpdate(Date.now());
    setLoading(false);
  }, [
    currentDate,
    category,
    formatDateForFirestore,
    getCurrentDateInUserTimezone,
    setLoading,
  ]);

  // Auto-refresh tips every 5 minutes
  useEffect(() => {
    fetchTips();
    const interval = setInterval(() => {
      fetchTips();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchTips]);

  useEffect(() => {
    const dates = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    setDays(dates);
    setCurrentDate(dates[dates.length - 1]);
  }, []);

  const filteredTips = useMemo(
    () =>
      tips.filter((tip) => (category === 'free' ? !tip.premium : tip.premium)),
    [tips, category]
  );

  const isTipLocked = useCallback(
    (tip) => {
      // Admin always has access
      if (isAdmin) return false;

      // Premium users can access premium tips
      if (tip.premium && hasPremiumAccess) return false;

      // Free users can access free tips
      if (!tip.premium) return false;

      // Lock premium tips for non-premium users
      const today = getCurrentDateInUserTimezone();
      const tipDate = new Date(tip.date).toLocaleDateString('en-US');
      const isTodayTip = tipDate === today;
      const isPending = tip.status !== 'finished';

      // Lock today's pending premium tips for non-premium users
      return tip.premium && !hasPremiumAccess && isTodayTip && isPending;
    },
    [hasPremiumAccess, isAdmin, getCurrentDateInUserTimezone]
  );

  const handleTipClick = useCallback(
    (tip) => {
      if (!isTipLocked(tip)) {
        setSelectedTip(tip);
        document.querySelector('.post-detail')?.classList.add('active');
      }
    },
    [isTipLocked]
  );

  return (
    <div className="tips">
      <div className="container">
        <div className="tips-header">
          <h2>Today's Predictions</h2>
          {!hasPremiumAccess && (
            <div className="upgrade-banner">
              <span>⭐</span>
              <span>Upgrade to VIP for premium tips!</span>
              <a href="/pay" className="upgrade-link">
                Upgrade Now →
              </a>
            </div>
          )}
          <div className="category-selector">
            {/*<button
              className={`category-btn ${category === 'free' ? 'active' : ''}`}
              onClick={() => setCategory('free')}
            >
              Free Tips
            </button>*/}
            <button
              className={`category-btn ${
                category === 'premium' ? 'active' : ''
              }`}
              onClick={() => setCategory('premium')}
            >
              Premium Tips {hasPremiumAccess ? '🔓' : '🔒'}
            </button>
          </div>
        </div>

        <div className="date-filter">
          {days.map((day) => (
            <button
              key={day}
              className={`date-btn ${currentDate === day ? 'active' : ''}`}
              onClick={() => setCurrentDate(day)}
            >
              {new Date(day).toLocaleDateString('en-US', { weekday: 'short' })}
            </button>
          ))}
        </div>

        {loading && <Loader />}

        {!loading && (
          <div className="tips-table-container">
            <table className="tips-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Home</th>
                  <th>Away</th>
                  <th>Tip</th>
                  <th>Odds</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {filteredTips.map((tip, index) => {
                  const locked = isTipLocked(tip);
                  const isLast = index === filteredTips.length - 1;

                  return (
                    <tr
                      key={tip.id}
                      onClick={() => handleTipClick(tip)}
                      className={`${locked ? 'locked' : ''} ${
                        tip.premium ? 'premium-tip' : ''
                      }`}
                      ref={isLast ? lastElementRef : null}
                    >
                      <td>{tip.time}</td>
                      <td className={locked ? 'blurred' : ''}>
                        {locked ? '🔒 Join VIP' : tip.home}
                      </td>
                      <td className={locked ? 'blurred' : ''}>
                        {locked ? 'To View' : tip.away}
                      </td>
                      <td className={locked ? 'blurred' : ''}>
                        {locked ? 'VIP Only' : tip.pick}
                      </td>
                      <td>{tip.odd}</td>
                      <td className={`result ${tip.won}`}>
                        {tip.won === 'won'
                          ? '✓ Won'
                          : tip.won === 'lost'
                          ? '✗ Lost'
                          : '⏳ Pending'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredTips.length === 0 && !loading && (
          <div className="no-tips">
            <p>No tips available for this date.</p>
          </div>
        )}
      </div>

      {selectedTip && (
        <Suspense fallback={<Loader />}>
          <PostDetail
            data={selectedTip}
            userData={userData}
            hasPremiumAccess={hasPremiumAccess}
            onClose={() => setSelectedTip(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
