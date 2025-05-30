'use client';

import React from 'react';

export function StyleProvider() {
  return (
    <style jsx global>{`
      body {
        font-family: 'DM Sans', sans-serif;
        background: 
          radial-gradient(circle at 10% 20%, rgba(48, 152, 152, 0.3) 0%, rgba(48, 152, 152, 0) 40%),
          radial-gradient(circle at 90% 30%, rgba(255, 159, 0, 0.3) 0%, rgba(255, 159, 0, 0) 45%),
          radial-gradient(circle at 50% 80%, rgba(244, 99, 30, 0.3) 0%, rgba(244, 99, 30, 0) 50%),
          radial-gradient(circle at 20% 70%, rgba(203, 4, 4, 0.2) 0%, rgba(203, 4, 4, 0) 40%);
      }
    `}</style>
  );
}