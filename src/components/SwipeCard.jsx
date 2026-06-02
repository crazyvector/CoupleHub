import React, { useState, useRef, useEffect } from 'react';
import styles from './SwipeCard.module.css';

export default function SwipeCard({ item, onSwipeRight, onSwipeLeft, onClick }) {
  const cardRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const threshold = 120; // Cum să tragi până să fie considerat swipe

  const handleDragStart = (clientX, clientY) => {
    setIsDragging(true);
    setStartPos({ x: clientX, y: clientY });
  };

  const handleDragMove = (clientX, clientY) => {
    if (!isDragging) return;
    const currentX = clientX - startPos.x;
    const currentY = clientY - startPos.y;
    setPosition({ x: currentX, y: currentY });
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (Math.abs(position.x) < 5 && Math.abs(position.y) < 5) {
      if (onClick) onClick(item);
      return;
    }

    if (position.x > threshold) {
      // Swiped Right
      if (onSwipeRight) onSwipeRight(item);
    } else if (position.x < -threshold) {
      // Swiped Left
      if (onSwipeLeft) onSwipeLeft(item);
    } else {
      // Reset position if threshold not met
      setPosition({ x: 0, y: 0 });
    }
  };

  // Touch Events
  const onTouchStart = (e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchMove = (e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
  const onTouchEnd = () => handleDragEnd();

  // Mouse Events
  const onMouseDown = (e) => handleDragStart(e.clientX, e.clientY);
  const onMouseMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      handleDragMove(e.clientX, e.clientY);
    }
  };
  const onMouseUp = () => handleDragEnd();
  const onMouseLeave = () => {
    if (isDragging) handleDragEnd();
  };

  const rotation = position.x * 0.1; 
  const cardStyle = {
    transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
  };

  const getOverlayOpacity = () => {
    const ratio = Math.min(Math.abs(position.x) / threshold, 1);
    return ratio;
  };

  return (
    <div 
      className={styles.cardContainer}
      ref={cardRef}
      style={cardStyle}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <img src={item.imageUrl} alt={item.title || "Design"} className={styles.image} draggable="false" />

      {/* Indicator LIKE */}
      <div 
        className={styles.indicatorLike} 
        style={{ opacity: position.x > 0 ? getOverlayOpacity() : 0 }}
      >
        DA ❤️
      </div>

      {/* Indicator NOPE */}
      <div 
        className={styles.indicatorNope} 
        style={{ opacity: position.x < 0 ? getOverlayOpacity() : 0 }}
      >
        NU ❌
      </div>
    </div>
  );
}
