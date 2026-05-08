// SendTipsEmail.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { userService, tipsService } from '../../services/firestore.service';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import emailjs from '@emailjs/browser';
import Swal from 'sweetalert2';
import Loader from '../../components/Loader/Loader';
import AppHelmet from '../../components/AppHelmet';
import './SendEmail.scss';

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'service_kzq0n7r'; 
const EMAILJS_TIPS_TEMPLATE_ID = 'template_j65mzme'; // Create this template in EmailJS 
const EMAILJS_PUBLIC_KEY = 'Epj5xA-zVHFgzAIZ8';

// Initialize EmailJS
emailjs.init({
  publicKey: EMAILJS_PUBLIC_KEY,
});

// Pro tips collection
const PRO_TIPS = [
  "Compare odds across multiple bookmakers before placing your bet",
  "Never chase losses - stick to your betting strategy",
  "Focus on leagues you know well rather than betting randomly",
  "Keep a record of your bets to track your performance",
  "Bet with your head, not your heart - avoid bias towards favorite teams",
  "Consider bankroll management - never bet more than 5% on a single tip",
  "Look for value bets where odds are higher than actual probability",
  "Follow team news and injuries before placing bets"
];

export default function SendTipsEmail() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);
  const [tipsData, setTipsData] = useState(null);
  const [loadingTips, setLoadingTips] = useState(false);
  const [emailDate, setEmailDate] = useState(new Date().toISOString().split('T')[0]);
  
  const debouncedSearch = useDebounce(searchQuery, 500);
  const isInitialLoadDone = useRef(false);
  const currentFilter = useRef(filter);
  const currentSearch = useRef(debouncedSearch);

  // Fetch today's tips data for email preview
  const fetchTodaysTips = useCallback(async () => {
    setLoadingTips(true);
    try {
      const formattedDate = new Date(emailDate).toLocaleDateString('en-US');
      
      // Fetch both free and premium tips
      const freeTips = await tipsService.getTipsByDate(formattedDate, 50, false);
      const premiumTips = await tipsService.getTipsByDate(formattedDate, 50, true);
      
      const allTips = [...freeTips, ...premiumTips];
      
      // Calculate stats
      const avgOdds = allTips.length > 0 
        ? (allTips.reduce((sum, tip) => sum + (parseFloat(tip.odd) || 0), 0) / allTips.length).toFixed(1)
        : '2.5';
      
      const uniqueMatches = new Set(allTips.map(tip => `${tip.home}_${tip.away}`)).size;
      
      // Get unique leagues
      const leaguesMap = new Map();
      allTips.forEach(tip => {
        const league = tip.league || 'Major League';
        if (!leaguesMap.has(league)) {
          leaguesMap.set(league, { matches: 0, predictions: 0 });
        }
        leaguesMap.get(league).matches++;
        leaguesMap.get(league).predictions++;
      });
      
      const topLeagues = Array.from(leaguesMap.entries())
        .map(([name, data]) => ({
          name,
          matchCount: data.matches,
          predictionCount: data.predictions
        }))
        .slice(0, 3);
      
      setTipsData({
        totalTips: allTips.length,
        vipTipsCount: premiumTips.length,
        freeTipsCount: freeTips.length,
        todayMatches: uniqueMatches,
        avgOdds: avgOdds,
        confidenceRate: 85,
        hasVipTips: premiumTips.length > 0,
        topLeagues: topLeagues,
        proTip: PRO_TIPS[Math.floor(Math.random() * PRO_TIPS.length)],
        freeTips: freeTips.slice(0, 5),
        premiumTips: premiumTips.slice(0, 5)
      });
    } catch (error) {
      console.error("Error fetching tips:", error);
      setTipsData({
        totalTips: 0,
        vipTipsCount: 0,
        freeTipsCount: 0,
        todayMatches: 0,
        avgOdds: '0',
        confidenceRate: 0,
        hasVipTips: false,
        topLeagues: [],
        proTip: PRO_TIPS[0],
        freeTips: [],
        premiumTips: []
      });
    } finally {
      setLoadingTips(false);
    }
  }, [emailDate]);

  // Load tips data when component mounts or date changes
  useEffect(() => {
    if (isAdmin) {
      fetchTodaysTips();
    }
  }, [isAdmin, fetchTodaysTips, emailDate]);

  // Load users function
  const loadUsers = useCallback(async (reset = false) => {
    if (!isAdmin) return;
    
    setLoading(true);
    
    const filters = {};
    if (filter === 'premium') filters.isPremium = true;
    if (filter === 'free') filters.isPremium = false;
    
    try {
      const result = await userService.getAllUsers(
        1, 
        50, 
        filters, 
        reset ? null : lastDoc, 
        debouncedSearch
      );
      
      if (reset) {
        setUsers(result.users);
        setSelectedUsers([]);
      } else {
        setUsers(prev => [...prev, ...result.users]);
      }
      
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, filter, debouncedSearch, lastDoc]);

  // Initial load
  useEffect(() => {
    if (isAdmin && !isInitialLoadDone.current) {
      isInitialLoadDone.current = true;
      loadUsers(true);
    }
  }, [isAdmin, loadUsers]);

  // Handle filter or search changes
  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    
    if (currentFilter.current !== filter || currentSearch.current !== debouncedSearch) {
      currentFilter.current = filter;
      currentSearch.current = debouncedSearch;
      setLastDoc(null);
      loadUsers(true);
    }
  }, [filter, debouncedSearch, loadUsers]);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadUsers(false);
    }
  };

  const displayedUsers = useMemo(() => {
    if (!debouncedSearch) return users;
    const search = debouncedSearch.toLowerCase();
    return users.filter(
      (user) =>
        user.email?.toLowerCase().includes(search) ||
        user.username?.toLowerCase().includes(search)
    );
  }, [users, debouncedSearch]);

  const allSelected = useMemo(() => {
    if (displayedUsers.length === 0) return false;
    return displayedUsers.every(user => selectedUsers.includes(user.email));
  }, [displayedUsers, selectedUsers]);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(displayedUsers.map(user => user.email));
    }
  }, [allSelected, displayedUsers]);

  const handleSelectUser = useCallback((email) => {
    setSelectedUsers(prev => {
      if (prev.includes(email)) {
        return prev.filter(e => e !== email);
      } else {
        return [...prev, email];
      }
    });
  }, []);

  // Format tips as JSON string for EmailJS - clean and simple
  const formatTipsJSON = (tips) => {
    if (!tips || tips.length === 0) return '';
    return JSON.stringify(tips.map(tip => ({
      h: tip.home,
      a: tip.away,
      l: tip.league || 'Major League',
      t: tip.time,
      p: tip.pick,
      o: tip.odd
    })));
  };

  const formatTopLeaguesJSON = (leagues) => {
    if (!leagues || leagues.length === 0) return '';
    return JSON.stringify(leagues.map(league => ({
      n: league.name,
      m: league.matchCount,
      p: league.predictionCount
    })));
  };

  const sendTipsEmailToUser = useCallback(async (user) => {
    if (!tipsData) {
      return { success: false, email: user.email, error: 'Tips data not loaded' };
    }
    
    const isUserPremium = user.isPremium === true;
    const formattedDate = new Date(emailDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Simple template parameters - no complex formatting
    const templateParams = {
      username: user.username || user.email?.split('@')[0] || 'Valued Member',
      email: user.email,
      date: formattedDate,
      total_tips: tipsData.totalTips.toString(),
      free_tips_count: tipsData.freeTipsCount.toString(),
      vip_tips_count: tipsData.vipTipsCount.toString(),
      today_matches: tipsData.todayMatches.toString(),
      avg_odds: tipsData.avgOdds,
      confidence_rate: tipsData.confidenceRate.toString(),
      pro_tip: tipsData.proTip,
      is_premium: isUserPremium ? 'true' : 'false',
      has_vip_tips: tipsData.hasVipTips ? 'true' : 'false',
      free_tips_json: formatTipsJSON(tipsData.freeTips),
      premium_tips_json: formatTipsJSON(tipsData.premiumTips),
      top_leagues_json: formatTopLeaguesJSON(tipsData.topLeagues),
      tips_link: 'https://powerking-tips.onrender.com/tips',
      upgrade_link: 'https://powerking-tips.onrender.com/pay',
      unsubscribe_link: `https://powerking-tips.onrender.com/unsubscribe/${user.email}`
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TIPS_TEMPLATE_ID,
        templateParams
      );
      return { success: true, email: user.email };
    } catch (err) {
      console.error('EmailJS error:', err);
      return { success: false, email: user.email, error: err.text || err.message };
    }
  }, [tipsData, emailDate]);

  const handleSendEmails = useCallback(async () => {
    if (selectedUsers.length === 0) {
      Swal.fire({
        title: 'No Users Selected',
        text: 'Please select at least one user to send emails.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    if (!tipsData || tipsData.totalTips === 0) {
      Swal.fire({
        title: 'No Tips Available',
        text: `No tips found for ${new Date(emailDate).toLocaleDateString()}. Please add tips first or select another date.`,
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    const premiumCount = selectedUsers.filter(email => {
      const user = users.find(u => u.email === email);
      return user?.isPremium === true;
    }).length;
    
    const freeCount = selectedUsers.length - premiumCount;

    const confirm = await Swal.fire({
      title: 'Send Daily Tips Email',
      html: `
        <div style="text-align: center;">
          <p>Are you sure you want to send <strong>"Today's Tips Are Live"</strong> email to:</p>
          <p style="font-size: 24px; font-weight: bold; color: #00ae58;">${selectedUsers.length} user(s)</p>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 8px; margin: 10px 0;">
            <p>⭐ Premium users: <strong>${premiumCount}</strong> (will see full tips)</p>
            <p>🔓 Free users: <strong>${freeCount}</strong> (will see free tips + upgrade prompt)</p>
          </div>
          <p style="font-size: 12px; color: #666;">
            📧 Email contains:<br>
            • ${tipsData.freeTipsCount} free predictions<br>
            • ${tipsData.vipTipsCount} VIP tips (hidden from free users)<br>
            • Stats and pro tips
          </p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00ae58',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Send Now!',
      cancelButtonText: 'Cancel',
    });

    if (!confirm.isConfirmed) return;

    setSending(true);
    const usersToSend = displayedUsers.filter(user => selectedUsers.includes(user.email));
    let successCount = 0;
    let failCount = 0;
    const failedUsers = [];

    for (let i = 0; i < usersToSend.length; i++) {
      setProgress({ current: i + 1, total: usersToSend.length });
      const result = await sendTipsEmailToUser(usersToSend[i]);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        failedUsers.push(usersToSend[i].email);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setSending(false);

    let failedMessage = '';
    if (failCount > 0) {
      failedMessage = `<p style="color: #d33; margin-top: 10px;">❌ Failed: ${failedUsers.slice(0, 3).join(', ')}${failCount > 3 ? ` + ${failCount - 3} more` : ''}</p>`;
    }

    Swal.fire({
      title: 'Email Campaign Complete',
      html: `
        <div style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">📧</div>
          <p>✅ Successfully sent: <strong style="color: #00ae58;">${successCount}</strong></p>
          <p>❌ Failed: <strong style="color: #d33;">${failCount}</strong></p>
          <p>📊 Total: <strong>${usersToSend.length}</strong></p>
          ${failedMessage}
          <hr style="margin: 15px 0;">
          <p style="font-size: 12px; color: #666;">
            Email type: "Today's Tips Are Live"<br>
            Date: ${new Date(emailDate).toLocaleDateString()}
          </p>
        </div>
      `,
      icon: successCount > 0 ? 'success' : 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#00ae58',
    });
  }, [selectedUsers, displayedUsers, sendTipsEmailToUser, tipsData, emailDate, users]);

  if (!isAdmin) return <div className="error">Access denied</div>;

  return (
    <div className="send-email-page">
      <AppHelmet title={"Send Tips Email"} location={"/send-tips-email"} />
      
      <div className="page-header">
        <h1>⚽ Send Daily Tips Email</h1>
        <p>Send "Today's Tips Are Live" notification to selected users</p>
      </div>

      <div className="email-content">
        <div className="email-preview">
          <h3>📧 Email Template: Today's Tips Are Live! 🚀</h3>
          
          <div className="date-selector" style={{ marginBottom: '15px' }}>
            <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Tips Date:</label>
            <input
              type="date"
              value={emailDate}
              onChange={(e) => setEmailDate(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                marginRight: '10px'
              }}
            />
            <button 
              onClick={fetchTodaysTips}
              style={{
                padding: '8px 16px',
                background: '#00ae58',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Refresh Tips
            </button>
          </div>
          
          {loadingTips ? (
            <Loader />
          ) : tipsData && tipsData.totalTips > 0 ? (
            <div className="preview-card">
              <div className="preview-header">
                <strong>📊 Summary for {new Date(emailDate).toLocaleDateString()}</strong>
              </div>
              <div className="preview-body">
                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', flexWrap: 'wrap' }}>
                  <span>🎯 Total: <strong>{tipsData.totalTips}</strong></span>
                  <span>🔓 Free: <strong>{tipsData.freeTipsCount}</strong></span>
                  <span>⭐ VIP: <strong>{tipsData.vipTipsCount}</strong></span>
                  <span>📈 Avg Odds: <strong>{tipsData.avgOdds}</strong></span>
                </div>
                
                <hr />
                <p><strong>Variables sent to EmailJS template:</strong></p>
                <ul>
                  <li><code>{'{{to_name}}'}</code> - User's name</li>
                  <li><code>{'{{date}}'}</code> - Today's date</li>
                  <li><code>{'{{total_tips}}'}</code> - Total tips count</li>
                  <li><code>{'{{free_tips_json}}'}</code> - JSON string of free tips</li>
                  <li><code>{'{{premium_tips_json}}'}</code> - JSON string of VIP tips</li>
                  <li><code>{'{{is_premium}}'}</code> - true/false for premium users</li>
                  <li><code>{'{{has_vip_tips}}'}</code> - true/false if VIP tips exist</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="preview-card">
              <div className="preview-body">
                <p style={{ color: '#d33' }}>⚠️ No tips available for {new Date(emailDate).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>

        <div className="user-selection">
          <div className="selection-header">
            <div className="filters">
              <input
                type="search"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All Users</option>
                <option value="premium">Premium Users</option>
                <option value="free">Free Users</option>
              </select>
            </div>
            
            <div className="selection-actions">
              <label className="select-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  disabled={displayedUsers.length === 0}
                />
                <span>Select All ({displayedUsers.length})</span>
              </label>
              <span className="selected-count">
                Selected: {selectedUsers.length} users
              </span>
            </div>
          </div>

          {loading && users.length === 0 ? (
            <Loader />
          ) : (
            <>
              <div className="users-list">
                {displayedUsers.map((user) => (
                  <label key={user.email} className="user-item">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.email)}
                      onChange={() => handleSelectUser(user.email)}
                    />
                    <div className="user-avatar">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.username || user.email)}&background=00BFFF&color=fff`} 
                        alt=""
                      />
                    </div>
                    <div className="user-info">
                      <strong>{user.username || user.email?.split('@')[0]}</strong>
                      <small>{user.email}</small>
                    </div>
                    {user.isPremium && <span className="vip-badge">⭐ VIP</span>}
                  </label>
                ))}
              </div>

              {hasMore && !loading && displayedUsers.length > 0 && (
                <div className="load-more">
                  <button className="btn" onClick={loadMore}>
                    Load More Users
                  </button>
                </div>
              )}
            </>
          )}

          {sending && (
            <div className="progress-section">
              <div className="progress-info">
                Sending... ({progress.current} / {progress.total})
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button 
              className="btn send-btn"
              onClick={handleSendEmails}
              disabled={sending || selectedUsers.length === 0 || loadingTips || !tipsData || tipsData.totalTips === 0}
              style={{
                background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                fontSize: '16px',
                padding: '14px 30px'
              }}
            >
              {sending ? 'Sending...' : `⚽ Send to ${selectedUsers.length} User(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}