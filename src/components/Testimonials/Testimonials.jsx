import React, { useEffect, useState, useRef } from 'react'
import './Testimonials.scss'
import { testimonials } from '../../data'
import { FormatQuote, Star, StarBorder } from '@mui/icons-material'

export default function Testimonials() {
  const [testimonies, setTestimonials] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    setTestimonials(testimonials)
  }, [])

  // Auto-scroll functionality
  useEffect(() => {
    if (scrollRef.current && testimonies) {
      const scrollContainer = scrollRef.current;
      let scrollAmount = 0;
      const scrollStep = 1;
      const scrollInterval = setInterval(() => {
        if (scrollContainer) {
          scrollAmount += scrollStep;
          scrollContainer.scrollLeft = scrollAmount;
          
          // Reset scroll when reaching the end
          if (scrollAmount >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
            scrollAmount = 0;
            scrollContainer.scrollLeft = 0;
          }
        }
      }, 30);

      return () => clearInterval(scrollInterval);
    }
  }, [testimonies]);

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<Star key={i} className="star filled" />);
      } else {
        stars.push(<StarBorder key={i} className="star" />);
      }
    }
    return stars;
  };

  return (
    <div className="testimonials-section">
      <div className="testimonials-header">
        <h2>What Our Members Say</h2>
        <p>Join thousands of satisfied users winning daily</p>
      </div>
      
      <div className="testimonials" ref={scrollRef}>
        {testimonies && testimonies.map((testimonial, index) => {
          return (
            <div className="testimonial-card" key={index}>
              <div className="card-glow"></div>
              <div className="quote-icon">
                <FormatQuote />
              </div>
              <p className="testimonial-text">"{testimonial.text}"</p>
              <div className="stars-container">
                {renderStars(testimonial.rating || 5)}
              </div>
              <div className="user-info">
                <div className="user-details">
                  <div className="name">{testimonial.name}</div>
                  <div className="country">
                    {testimonial.country}
                  </div>
                </div>
                <div className="verified-badge">
                  <span>✓ Verified</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="testimonials-footer">
        <div className="stats">
          <div className="stat">
            <span className="stat-number">10K+</span>
            <span className="stat-label">Happy Clients</span>
          </div>
          <div className="stat">
            <span className="stat-number">95%</span>
            <span className="stat-label">Success Rate</span>
          </div>
          <div className="stat">
            <span className="stat-number">24/7</span>
            <span className="stat-label">Support</span>
          </div>
        </div>
      </div>
    </div>
  )
}