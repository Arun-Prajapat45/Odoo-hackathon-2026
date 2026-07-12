'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Users,
  Map,
  Wrench,
  Fuel,
  Receipt,
  BarChart3,
  Sparkles,
  Bell,
  Menu,
  X,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  ExternalLink,
  Settings
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LogoutButton from './LogoutButton';

export default function AppNavigation({ user, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  const fetchNotifs = async () => {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.success || Array.isArray(json.data) || Array.isArray(json.notifications)) {
        setNotifications(json.data || json.notifications || []);
      }
    } catch (err) {
      // silent fail
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifs();
      const interval = setInterval(fetchNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [user, pathname]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = notifications.filter(n => !n.read);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkOneRead = async (id, e) => {
    e?.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {}
  };

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles, highlight: true },
    { name: 'Vehicles', href: '/vehicles', icon: Truck },
    { name: 'Drivers', href: '/drivers', icon: Users },
    { name: 'Trips & Dispatch', href: '/trips', icon: Map },
    { name: 'Maintenance', href: '/maintenance', icon: Wrench },
    { name: 'Fuel & Expenses', href: '/fuel-expenses', icon: Receipt },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: unreadNotifs.length },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['Admin', 'Fleet Manager'] },
  ];

  const filteredLinks = navLinks.filter(link => {
    if (!link.roles) return true;
    return link.roles.includes(user?.roleName) || user?.roleName === 'Admin';
  });

  const activeLink = filteredLinks.find(l => {
    if (l.href === '/') return pathname === '/';
    return pathname.startsWith(l.href);
  });

  if (!user) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950">{children}</div>;
  }

  const renderNavList = (onItemClick) => (
    <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-3">
      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 pb-2">
        Fleet Module
      </p>
      {filteredLinks.map((link) => {
        const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onItemClick}
            className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
              isActive
                ? link.highlight
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black font-semibold shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-sm border border-slate-200 dark:border-slate-700'
                : link.highlight
                ? 'text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon
                size={18}
                className={`${
                  isActive
                    ? link.highlight
                      ? 'text-white dark:text-black'
                      : 'text-slate-900 dark:text-white'
                    : link.highlight
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                } transition-colors`}
              />
              <span>{link.name}</span>
            </div>
            {link.badge > 0 && (
              <span className="px-2 py-0.5 text-sm font-bold rounded-full bg-red-500 text-white animate-pulse">
                {link.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen w-full flex-1 bg-slate-50 dark:bg-[#111111] text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {/* ── Desktop Sidebar ── */}
      <aside className="w-[260px] flex-shrink-0 hidden md:flex flex-col bg-[#fcfcfc] dark:bg-[#000000] border-r border-slate-200 dark:border-white/10 transition-colors z-40">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 shrink-0">
              <Truck size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                TransitOps
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider mt-1 uppercase">
                Enterprise v2.0
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation List */}
        {renderNavList()}

        {/* User Profile Card */}
        <div className="p-3.5 border-t border-slate-200 dark:border-white/10 mt-auto bg-transparent space-y-2.5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white dark:bg-[#111111] border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="w-8 h-8 rounded-md bg-slate-900 dark:bg-white flex items-center justify-center text-xs font-bold text-white dark:text-black shadow shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">{user.roleName || 'Fleet Role'}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* ── Mobile Slide-Over Drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[280px] max-w-[85vw] bg-white dark:bg-slate-900 flex flex-col shadow-2xl z-10 transition-transform">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
                  <Truck size={18} />
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900 dark:text-white">TransitOps</h1>
                  <p className="text-xs text-slate-500">Fleet Control</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {renderNavList(() => setMobileOpen(false))}

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</p>
                  <p className="text-xs text-blue-500">{user.roleName}</p>
                </div>
              </div>
              <LogoutButton />
            </div>
          </aside>
        </div>
      )}

      {/* ── Main Layout Area ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 z-10">
        {/* Top Header */}
        <header className="h-16 bg-[#fcfcfc] dark:bg-[#000000] border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-4 md:px-8 shrink-0 z-30 transition-colors">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#111111] transition-colors"
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-400 dark:text-slate-500 hidden sm:inline">
                TransitOps
              </span>
              <ChevronRight size={14} className="text-slate-300 dark:text-slate-600 hidden sm:inline" />
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {activeLink ? activeLink.name : 'Workspace'}
              </h2>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* AI Assistant Quick Trigger */}
            <Link
              href="/ai-assistant"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <Sparkles size={14} />
              <span>AI Copilot</span>
            </Link>

            {/* Notification Bell + Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(!notifOpen); fetchNotifs(); }}
                className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-4 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl py-3 z-50 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h3>
                      {unreadNotifs.length > 0 && (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400">
                          {unreadNotifs.length} new
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {unreadNotifs.length > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                      <Link
                        href="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                      >
                        <span>View all</span>
                        <ExternalLink size={12} />
                      </Link>
                    </div>
                  </div>

                  <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[360px]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                        <CheckCircle2 size={32} className="mx-auto mb-2 text-emerald-500/60" />
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">All caught up!</p>
                        <p className="text-xs mt-0.5">No recent alerts or system updates.</p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => {
                        const isCritical = n.type === 'CRITICAL' || n.type === 'URGENT';
                        const isWarning = n.type === 'WARNING';
                        return (
                          <div
                            key={n.id}
                            onClick={(e) => handleMarkOneRead(n.id, e)}
                            className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                              !n.read
                                ? 'bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-50 dark:hover:bg-blue-500/10'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                              isCritical ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                              isWarning ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' :
                              'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                            }`}>
                              {isCritical ? <AlertTriangle size={16} /> : isWarning ? <AlertTriangle size={16} /> : <Info size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs truncate ${!n.read ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                                  {n.title}
                                </p>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
                                {n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle />

            {/* User Avatar Chip (Desktop) */}
            <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-white/10">
              <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center text-xs font-bold text-white dark:text-black shadow-sm">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-white leading-none">{user.name}</p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{user.roleName}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <div className="flex-1 overflow-y-auto w-full bg-transparent transition-colors duration-200 relative">
          <div className="p-4 md:p-8 max-w-[1800px] w-full mx-auto min-h-full flex flex-col z-10 relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
