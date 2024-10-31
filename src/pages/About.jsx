import React, { useLayoutEffect } from 'react'
import Contact from '../components/Contact/Contact';
import FaqItem from '../components/FaqItem/FaqItem';
import Bg from '../assets/bg.mp4';
import { faqs } from '../data';
import AppHelmet from '../components/AppHelmet';

export default function About() {
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  });
  return (
<div className='about'>
    <AppHelmet title={"About"} location={'/about'}/>
    <div className="quote">
      <video className='video' autoPlay loop muted>
        <source src={Bg} type='video/mp4' />
      </video>
      <div className='content'>
        <p>
        Welcome to Powerking Tips, your go-to platform for accurate and reliable football betting predictions. Our mission is to provide football enthusiasts and bettors with expert tips, in-depth analysis, and strategic insights to help you make informed betting decisions.
        </p>
      </div>
    </div>
    <div className="quote">
      <div className='content'>
        <p>
        At Powerking Tips, we cover a wide range of football leagues and tournaments, offering free and premium VIP predictions. Our team of analysts uses advanced data models, historical statistics, and real-time information to deliver predictions that give you an edge in the betting market. Whether you're looking for match outcomes, goals, or special betting markets, we’ve got you covered.
        <br />
        <br />
        With our VIP subscription, you’ll gain access to exclusive, higher-accuracy tips designed for serious bettors. You can easily subscribe using MPesa, PayPal, or cryptocurrency, ensuring a smooth and convenient experience. We are committed to responsible betting and strive to provide consistent value through our expert predictions.
        <br />
        <br />
        Join our community today and start winning with confidence!
        </p>
      </div>
    </div>
    <h1 id='faq'>FAQ's</h1>
    <h2>People ask for:</h2>
    <div className="faqs-container">
    {
      faqs.map(faq => {
        return (
          <FaqItem key={faq.id} question={faq.question} answer={faq.answer}/>
        )
      })
    }
    </div>
    <Contact />
  </div>
  )
}
