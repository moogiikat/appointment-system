'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

/*
 * EPARK のボタン仕様：
 * - 角丸 4px（カードの 8px とは別）
 * - 影は 0 2px 4px rgba(0,0,0,.2) のみ。グラデーションは使わない
 * - 無効時は #e5e5e5 / #c5c5c5 で影を消す
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center font-bold rounded-[4px] transition-opacity duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 hover:opacity-70 disabled:opacity-100 disabled:cursor-not-allowed disabled:hover:opacity-100';

    const variantClasses = {
      primary: 'bg-brand text-white shadow-control disabled:bg-line disabled:text-placeholder disabled:shadow-none',
      secondary: 'bg-ink text-white disabled:bg-line disabled:text-placeholder',
      outline: 'bg-white border border-line-strong text-ink disabled:text-placeholder',
      danger: 'bg-badge text-white shadow-control disabled:bg-line disabled:text-placeholder disabled:shadow-none',
      ghost: 'text-ink hover:bg-surface',
    };

    const sizeClasses = {
      sm: 'px-3 h-8 text-[12px] gap-1',
      md: 'px-4 h-10 text-[14px] gap-1.5',
      lg: 'px-6 h-[45px] md:h-12 text-[15px] md:text-[16px] gap-2',
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Түр хүлээнэ үү...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
