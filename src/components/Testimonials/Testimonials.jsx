import React, { useEffect, useState } from 'react'
import './Testimonials.scss'
import { testimonials } from '../../data'

export default function Testimonials() {
  const [testimonies, setTestimonials] = useState(null);

  useEffect(() => {
    setTestimonials(testimonials)
  }, [])

  return (
    <div className='testimonials'>
        {
            testimonies && testimonies.map(testimonial => {
                return  <div className="testimonial" key={testimonials.indexOf(testimonial)}>
                <p>"{testimonial.text}"</p>
                <div className="user">
                    <div className="name">- {testimonial.name}</div>
                    <div className="country">{testimonial.country}</div>
                </div>
            </div>
            })
        }
    </div>
  )
}
