import React, { useState } from 'react'
import './FaqItem.scss'

export default function FaqItem({ question, answer, index }) {
    const [isActive, setIsActive] = useState(false);
    
    const handleClick = () => {
        setIsActive(!isActive);
    }
    
    return (
        <div className={`faq-item ${isActive ? "active" : ""}`}>
            <div className="faq-header" onClick={handleClick}>
                <div className="question-icon">
                    <span className="icon-question">?</span>
                </div>
                <h3 className="question">{question}</h3>
                <div className={`toggle-icon ${isActive ? "opened" : ""}`}>
                    <span></span>
                </div>
            </div>
            <div className={`faq-answer ${isActive ? "show" : ""}`}>
                <div className="answer-content">
                    <p>{answer}</p>
                </div>
            </div>
        </div>
    )
}