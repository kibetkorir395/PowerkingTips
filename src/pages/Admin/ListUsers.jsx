import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { userService } from '../../services/firestore.service';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import UserCard from '../../components/UserCard/UserCard';
import Loader from '../../components/Loader/Loader';

export default function ListUsers() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [lastDoc, setLastDoc] = useState(null); // Track last document for pagination
  const debouncedSearch = useDebounce(searchQuery, 300);
  const isInitialMount = useRef(true);

  const fetchUsers = useCallback(async (isNewFilter = false) => {
    if (!isAdmin) return;

    setLoading(true);
    const filters = {};
    if (filter === 'premium') filters.isPremium = true;
    if (filter === 'free') filters.isPremium = false;

    // Use null lastDoc for first page or when filter changes
    const currentLastDoc = isNewFilter ? null : lastDoc;
    
    const result = await userService.getAllUsers(page, 20, filters, currentLastDoc, debouncedSearch);// Pass search term
    
    if (isNewFilter || page === 1) {
      setUsers(result.users);
    } else {
      setUsers((prev) => [...prev, ...result.users]);
    }
    setHasMore(result.hasMore);
    setLastDoc(result.lastDoc);
    setLoading(false);
  }, [page, filter, isAdmin, lastDoc]);

  // Reset pagination when filter changes
  useEffect(() => {
    if (isAdmin && !isInitialMount.current) {
      setPage(1);
      setLastDoc(null);
      fetchUsers(true);
    }
    isInitialMount.current = false;
  }, [filter, isAdmin]);

  // Fetch users when page changes
  useEffect(() => {
    if (isAdmin && page > 1) {
      fetchUsers(false);
    }
  }, [page, isAdmin]);

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      setPage(1);
      setLastDoc(null);
      fetchUsers(true);
    }
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) return users;
    const search = debouncedSearch.toLowerCase();
    return users.filter(
      (user) =>
        user.email?.toLowerCase().includes(search) ||
        user.username?.toLowerCase().includes(search) ||
        user.subscription?.toLowerCase().includes(search)
    );
  }, [users, debouncedSearch]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  if (!isAdmin) return <div className="error">Access denied</div>;

  return (
    <div className="list-users">
      <div className="header">
        <input
          type="search"
          placeholder="Search by username, email or subscription..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Users</option>
          <option value="premium">Premium Users</option>
          <option value="free">Free Users</option>
        </select>
      </div>

      <div className="users-grid">
        {filteredUsers.map((user) => (
          <UserCard key={user.email} user={user} />
        ))}
      </div>

      {loading && <Loader />}

      {hasMore && !loading && filteredUsers.length > 0 && (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <button className="btn" onClick={loadMore}>
            Load More Users
          </button>
        </div>
      )}

      {filteredUsers.length === 0 && !loading && (
        <div className="no-results">No users found matching your criteria</div>
      )}
    </div>
  );
}