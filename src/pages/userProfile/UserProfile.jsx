import { useEffect, useState } from 'react';
import './UserProfile.scss';
import { NavLink, useLocation } from 'react-router-dom';
import { CalendarToday, CreditCard, Receipt, Verified, Person, Email, Phone } from '@mui/icons-material';

export default function UserProfile({ data }) {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (location.state) {
      setUser(location.state)
    } else {
      setUser(data)
    }
  }, [location, data]);

  const transactions = [
    {
      id: 1,
      name: 'American Eagle',
      category: 'Clothes & Fashion',
      amount: '-39.99 USD',
      time: '4:27 PM',
      card: '•••• 6890',
      refId: '3125-568911',
      type: 'debit',
      iconStyle: { backgroundColor: '#f2dcbb' },
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
          <path
            d="M192,120h27.05573a8,8,0,0,0,7.15542-4.42229l18.40439-36.80878a8,8,0,0,0-3.18631-10.52366L192,40M64,120H36.94427a8,8,0,0,1-7.15542-4.42229L11.38446,78.76893a8,8,0,0,1,3.18631-10.52366L64,40M160,40a32,32,0,0,1-64,0H64V208a8,8,0,0,0,8,8H184a8,8,0,0,0,8-8V40Z"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="16"
          />
        </svg>
      ),
    },
    {
      id: 2,
      name: 'From Håvard Brynjulfsen',
      category: 'Gift',
      amount: '+50.00 USD',
      time: '8:14 AM',
      refId: '3125-568912',
      type: 'credit',
      iconStyle: { backgroundColor: '#e8f5e9' },
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
          <rect x="32" y="80" width="192" height="48" rx="8" />
          <path d="M208,128v72a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V128" />
          <line x1="128" y1="80" x2="128" y2="208" />
        </svg>
      ),
    },
    {
      id: 3,
      name: 'VIP Subscription',
      category: 'Premium Plan',
      amount: '-850.00 KES',
      time: '10:30 AM',
      card: 'M-Pesa •••• 2547',
      refId: 'VIP-2024-001',
      type: 'debit',
      iconStyle: { backgroundColor: '#fff3e0' },
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
          <path d="M128,24A104,104,0,1,0,232,128,104.2,104.2,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Z" />
          <polygon points="164 100 148 100 148 148 108 148 108 100 92 100 92 164 164 164 164 100" />
        </svg>
      ),
    },
  ];

  return (
    <div className="user-profile">
      {user && (
        <>
          <div className="user-header">
            <div className="uh-left">
              <div className="uh-image">
                <img src="https://i.imgur.com/Qv1WDJq.jpg" alt="Profile" />
                <div className="gradient"></div>
                {user.isPremium && <Verified className="premium-badge" />}
              </div>
              <div className="user-info">
                <h2 className="user-name">{user.username || user.email?.split('@')[0]}</h2>
                <p className="user-email">{user.email}</p>
                {user.isPremium && <span className="vip-tag">VIP Member</span>}
              </div>
            </div>
            <div className="user-links">
              <div className="user-stats">
                <div className="stat">
                  <span className="stat-value">{transactions.length}</span>
                  <span className="stat-label">Transactions</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{user.isPremium ? 'Active' : 'Inactive'}</span>
                  <span className="stat-label">Status</span>
                </div>
              </div>
              <div className="user-actions">
                {!user.isPremium && (
                  <NavLink to="/pay" className="btn vip-btn">
                    GET VIP
                  </NavLink>
                )}
                <NavLink to="/users-edit" className="btn edit-btn" state={user}>
                  Edit Profile
                </NavLink>
              </div>
            </div>
          </div>

          <section className="transactions-section">
            <h2 className="section-title">Transaction History</h2>
            <div className="transactions-list">
              {transactions.map((transaction) => (
                <details key={transaction.id} className="transaction-item">
                  <summary>
                    <div className="transaction-summary">
                      <span className="transaction-icon" style={transaction.iconStyle}>
                        {transaction.icon}
                      </span>
                      <div className="transaction-info">
                        <h3 className="transaction-name">{transaction.name}</h3>
                        <small className="transaction-category">{transaction.category}</small>
                      </div>
                      <span className={`transaction-amount ${transaction.type}`}>
                        {transaction.amount}
                      </span>
                    </div>
                  </summary>
                  <div className="transaction-details">
                    <dl>
                      <div>
                        <dt>
                          <CalendarToday className="detail-icon" />
                          Time
                        </dt>
                        <dd>{transaction.time}</dd>
                      </div>
                      {transaction.card && (
                        <div>
                          <dt>
                            <CreditCard className="detail-icon" />
                            Payment Method
                          </dt>
                          <dd>{transaction.card}</dd>
                        </div>
                      )}
                      <div>
                        <dt>
                          <Receipt className="detail-icon" />
                          Reference ID
                        </dt>
                        <dd>{transaction.refId}</dd>
                      </div>
                    </dl>
                  </div>
                </details>
              ))}
            </div>
          </section>
        </>
      )}
      <div className="explore">
        <NavLink to="/" className="btn explore-btn">EXPLORE MORE</NavLink>
      </div>
    </div>
  );
}