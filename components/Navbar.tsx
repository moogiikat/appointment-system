'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, User, LogOut, Settings, Store } from 'lucide-react';
import Button from './ui/Button';

export default function Navbar() {
  const { data: session, status } = useSession();
  const userRole = (session?.user as { role?: string })?.role;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-800">Цаг Захиалга</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
            ) : session?.user ? (
              <>
                {userRole === 'super_admin' && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Удирдлага</span>
                    </Button>
                  </Link>
                )}
                {userRole === 'shop_admin' && (
                  <Link href="/shop-admin">
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Store className="w-4 h-4" />
                      <span className="hidden sm:inline">Дэлгүүр</span>
                    </Button>
                  </Link>
                )}
                <Link href="/my-reservations">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">Миний захиалга</span>
                  </Button>
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-full border border-sky-200">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{session.user.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut()}
                  className="text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
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
