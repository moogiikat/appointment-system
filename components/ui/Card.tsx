'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered';
}

/*
 * EPARK のカード仕様：角丸 8px、1px #e0e0e0 の枠、影 0 0 16px rgba(0,0,0,.2)。
 * hover は transform ではなく opacity 0.7 で落とす。
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', children, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-white border border-line-card',
      elevated: 'bg-white border border-line-card shadow-card',
      bordered: 'bg-white border border-line-strong',
    };

    return (
      <div
        ref={ref}
        className={`rounded-card p-4 md:p-6 ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
