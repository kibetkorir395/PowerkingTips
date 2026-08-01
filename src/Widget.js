// src/Widget.js
import React from 'react';

const Widget = () => {
  return (
    <div style={{
      padding: '15px',
      border: '1px solid #ddd',
      borderRadius: '5px',
      backgroundColor: '#f9f9f9',
      maxWidth: '300px'
    }}>
      <h3>My Shareable Widget</h3>
      <p>This is a React widget that can be embedded anywhere!</p>
      <button onClick={() => alert('Widget clicked!')}>
        Click Me
      </button>
    </div>
  );
};

export default Widget;