import React, { useEffect, useState } from 'react';
import './Contact.scss';
import Logo from '../../assets/logo.png';
import { Email, Phone } from '@mui/icons-material';
import { Link, NavLink } from 'react-router-dom';
import Dialog from '../Dialog/Dialog';
import {addContact} from '../../firebase';


const Contact = () => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    addContact({name, email, message}, setSuccess, setError);
  };
  
  useEffect(() => {
    error && setTimeout(() => {
      setError(null);
    }, 3000);
    
    success && setTimeout(() => {
      setSuccess(null);
      setEmail('');
      setName('');
      setMessage('');
    }, 3000);
  }, [error, success]);
    return (
        <div className="contact">
          <h1>Get Connected</h1>
          {success && <Dialog text={success} title={"Your details was submitted!"} isError={false}/>}
          {error && <Dialog text={error} title={"An Error Occurred!"} isError={true}/>}
            <form onSubmit={handleSubmit}>
              <div>
                <input type="text"  placeholder="NAME"  required value={name} onChange={(e) => setName(e.target.value)}/>
                <input type="email"  placeholder="EMAIL"  required value={email} onChange={(e) => setEmail(e.target.value)}/>
              </div>
              <textarea placeholder="MESSAGE" required value={message} onChange={(e) => setMessage(e.target.value)}/>
              <button className='btn' title='send' type='submit' aria-label="send">SEND</button>
          </form> 
     </div>
    );
}
export default Contact;