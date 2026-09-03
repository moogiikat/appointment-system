'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, User, LogOut, Settings, Store, ChevronDown, Heart } from 'lucide-react';
import Button from './ui/Button';
import PointsBadge from './PointsBadge';

export default function Navbar() {
  const { data: session, status } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const logoHref = userRole === 'shop_admin' ? '/shop-admin' : '/';

  // Fetch user avatar
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setAvatar(data.avatar);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    }

    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white border-b border-line sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12 md:h-16">
          <div className="flex items-center">
           {userRole !== 'shop_admin' && (
            <Link href={logoHref} aria-label="Цаг Захиалга" className="flex items-center">
              <div className="w-8 h-8 md:w-9 md:h-9 bg-brand rounded-control flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
            </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-line animate-pulse" />
            ) : session?.user ? (
              <>
                {userRole === 'super_admin' && (
                  <Link href="/admin" className="flex flex-col items-center justify-center px-2 min-w-[46px] md:min-w-[60px] hover:opacity-70 transition-opacity">
                      <Settings className="w-5 h-5 md:w-6 md:h-6 text-brand" />
                      <span className="text-[9px] md:text-[11px] font-bold text-muted mt-0.5 whitespace-nowrap">Удирдлага</span>
                    </Link>
                )}
                
                {userRole === 'shop_admin' && (
                  <Link href="/shop-admin" className="flex flex-col items-center justify-center px-2 min-w-[46px] md:min-w-[60px] hover:opacity-70 transition-opacity">
                      <Store className="w-5 h-5 md:w-6 md:h-6 text-brand" />
                      <span className="text-[9px] md:text-[11px] font-bold text-muted mt-0.5 whitespace-nowrap">Үйлчилгээний газар</span>
                    </Link>
                )}
                
                {userRole !== 'shop_admin' && (
                  <Link href="/my-reservations" className="flex flex-col items-center justify-center px-2 min-w-[46px] md:min-w-[60px] hover:opacity-70 transition-opacity">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6 text-brand" />
                      <span className="text-[9px] md:text-[11px] font-bold text-muted mt-0.5 whitespace-nowrap">Миний захиалга</span>
                    </Link>
                )}

                {userRole !== 'shop_admin' && userRole !== 'super_admin' && (
                  <>
                    <Link href="/favorites" className="flex flex-col items-center justify-center px-2 min-w-[46px] md:min-w-[60px] hover:opacity-70 transition-opacity">
                      <Heart className="w-5 h-5 md:w-6 md:h-6 text-brand" />
                      <span className="text-[9px] md:text-[11px] font-bold text-muted mt-0.5 whitespace-nowrap">Хадгалсан</span>
                    </Link>
                    <PointsBadge />
                  </>
                )}
                
                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-surface rounded-full transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-brand flex items-center justify-center ring-2 ring-line">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {session.user.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-ink hidden sm:inline max-w-[100px] truncate">
                      {session.user.name}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-placeholder transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-card shadow-lg border border-line py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-2 border-b border-line">
                        <div className="font-medium text-ink-strong">{session.user.name}</div>
                        <div className="text-sm text-subtle truncate">{session.user.email}</div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-ink hover:bg-brand-band hover:text-brand-dark transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Профайл засах</span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-line pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowDropdown(false);
                            signOut();
                          }}
                          className="flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Гарах</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/auth/signin">
                <Button variant="primary" size="sm">
                  Нэвтрэх
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
