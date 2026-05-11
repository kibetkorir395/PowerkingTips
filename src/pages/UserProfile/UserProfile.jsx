import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  userService,
  transactionService,
} from '../../services/firestore.service';
import { useAuth } from '../../context/AuthContext';
import { usePagination } from '../../hooks/usePagination';
import Loader from '../../components/Loader/Loader';
import './UserProfile.scss';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const {
    page,
    pageSize,
    hasMore,
    setHasMore,
    loading: transLoading,
    setLoading: setTransLoading,
    lastElementRef,
  } = usePagination(10);

  const isOwnProfile = currentUser?.email === (id || currentUser?.email);
  const canEdit = isAdmin || isOwnProfile;

  const fetchUser = useCallback(async () => {
    const email = id || currentUser?.email;
    if (!email) return;

    const user = await userService.getUser(email);
    setProfileUser(user);
  }, [id, currentUser]);

  const fetchTransactions = useCallback(async () => {
    if (!profileUser?.email) return;

    setTransLoading(true);
    const result = await transactionService.getUserTransactions(
      profileUser.email,
      page,
      pageSize
    );
    if (page === 1) {
      setTransactions(result.transactions);
    } else {
      setTransactions((prev) => [...prev, ...result.transactions]);
    }
    setHasMore(result.hasMore);
    setTransLoading(false);
  }, [profileUser, page, pageSize, setHasMore, setTransLoading]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (profileUser) {
      fetchTransactions();
      setLoading(false);
    }
  }, [profileUser, fetchTransactions]);

  const handleEditClick = () => {
    //navigate(`/profile/${profileUser.username}/edit`, { state: profileUser });
    if (isAdmin) {
      navigate(`/users/edit/${encodeURIComponent(profileUser.email)}`, { state: profileUser });
    } else {
      navigate('/profile/edit', { state: profileUser });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    let day = date.getDate();
    const suffix = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    return `${day}${suffix(day)} ${date.toLocaleString('en-GB', {
      month: 'long',
      year: 'numeric',
    })}`;
  };

  if (loading) return <Loader />;
  if (!profileUser) return <div className="error">User not found</div>;

  return (
    <div className="user-profile">
      <div className="user-header">
        <div className="uh-left">
          <div className="uh-image">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                'Subrun Abhuyudaye'//profileUser.username || profileUser.email
              )}&background=00BFFF&color=fff`}
              alt="Profile"
            />
            <div className="gradient"></div>
            {profileUser.isPremium && (
              <span className="premium-badge">⭐</span>
            )}
          </div>
          <div className="user-info">
            <h2 className="user-name">
              {profileUser.username || profileUser.email.split('@')[0]}
            </h2>
            <p className="user-email">{profileUser.email}</p>
            {profileUser.isPremium && (
              <span className="vip-tag">VIP Member</span>
            )}
          </div>
        </div>
        
        <div className="user-links">
          <div className="user-stats">
            <div className="stat">
              <span className="stat-value">{transactions.length}</span>
              <span className="stat-label">Transactions</span>
            </div>
            <div className="stat">
              <span className="stat-value">
                {profileUser.isPremium ? '𝓟𝓻𝓸 🏆' : '𝓑𝓪𝓼𝓲𝓬 🥉'}
              </span>
              <span className="stat-label">Status</span>
            </div>
            {profileUser.subscription && (
              <div className="stat">
                <span className="stat-value">{profileUser.subscription}</span>
                <span className="stat-label">Plan</span>
              </div>
            )}
          </div>
          
          <div className="user-actions">
            {!profileUser.isPremium && isOwnProfile && (
              <button className="btn vip-btn" onClick={() => navigate('/pay')}>
                GET VIP
              </button>
            )}
            {canEdit && (
              <button className="btn edit-btn" onClick={handleEditClick}>
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="transactions-section">
        <h2 className="section-title">Transaction History</h2>
        {transactions.length === 0 && !transLoading ? (
          <div className="no-transactions">
            <div className="empty-icon">💰</div>
            <h3>No Transactions Yet</h3>
            <p>Your transaction history will appear here once you make a purchase.</p>
            <p>(This feature is not available yet!)</p>
            {isOwnProfile && (
              <button className="btn" onClick={() => navigate('/pay')}>
                Upgrade to VIP
              </button>
            )}
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <details key={transaction.id} className="transaction-item">
                <summary>
                  <div className="transaction-summary">
                    <span className="transaction-icon" style={{ backgroundColor: transaction.type === 'credit' ? '#e8f5e9' : '#fff3e0' }}>
                      {transaction.type === 'credit' ? '💰' : '💸'}
                    </span>
                    <div className="transaction-info">
                      <h3 className="transaction-name">{transaction.description || 'VIP Subscription'}</h3>
                      <small className="transaction-category">
                        {transaction.category || 'Subscription'}
                      </small>
                    </div>
                    <span className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'credit' ? '+' : '-'}{' '}
                      {transaction.currency || 'KES'} {transaction.amount}
                    </span>
                  </div>
                </summary>
                <div className="transaction-details">
                  <dl>
                    <div>
                      <dt>📅 Date & Time</dt>
                      <dd>{formatDate(transaction.createdAt?.toDate?.() || transaction.createdAt)}</dd>
                    </div>
                    {transaction.paymentMethod && (
                      <div>
                        <dt>💳 Payment Method</dt>
                        <dd>{transaction.paymentMethod}</dd>
                      </div>
                    )}
                    <div>
                      <dt>🆔 Reference ID</dt>
                      <dd>{transaction.id || transaction.reference || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>
              </details>
            ))}
            {transLoading && (
              <div className="loading-more">
                <Loader />
              </div>
            )}
            {hasMore && !transLoading && (
              <div ref={lastElementRef} className="load-more-trigger" />
            )}
          </div>
        )}
      </div>
      
      <div className="explore">
        <button className="explore-btn" onClick={() => navigate('/')}>
          EXPLORE MORE
        </button>
      </div>
    </div>
  );
}