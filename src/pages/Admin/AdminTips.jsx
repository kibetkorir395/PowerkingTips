import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { tipsService } from '../../services/firestore.service';
import Loader from '../../components/Loader/Loader';
import AppHelmet from '../../components/AppHelmet';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function AdminTips() {
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
    const navigate = useNavigate();

    // Redirect if not admin
    useEffect(() => {
        if (!isAdmin && currentUser) {
            Swal.fire({
                title: 'Access Denied',
                text: 'You do not have permission to access this page.',
                icon: 'error',
                confirmButtonText: 'Go Back'
            }).then(() => {
                navigate('/');
            });
        }
    }, [isAdmin, currentUser, navigate]);

    const showConfirmModal = () => {
        return Swal.fire({
            title: 'Add New Tip',
            html: `
                <div style="text-align: left;">
                    <p><strong>Home Team:</strong> ${home}</p>
                    <p><strong>Away Team:</strong> ${away}</p>
                    <p><strong>Odds:</strong> ${odd}</p>
                    <p><strong>Pick:</strong> ${pick}</p>
                    <p><strong>Status:</strong> ${status}</p>
                    <p><strong>Result:</strong> ${results || 'Pending'}</p>
                    <p><strong>Premium:</strong> ${premium ? 'Yes' : 'No'}</p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#00ae58',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Add Tip!',
            cancelButtonText: 'Cancel',
            titleText: 'Confirm Tip Details'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!time) {
            Swal.fire({
                title: 'Missing Information',
                text: 'Please select date and time',
                icon: 'warning',
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
        const result = await showConfirmModal();
        
        if (result.isConfirmed) {
            setLoading(true);
            try {
                await tipsService.addTip({ 
                    home, away, date, odd, pick, status, 
                    time: timeOnly, won, premium, results 
                });
                
                await Swal.fire({
                    title: 'Success! 🎉',
                    text: 'Tip has been added successfully',
                    icon: 'success',
                    confirmButtonText: 'Continue',
                    confirmButtonColor: '#00ae58',
                    timer: 3000,
                    timerProgressBar: true
                });
                
                // Reset form
                setHome('');
                setAway('');
                setOdd('');
                setPick('');
                setStatus('');
                setTime('');
                setWon('');
                setPremium(false);
                setResults('');
                
                // Ask if user wants to add another tip
                const addAnother = await Swal.fire({
                    title: 'Add Another Tip?',
                    text: 'Would you like to add another tip?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Add Another',
                    cancelButtonText: 'No, Go Home',
                    confirmButtonColor: '#00ae58',
                    cancelButtonColor: '#d33'
                });
                
                if (addAnother.isConfirmed) {
                    // Focus on home team input
                    document.getElementById('home')?.focus();
                } else {
                    navigate('/');
                }
            } catch (err) {
                Swal.fire({
                    title: 'Error! ❌',
                    text: err.message || 'Failed to add tip. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33'
                });
            } finally {
                setLoading(false);
            }
        }
    }

    const showCancelConfirm = () => {
        Swal.fire({
            title: 'Cancel?',
            text: 'Are you sure you want to cancel? All entered data will be lost.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#00ae58',
            confirmButtonText: 'Yes, Cancel',
            cancelButtonText: 'No, Continue Editing'
        }).then((result) => {
            if (result.isConfirmed) {
                navigate('/');
            }
        });
    };

    if (!isAdmin) return null;

    return (
        <div className='admin-tips'>
            <AppHelmet title={"Add Tip"} location={'/admin/tips'} />
            <h1>Add New Tip</h1>
            {loading && <Loader />}
            {!loading && (
                <form onSubmit={handleSubmit}>
                    <div className="input-container vertical">
                        <label htmlFor="home">Home Team *</label>
                        <input 
                            type="text" 
                            placeholder='e.g., Manchester United' 
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
                            placeholder='e.g., Liverpool' 
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
                            placeholder='e.g., 2.10' 
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
                            placeholder='e.g., Over 2.5' 
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
                            <option value="">Select Status</option>
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
                            <option value="">Select Result</option>
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
                        marginTop: "20px"
                    }}>
                        <button type="submit" className='btn' style={{ background: 'var(--gradient-primary)' }}>
                            Add Tip
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