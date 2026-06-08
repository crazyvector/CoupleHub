import React from 'react';

export const ScrapbookExport = React.forwardRef(({ id, memories, coupleNames, t }, ref) => {
  return (
    <div 
      id={id}
      ref={ref} 
      style={{
        position: 'absolute',
        top: '-10000px', // Hide from screen
        left: 0,
        width: '800px', // Fixed width for high-quality PDF
        backgroundColor: '#fdfbf7', // Warm paper color
        backgroundImage: 'radial-gradient(#e0d6d6 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        padding: '60px',
        fontFamily: "'Playfair Display', 'Georgia', serif",
        color: '#444',
        zIndex: -100,
        boxSizing: 'border-box'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '60px', borderBottom: '2px dashed #FFB5C8', paddingBottom: '30px' }}>
        <h1 style={{ fontSize: '3.5rem', margin: '0 0 15px', color: '#FFB5C8', fontFamily: "'Dancing Script', 'Georgia', cursive" }}>{t('memories.pdfTitle') || 'Cartea Noastră de Amintiri'}</h1>
        <h2 style={{ fontSize: '1.8rem', margin: 0, color: '#777', fontStyle: 'italic' }}>
          {coupleNames.myName} & {coupleNames.partnerName}
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
        {memories.map((m, idx) => (
          <div key={m.id} style={{
            display: 'flex',
            flexDirection: idx % 2 === 0 ? 'row' : 'row-reverse',
            gap: '30px',
            alignItems: 'center',
            background: '#fff',
            padding: '25px',
            borderRadius: '4px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
            border: '1px solid #eaeaea',
            position: 'relative'
          }}>
            {/* Washi Tape */}
            <div style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: `translateX(-50%) rotate(${idx % 2 === 0 ? '-3deg' : '3deg'})`,
              width: '120px',
              height: '25px',
              background: 'rgba(255, 181, 200, 0.5)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              zIndex: 10
            }} />

            {/* Image (Polaroid style) */}
            {m.imagePath ? (
              <div style={{
                background: '#fff',
                padding: '12px 12px 40px 12px',
                boxShadow: '0 6px 15px rgba(0,0,0,0.1)',
                transform: `rotate(${idx % 2 === 0 ? -3 : 3}deg)`,
                width: '300px',
                flexShrink: 0
              }}>
                <img 
                  src={m.imagePath} 
                  alt={m.title} 
                  crossOrigin="anonymous"
                  style={{ width: '100%', height: 'auto', borderRadius: '2px', objectFit: 'cover' }} 
                />
              </div>
            ) : (
              <div style={{
                background: '#fff',
                padding: '10px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                transform: `rotate(${idx % 2 === 0 ? -2 : 2}deg)`,
                width: '150px',
                height: '150px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
                flexShrink: 0
              }}>
                {m.emoji || '📍'}
              </div>
            )}

            {/* Text Content */}
            <div style={{ flex: 1, padding: '20px', textAlign: idx % 2 === 0 ? 'left' : 'right' }}>
              <span style={{ fontSize: '1.2rem', color: '#888', fontStyle: 'italic', display: 'block', marginBottom: '10px' }}>
                {m.date}
              </span>
              <h3 style={{ fontSize: '2rem', margin: '0 0 15px', color: '#333' }}>
                {m.emoji} {m.title}
              </h3>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#555', margin: 0 }}>
                {m.description || t('memories.pdfDefaultDesc') || "O amintire de neuitat..."}
              </p>
              
              {/* Reactions */}
              {m.reactions && m.reactions.length > 0 && (
                <div style={{ marginTop: '20px', padding: '10px', background: '#f9f9f9', borderRadius: '8px', textAlign: 'left' }}>
                  <strong style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', color: '#FFB5C8' }}>{t('memories.pdfComments') || 'Comentarii:'}</strong>
                  {m.reactions.map((r, i) => (
                    <div key={i} style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>
                      <strong>{r.sender === 'his' ? coupleNames.hisName : coupleNames.herName}: </strong>
                      {r.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '60px', color: '#aaa', fontSize: '0.9rem' }}>
        {t('memories.pdfFooter') || 'Generat cu iubire prin CoupleHub 💕'}
      </div>
    </div>
  );
});
