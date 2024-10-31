import React from 'react';
import './NewsItem.scss'
import { NavLink } from 'react-router-dom';
import Image from '../../assets/logo.png';
import { ArrowForward } from '@mui/icons-material';

export default function NewsItem({data}) {
  const readingTime = (articleText) => {
    const wordsArray = articleText.split(' ');
    // Count the number of words in the array
    const wordCount = wordsArray.length;
    // Calculate the estimated reading time
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  }
  
  function truncateTitle(input, value) {
    if (input.length > value) {
       return input.substring(0, value) + '...';
    }
    return input;
 };
  
  return (
  <div className="col-md-6 article-pre__col news-item">
    <NavLink to={`/blogs/${data.id.trim().split(' ').join("_")}`} title={truncateTitle(data.title, 5)}>
    <h2>{data.timestamp}</h2>
      <img src={data.imageUrl ? data.imageUrl : Image} alt={data.title.substring(0, 8)} />
      <h4>
        <span className="article-pre__aut">{data.category}</span> 
        <span className="date"> - {readingTime(data.description)} mins read</span>
      </h4>
      <h3>{data.title}<span> <ArrowForward /></span></h3>
    </NavLink>
  </div>
  )
}
