import React, { useState, useMemo } from 'react';
import { testimonials, countryFlags, getTestimonialStats } from '../../data/mockData';
import './Testimonials2.scss';

export default function Testimonials2() {
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [visibleCount, setVisibleCount] = useState(6);
  
  const stats = useMemo(() => getTestimonialStats(), []);
  
  const filteredTestimonials = useMemo(() => {
    if (selectedCountry === 'All') {
      return testimonials;
    }
    return testimonials.filter(t => t.country === selectedCountry);
  }, [selectedCountry]);
  
  const displayedTestimonials = filteredTestimonials.slice(0, visibleCount);
  const hasMore = visibleCount < filteredTestimonials.length;
  
  const loadMore = () => {
    setVisibleCount(prev => prev + 6);
  };
  
  const countries = ['All', 'Kenya', 'Nigeria', 'South Africa', 'Ghana'];
  
  return (
    <div className="testimonials-section">
      <div className="testimonials-stats">
        {Object.entries(stats).map(([country, data]) => (
          <div key={country} className="stat-card">
            <span className="flag">{countryFlags[country]}</span>
            <span className="country">{country}</span>
            <span className="rating">⭐ {data.avgRating}</span>
            <span className="count">{data.count} reviews</span>
          </div>
        ))}
      </div>
      
      <div className="testimonials-filters">
        {countries.map(country => (
          <button
            key={country}
            className={`filter-btn ${selectedCountry === country ? 'active' : ''}`}
            onClick={() => {
              setSelectedCountry(country);
              setVisibleCount(6);
            }}
          >
            {country !== 'All' && countryFlags[country]} {country}
            {country !== 'All' && <span className="count">({stats[country]?.count || 0})</span>}
          </button>
        ))}
      </div>
      
      <div className="testimonials-grid">
        {displayedTestimonials.map(testimonial => (
          <div key={testimonial.id} className="testimonial-card">
            <div className="testimonial-header">
              <div className="user-info">
                <div className="avatar">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="details">
                  <h4>{testimonial.name}</h4>
                  <div className="location">
                    <span>{countryFlags[testimonial.country]}</span>
                    <span>{testimonial.city}, {testimonial.country}</span>
                  </div>
                </div>
              </div>
              <div className="rating">
                {'⭐'.repeat(testimonial.rating)}
              </div>
            </div>
            
            <div className="testimonial-body">
              <p>"{testimonial.text}"</p>
            </div>
            
            <div className="testimonial-footer">
              {testimonial.verified && (
                <span className="verified-badge">✓ Verified Purchase</span>
              )}
              {testimonial.subscription !== 'Free' && (
                <span className="vip-badge">👑 {testimonial.subscription}</span>
              )}
              <span className="date">
                {new Date(testimonial.date).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {hasMore && (
        <div className="load-more">
          <button onClick={loadMore} className="btn-load-more">
            Load More Testimonials
          </button>
        </div>
      )}
    </div>
  );
}