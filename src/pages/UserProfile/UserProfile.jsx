import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
  const { currentUser, userData: currentUserData, isAdmin } = useAuth();
  const [profileUser, setProfileUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const {
    page,
    pageSize,
    hasMore,
    setHasMore,
    setLoading: setTransLoading,
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

  if (loading) return <Loader />;
  if (!profileUser) return <div className="error">User not found</div>;

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
              profileUser.username || profileUser.email
            )}&background=00BFFF&color=fff`}
            alt="Profile"
          />
          {profileUser.isPremium && (
            <span className="premium-badge">⭐ VIP</span>
          )}
        </div>

        <div className="profile-info">
          <h1>{profileUser.username || profileUser.email.split('@')[0]}</h1>
          <p className="email">{profileUser.email}</p>
          <div className="stats">
            <div className="stat">
              <span className="value">{transactions.length}</span>
              <span className="label">Transactions</span>
            </div>
            <div className="stat">
              <span className="value">
                {profileUser.isPremium ? 'Active' : 'Free'}
              </span>
              <span className="label">Status</span>
            </div>
            {profileUser.subscription && (
              <div className="stat">
                <span className="value">{profileUser.subscription}</span>
                <span className="label">Plan</span>
              </div>
            )}
          </div>
          {canEdit && (
            <button
              className="edit-btn"
              onClick={() => (window.location.href = '/users-edit')}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="transactions-section">
        <h2>Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="no-transactions">No transactions yet.</p>
        ) : (
          <div className="transactions-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-icon">
                  {transaction.type === 'credit' ? '💰' : '💸'}
                </div>
                <div className="transaction-details">
                  <h4>{transaction.description}</h4>
                  <p className="date">
                    {new Date(
                      transaction.createdAt?.toDate()
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'credit' ? '+' : '-'}{' '}
                  {transaction.currency || 'KES'} {transaction.amount}
                </div>
              </div>
            ))}
          </div>
        )}
        {hasMore && <div ref={lastElementRef} className="load-more-trigger" />}
      </div>
    </div>
  );
}
