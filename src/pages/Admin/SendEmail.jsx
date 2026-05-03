import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { userService } from '../../services/firestore.service';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import emailjs, { EmailJSResponseStatus } from '@emailjs/browser';
import Swal from 'sweetalert2';
import Loader from '../../components/Loader/Loader';
import AppHelmet from '../../components/AppHelmet';
import './SendEmail.scss';

// EmailJS configuration
const EMAILJS_SERVICE_ID = 'service_sqf7j84';
const EMAILJS_TEMPLATE_ID = 'template_2i8jyq2';
const EMAILJS_PUBLIC_KEY = 'FSTno5mOQr5Fbfp4J';

// Initialize EmailJS once outside component
emailjs.init({
  publicKey: EMAILJS_PUBLIC_KEY,
});

export default function SendEmail() {
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
  
  const debouncedSearch = useDebounce(searchQuery, 500);
  const isInitialLoadDone = useRef(false);
  const currentFilter = useRef(filter);
  const currentSearch = useRef(debouncedSearch);

  // SINGLE fetch function that handles all scenarios
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
        setSelectedUsers([]); // Clear selections on reset
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

  // Initial load - runs only once
  useEffect(() => {
    if (isAdmin && !isInitialLoadDone.current) {
      isInitialLoadDone.current = true;
      loadUsers(true);
    }
  }, [isAdmin, loadUsers]);

  // Handle filter or search changes - reset and reload
  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    
    // Only reload if filter or search actually changed
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

  // Memoize filtered users for display
  const displayedUsers = useMemo(() => {
    if (!debouncedSearch) return users;
    const search = debouncedSearch.toLowerCase();
    return users.filter(
      (user) =>
        user.email?.toLowerCase().includes(search) ||
        user.username?.toLowerCase().includes(search) ||
        user.subscription?.toLowerCase().includes(search)
    );
  }, [users, debouncedSearch]);

  // Memoize allSelected calculation
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

  const sendEmailToUser = useCallback(async (user) => {
    const templateParams = {
      username: user.username || user.email?.split('@')[0] || 'Valued Member',
      email: user.email,
      dashboardLink: 'https://powerking-tips.onrender.com/',
    };

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );
      return { success: true, email: user.email };
    } catch (err) {
      if (err instanceof EmailJSResponseStatus) {
        return { success: false, email: user.email, error: err.text };
      }
      return { success: false, email: user.email, error: err.message };
    }
  }, []);

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

    const confirm = await Swal.fire({
      title: 'Send Emails',
      text: `Are you sure you want to send emails to ${selectedUsers.length} user(s)?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00ae58',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Send!',
      cancelButtonText: 'Cancel',
    });

    if (!confirm.isConfirmed) return;

    setSending(true);
    const usersToSend = displayedUsers.filter(user => selectedUsers.includes(user.email));
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < usersToSend.length; i++) {
      setProgress({ current: i + 1, total: usersToSend.length });
      const result = await sendEmailToUser(usersToSend[i]);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setSending(false);

    Swal.fire({
      title: 'Email Campaign Complete',
      html: `
        <div style="text-align: center;">
          <p>✅ Successfully sent: ${successCount}</p>
          <p>❌ Failed: ${failCount}</p>
          <p>📧 Total: ${usersToSend.length}</p>
        </div>
      `,
      icon: successCount > 0 ? 'success' : 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#00ae58',
    });
  }, [selectedUsers, displayedUsers, sendEmailToUser]);

  if (!isAdmin) return <div className="error">Access denied</div>;

  return (
    <div className="send-email-page">
      <AppHelmet title={"Send Email"} location={"/send-email"} />
      
      <div className="page-header">
        <h1>📧 Bulk Email Campaign</h1>
        <p>Send new feature notifications to selected users</p>
      </div>

      <div className="email-content">
        {/* Email Preview Section */}
        <div className="email-preview">
          <h3>Email Template: New Features Available! 🚀</h3>
          <div className="preview-card">
            <div className="preview-header">
              <strong>Template ID:</strong> {EMAILJS_TEMPLATE_ID}
            </div>
            <div className="preview-body">
              <p><strong>Note:</strong> The actual email content is managed in your EmailJS dashboard.</p>
              <p>Variables passed to template:</p>
              <ul>
                <li><code>{'{{username}}'}</code> - User's name</li>
                <li><code>{'{{email}}'}</code> - User's email address</li>
                <li><code>{'{{dashboardLink}}'}</code> - Dashboard URL</li>
              </ul>
              <hr />
              <p>To modify the email content, visit your <a href="https://dashboard.emailjs.com/" target="_blank" rel="noopener noreferrer">EmailJS Dashboard</a> and edit template <strong>{EMAILJS_TEMPLATE_ID}</strong>.</p>
            </div>
          </div>
        </div>

        {/* User Selection Section */}
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
                    {user.subscription && user.isPremium && (
                      <span className="plan-badge">{user.subscription}</span>
                    )}
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
                Sending emails... ({progress.current} / {progress.total})
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
              disabled={sending || selectedUsers.length === 0}
            >
              {sending ? 'Sending...' : `📧 Send to ${selectedUsers.length} User(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}