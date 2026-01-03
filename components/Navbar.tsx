'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, User, LogOut, Settings, Store, ChevronDown } from 'lucide-react';
import Button from './ui/Button';

export default function Navbar() {
  const { data: session, status } = useSession();
  const userRole = (session?.user as { role?: string })?.role;
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Shop admin はトップページではなく shop-admin に遷移
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
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
           {userRole !== 'shop_admin' && (
            <Link href={logoHref} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800">Цаг Захиалга</span>
            </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
            ) : session?.user ? (
              <>
                {/* Super Admin: システム管理 */}
                {userRole === 'super_admin' && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Удирдлага</span>
                    </Button>
                  </Link>
                )}
                
                {/* Shop Admin: 店舗管理のみ */}
                {userRole === 'shop_admin' && (
                  <Link href="/shop-admin">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Store className="w-4 h-4" />
                      <span className="hidden sm:inline">Үйлчилгээний газар</span>
                    </Button>
                  </Link>
                )}
                
                {/* マイ予約: shop_admin 以外のみ表示 */}
                {userRole !== 'shop_admin' && (
                  <Link href="/my-reservations">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Calendar className="w-4 h-4" />
                      <span className="hidden sm:inline">Миний захиалга</span>
                    </Button>
                  </Link>
                )}
                
                {/* User Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center ring-2 ring-sky-200">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {session.user.name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-slate-700 hidden sm:inline max-w-[100px] truncate">
                      {session.user.name}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                      {/* User Info */}
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="font-medium text-slate-800">{session.user.name}</div>
                        <div className="text-sm text-slate-500 truncate">{session.user.email}</div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>Профайл засах</span>
                        </Link>
                      </div>

                      {/* Logout */}
                      <div className="border-t border-slate-100 pt-1">
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
