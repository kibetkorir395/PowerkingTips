import React from 'react'
import { NavLink } from 'react-router-dom';

export default function SliderItem({data}) {
  function truncateItem(input, value) {
    if (input.length > value) {
       return input.substring(0, value) + '...';
    }
    return input;
 };
  return (
  <NavLink to={`/blogs/${data.id.trim().split(' ').join("_")}`} className="slider-item">
    <h4 className="title">{truncateItem(data.title, 45)}</h4>
    <p>{truncateItem(data.title, 60)}</p>
    <span className="tag">
        {data.category}
    </span>
  </NavLink>
  )
}
