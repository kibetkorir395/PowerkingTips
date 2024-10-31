import { Send } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import './Newsletter.scss';
import {addMailList} from '../../firebase';

const Newsletter = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const handleSubmit = (event) => {
        event.preventDefault();
        addMailList({email}, setSuccess, setError);
    };

    useEffect(() => {
        error && setTimeout(() => {
          setError(null);
        }, 3000);
        
        success && setTimeout(() => {
          setSuccess(null);
          setEmail('');
        }, 3000);
      }, [error, success]);
    
    return (
        <div className='newsletter theme'>
            <h4>
                Join The Network
            </h4>
            <p>
                Subscribe to our news feeds, kindly fill the form below.
            </p>
            <form onSubmit={handleSubmit}>
                <input type='email' placeholder='Email Address' required value={email} onChange={(e) => setEmail(e.target.value)}/>
                <button type='submit' name='subscribe-btn' title='subscribe' aria-label="submit">
                    <Send />
                </button>
            </form>
            {
              error && <h4 className='error'>{error}!</h4>
            }
            {
              success && <h4 className='success'>{success}!</h4>
            }
        </div>
    );
}

export default Newsletter;
