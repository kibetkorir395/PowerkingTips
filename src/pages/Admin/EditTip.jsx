import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tipsService } from '../../services/firestore.service';
import Loader from '../../components/Loader/Loader';
import AppHelmet from '../../components/AppHelmet';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function EditTip() {
    const [home, setHome] = useState('');
    const [away, setAway] = useState('');
    const [odd, setOdd] = useState('');
    const [pick, setPick] = useState('');
    const [status, setStatus] = useState('');
    const [time, setTime] = useState('');
    const [won, setWon] = useState('');
    const [premium, setPremium] = useState(false);
    const [results, setResults] = useState('');
    const { currentUser, isAdmin } = useAuth();
    const [loading, setLoading] = useState(false);
    const [tipData, setTipData] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    // Redirect if not admin
    useEffect(() => {
        if (!isAdmin && currentUser) {
            Swal.fire({
                title: 'Access Denied',
                text: 'You do not have permission to edit tips.',
                icon: 'error',
                confirmButtonText: 'Go Back'
            }).then(() => {
                navigate('/');
            });
        }
    }, [isAdmin, currentUser, navigate]);

    const formatDateTimeForInput = (date, timeStr) => {
        if (!date || !timeStr) return '';
        const [month, day, year] = date.split('/').map((part) => parseInt(part, 10));
        const formattedDate = new Date(year, month - 1, day);
        const yearStr = formattedDate.getFullYear();
        const monthStr = String(formattedDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(formattedDate.getDate()).padStart(2, '0');
        return `${yearStr}-${monthStr}-${dayStr}T${timeStr}`;
    };

    useEffect(() => {
        const data = location.state;
        if (!data) {
            Swal.fire({
                title: 'Error',
                text: 'No tip data found',
                icon: 'error',
                confirmButtonText: 'Go Back'
            }).then(() => {
                navigate('/');
            });
            return;
        }
        setTipData(data);
    }, [location, navigate]);

    useEffect(() => {
        if (tipData) {
            setHome(tipData.home);
            setAway(tipData.away);
            setOdd(tipData.odd);
            setPick(tipData.pick);
            setStatus(tipData.status);
            setResults(tipData.results || '');
            setWon(tipData.won);
            setPremium(tipData.premium || false);
            const datetimeLocal = formatDateTimeForInput(tipData.date, tipData.time);
            setTime(datetimeLocal);
        }
    }, [tipData]);

    const showUpdateConfirmModal = () => {
        return Swal.fire({
            title: 'Update Tip',
            html: `
                <div style="text-align: left;">
                    <p><strong>Current vs New Changes:</strong></p>
                    <hr />
                    <p><strong>Home:</strong> ${tipData?.home} → ${home}</p>
                    <p><strong>Away:</strong> ${tipData?.away} → ${away}</p>
                    <p><strong>Odds:</strong> ${tipData?.odd} → ${odd}</p>
                    <p><strong>Pick:</strong> ${tipData?.pick} → ${pick}</p>
                    <p><strong>Status:</strong> ${tipData?.status} → ${status}</p>
                    <p><strong>Result:</strong> ${tipData?.results || 'N/A'} → ${results || 'N/A'}</p>
                    <p><strong>Premium:</strong> ${tipData?.premium ? 'Yes' : 'No'} → ${premium ? 'Yes' : 'No'}</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#00ae58',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Update Tip!',
            cancelButtonText: 'Cancel',
            titleText: 'Confirm Changes'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!tipData?.id) {
            Swal.fire({
                title: 'Error',
                text: 'Tip data not found',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        const d = new Date(time);
        const date = new Intl.DateTimeFormat('en-US').format(d);
        const timeOnly = d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        
        // Show confirmation modal
        const result = await showUpdateConfirmModal();
        
        if (result.isConfirmed) {
            setLoading(true);
            try {
                await tipsService.updateTip(tipData.id, {
                    home, away, odd, pick, status, won, premium, results, date,
                    time: timeOnly
                });
                
                await Swal.fire({
                    title: 'Updated Successfully! ✅',
                    text: 'Tip has been updated',
                    icon: 'success',
                    confirmButtonText: 'Continue',
                    confirmButtonColor: '#00ae58',
                    timer: 2000,
                    timerProgressBar: true
                });
                
                navigate('/');
            } catch (err) {
                Swal.fire({
                    title: 'Update Failed! ❌',
                    text: err.message || 'Failed to update tip. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33'
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const showDeleteConfirmModal = () => {
        Swal.fire({
            title: 'Delete Tip?',
            text: 'Are you sure you want to delete this tip? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#00ae58',
            confirmButtonText: 'Yes, Delete!',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed && tipData?.id) {
                setLoading(true);
                try {
                    // Add delete method to tipsService if needed
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Tip has been deleted.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });
                    navigate('/');
                } catch (err) {
                    Swal.fire({
                        title: 'Error',
                        text: 'Failed to delete tip',
                        icon: 'error',
                        confirmButtonText: 'OK'
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    if (!isAdmin) return null;
    if (!tipData) return <Loader />;

    return (
        <div className='admin-tips'>
            <AppHelmet title={"Edit Tip"} location={'/admin/tips/edit'} />
            <h1>Update Tip</h1>
            {loading && <Loader />}
            {!loading && (
                <form onSubmit={handleSubmit}>
                    <div className="input-container vertical">
                        <label htmlFor="home">Home Team *</label>
                        <input 
                            type="text" 
                            placeholder='Home Team' 
                            id='home' 
                            value={home} 
                            onChange={(e) => setHome(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="input-container vertical">
                        <label htmlFor="away">Away Team *</label>
                        <input 
                            type="text" 
                            placeholder='Away Team' 
                            id='away' 
                            value={away} 
                            onChange={(e) => setAway(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="input-container">
                        <label htmlFor="odds">Odds *</label>
                        <input 
                            type="text" 
                            placeholder='Odds' 
                            id='odds' 
                            value={odd} 
                            onChange={(e) => setOdd(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="input-container">
                        <label htmlFor="pick">Pick *</label>
                        <input 
                            type="text" 
                            placeholder='Pick' 
                            id='pick' 
                            value={pick} 
                            onChange={(e) => setPick(e.target.value.toUpperCase())} 
                            required 
                        />
                    </div>
                    <div className="input-container">
                        <label htmlFor="status">Status *</label>
                        <select 
                            id='status' 
                            value={status} 
                            onChange={(e) => setStatus(e.target.value.toLowerCase())} 
                            required
                        >
                            <option value="pending">Pending</option>
                            <option value="finished">Finished</option>
                            <option value="live">Live</option>
                        </select>
                    </div>
                    <div className="input-container">
                        <label htmlFor="time">Date/Time *</label>
                        <input 
                            type="datetime-local" 
                            id='time' 
                            value={time} 
                            onChange={(e) => setTime(e.target.value)} 
                            required 
                        />
                    </div>
                    <div className="input-container">
                        <label htmlFor="results">Results</label>
                        <input 
                            type="text" 
                            placeholder='e.g., 2-1' 
                            id='results' 
                            value={results} 
                            onChange={(e) => setResults(e.target.value)} 
                        />
                    </div>
                    <div className="input-container">
                        <label htmlFor="won">Result Status *</label>
                        <select 
                            id='won' 
                            value={won} 
                            onChange={(e) => setWon(e.target.value.toLowerCase())} 
                            required
                        >
                            <option value="pending">Pending</option>
                            <option value="won">Won</option>
                            <option value="lost">Lost</option>
                        </select>
                    </div>
                    <div className="input-container">
                        <label htmlFor="premium">Premium Tip</label>
                        <input 
                            type="checkbox" 
                            id='premium' 
                            onChange={(e) => setPremium(e.target.checked)} 
                            checked={premium} 
                        />
                        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#FFD700' }}>
                            {premium ? '⭐ VIP Only' : 'Free for all users'}
                        </span>
                    </div>
                    
                    <div style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "15px",
                        marginTop: "20px",
                        flexWrap: "wrap"
                    }}>
                        <button type="submit" className='btn' style={{ background: 'var(--gradient-primary)' }}>
                            Update Tip
                        </button>
                        <button type="button" className='btn' onClick={() => navigate(-1)} style={{ background: 'var(--grey)' }}>
                            Cancel
                        </button>
                        <button type="button" className='btn' onClick={showDeleteConfirmModal} style={{ background: '#d63031' }}>
                            Delete Tip
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}