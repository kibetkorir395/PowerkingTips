import React from 'react';
import './Loader.scss';

export default function Loader() {
  return (
    <div className="loader">
      <div className="loader-container">
        <svg 
          version="1.1" 
          xmlns="http://www.w3.org/2000/svg" 
          xmlnsXlink="http://www.w3.org/1999/xlink" 
          viewBox="0 0 1000 1000"
          className="loader-svg"
        >
          {/* Planets in orbit */}
          <g id="planet_8" className="planet">
            <circle fill="#2C2CDB" cx="18" cy="503.3" r="16.4" />
          </g>
          <g id="planet_7" className="planet">
            <circle fill="#4EDAE5" cx="71.3" cy="503.3" r="17.4" />
          </g>
          <g id="planet_6" className="planet">
            <circle fill="#F95FB7" cx="132" cy="503.3" r="23.5" />
          </g>
          <g id="planet_5" className="planet">
            <circle fill="#EFAE1D" cx="194.7" cy="503.3" r="18.9" />
          </g>
          <g id="planet_4" className="planet">
            <circle fill="#AF1212" cx="243.4" cy="503.3" r="9.5" />
          </g>
          <g id="planet_3" className="planet">
            <circle fill="#24E2A3" cx="287.2" cy="503.3" r="13.8" />
          </g>
          <g id="planet_2" className="planet">
            <circle fill="#C63DE8" cx="333.3" cy="503.3" r="12" />
          </g>
          <g id="planet_1" className="planet">
            <circle fill="#E53939" cx="373.7" cy="503.3" r="8.2" />
          </g>
          
          {/* Central sun with pulse effect */}
          <g id="sun">
            <circle fill="#FFE91F" cx="500" cy="500" r="99" />
            <circle fill="#FFE91F" cx="500" cy="500" r="99" opacity="0.3" className="sun-pulse" />
          </g>
          
          {/* Orbit rings */}
          <ellipse cx="500" cy="500" rx="150" ry="150" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" className="orbit-ring" />
          <ellipse cx="500" cy="500" rx="250" ry="250" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" className="orbit-ring" />
          <ellipse cx="500" cy="500" rx="350" ry="350" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" className="orbit-ring" />
        </svg>
        
        {/* Loading text */}
        <div className="loading-text">
          <span>L</span>
          <span>o</span>
          <span>a</span>
          <span>d</span>
          <span>i</span>
          <span>n</span>
          <span>g</span>
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      </div>
    </div>
  );
}