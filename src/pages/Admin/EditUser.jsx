import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/firestore.service';
import Loader from '../../components/Loader/Loader';
import AppHelmet from '../../components/AppHelmet';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function EditUser({ setUserData }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const { currentUser, isAdmin, refreshUserData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [subscription, setSubscription] = useState("");
    const [subDate, setSubDate] = useState('');
    const [isPremium, setIsPremium] = useState(false);
    const [originalData, setOriginalData] = useState({});

    function toDateTimeLocal(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    useEffect(() => {
        const userData = location.state;
        if (!userData) {
            Swal.fire({
                title: 'Error',
                text: 'No user data found',
                icon: 'error',
                confirmButtonText: 'Go Back'
            }).then(() => {
                navigate('/users');
            });
            return;
        }
        setUser(userData);
        setEmail(userData.email);
        setUsername(userData.username || '');
        setIsPremium(userData.isPremium || false);
        setSubscription(userData.subscription || "Free");
        setOriginalData({
            username: userData.username || '',
            isPremium: userData.isPremium || false,
            subscription: userData.subscription || "Free",
            subDate: userData.subDate || ''
        });
        if (userData.subDate) {
            setSubDate(toDateTimeLocal(userData.subDate));
        }
    }, [location, navigate]);

    const hasChanges = () => {
        if (!isAdmin) {
            return username !== originalData.username;
        }
        return (
            username !== originalData.username ||
            isPremium !== originalData.isPremium ||
            subscription !== originalData.subscription ||
            subDate !== originalData.subDate
        );
    };

    const showConfirmModal = () => {
        let changesHtml = '<div style="text-align: left;"><p><strong>Changes to be made:</strong></p><hr/>';
        
        if (username !== originalData.username) {
            changesHtml += `<p>📝 Username: ${originalData.username} → ${username}</p>`;
        }
        if (isAdmin) {
            if (isPremium !== originalData.isPremium) {
                changesHtml += `<p>⭐ Premium: ${originalData.isPremium ? 'Yes' : 'No'} → ${isPremium ? 'Yes' : 'No'}</p>`;
            }
            if (subscription !== originalData.subscription) {
                changesHtml += `<p>📅 Subscription: ${originalData.subscription} → ${subscription}</p>`;
            }
            if (subDate !== originalData.subDate) {
                changesHtml += `<p>📆 Subscribed Date: Updated</p>`;
            }
        }
        changesHtml += '</div>';
        
        return Swal.fire({
            title: 'Confirm Changes',
            html: changesHtml,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#00ae58',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Update User!',
            cancelButtonText: 'Cancel'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!hasChanges()) {
            Swal.fire({
                title: 'No Changes',
                text: 'No changes were made to update.',
                icon: 'info',
                confirmButtonText: 'OK',
                timer: 2000
            });
            return;
        }
        
        if (!user) return;
        
        const result = await showConfirmModal();
        
        if (result.isConfirmed) {
            setLoading(true);
            
            try {
                if (isAdmin) {
                    await userService.updateUser(user.email, {
                        isPremium,
                        subscription: subscription === "Free" ? null : subscription,
                        subDate: subDate || null
                    });
                    await refreshUserData();
                    
                    Swal.fire({
                        title: 'Updated Successfully! ✅',
                        text: 'User has been updated',
                        icon: 'success',
                        confirmButtonText: 'Continue',
                        confirmButtonColor: '#00ae58',
                        timer: 2000,
                        timerProgressBar: true
                    });
                } else {
                    await userService.updateUser(user.email, { username });
                    
                    Swal.fire({
                        title: 'Profile Updated! ✅',
                        text: 'Your profile has been updated',
                        icon: 'success',
                        confirmButtonText: 'Continue',
                        confirmButtonColor: '#00ae58',
                        timer: 2000,
                        timerProgressBar: true
                    });
                }
                
                if (setUserData) {
                    const updatedUser = await userService.getUser(user.email);
                    setUserData(updatedUser);
                }
                
                navigate(-1);
            } catch (err) {
                Swal.fire({
                    title: 'Update Failed! ❌',
                    text: err.message || 'Failed to update user. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const showCancelConfirm = () => {
        if (hasChanges()) {
            Swal.fire({
                title: 'Unsaved Changes',
                text: 'You have unsaved changes. Are you sure you want to leave?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#00ae58',
                confirmButtonText: 'Yes, Leave',
                cancelButtonText: 'Stay'
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate(-1);
                }
            });
        } else {
            navigate(-1);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            Swal.fire({
                title: 'Login Required',
                text: 'Please login to access this page',
                icon: 'warning',
                confirmButtonText: 'Go to Login'
            }).then(() => {
                navigate('/login');
            });
        }
    }, [currentUser, navigate]);

    if (!user) return <Loader />;

    return (
        <div className='admin-tips'>
            <AppHelmet title={"Edit User"} location={'/users-edit'} />
            <h1>{isAdmin ? 'Update User' : 'Edit Profile'}</h1>
            {loading && <Loader />}
            {!loading && (
                <form onSubmit={handleSubmit}>
                    <div className="input-container">
                        <label htmlFor="username">Username *</label>
                        <input 
                            type="text" 
                            placeholder='@username' 
                            id='username' 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="input-container">
                        <label htmlFor="email">Email</label>
                        <input 
                            type="email" 
                            placeholder='example@gmail.com' 
                            id='email' 
                            value={email} 
                            readOnly 
                            disabled 
                            style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                        />
                        <small style={{ fontSize: '11px', color: '#999' }}>Email cannot be changed</small>
                    </div>
                    
                    {isAdmin && (
                        <>
                            <div className="input-container">
                                <label htmlFor="subscription">Subscription Plan</label>
                                <select 
                                    id='subscription' 
                                    value={subscription} 
                                    onChange={(e) => setSubscription(e.target.value)}
                                >
                                    <option value="Free">Free</option>
                                    <option value="Daily">Daily VIP</option>
                                    <option value="Weekly">Weekly VIP</option>
                                    <option value="Monthly">Monthly VIP</option>
                                    <option value="Yearly">Yearly VIP</option>
                                </select>
                            </div>
                            <div className="input-container">
                                <label htmlFor="subDate">Subscription Start Date</label>
                                <input 
                                    type="datetime-local" 
                                    id='subDate' 
                                    value={subDate} 
                                    onChange={(e) => setSubDate(e.target.value)} 
                                />
                            </div>
                            <div className="input-container">
                                <label htmlFor="premium">VIP Status</label>
                                <input 
                                    type="checkbox" 
                                    id='premium' 
                                    onChange={(e) => setIsPremium(e.target.checked)} 
                                    checked={isPremium} 
                                />
                                <span style={{ marginLeft: '10px', fontSize: '12px', color: '#FFD700' }}>
                                    {isPremium ? '⭐ VIP Member' : 'Standard User'}
                                </span>
                            </div>
                        </>
                    )}
                    
                    <div style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "15px",
                        marginTop: "20px"
                    }}>
                        <button type="submit" className='btn' style={{ background: 'var(--gradient-primary)' }}>
                            {isAdmin ? 'Update User' : 'Update Profile'}
                        </button>
                        <button type="button" className='btn' onClick={showCancelConfirm} style={{ background: 'var(--grey)' }}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}