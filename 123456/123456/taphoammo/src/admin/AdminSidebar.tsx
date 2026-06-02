/**
 * AdminSidebar - Sidebar navigation cho Admin Dashboard
 */
import React from 'react';

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Store,
  ClipboardCheck,
  Truck,
  MessageSquareX,
  MessageSquare,
  CreditCard,
  Wallet,
  Bell,
  History,
  HandCoins,
  MoreHorizontal,
  LogOut,
  ChevronDown,
  Search,
  ArrowLeft,
  PanelLeft,
  PanelLeftClose,
  Settings,
} from 'lucide-react';
import type { AdminView } from './types';

interface AdminSidebarProps {
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
  notificationCount?: number;
  /** Số gian hàng + mặt hàng chờ duyệt (badge menu Quản lý gian hàng) */
  pendingGianHangCount?: number;
  complaintOrderCount?: number;
  pendingPreOrderCount?: number;
}

interface MenuItem {
  id: AdminView;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  badge?: number;
  divider?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { id: 'statistics', icon: LayoutDashboard, label: 'Thống kê' },
  { id: 'general-settings', icon: Settings, label: 'Cài đặt chung' },
  { id: 'users', icon: Users, label: 'Quản lý người dùng' },
  { id: 'gian-hang-approval', icon: ClipboardCheck, label: 'Quản lý gian hàng' },
  { id: 'sales', icon: ShoppingBag, label: 'Quản lý bán hàng' },
  { divider: true, id: 'product-orders' as AdminView, icon: ShoppingBag, label: '' },
  { id: 'product-orders', icon: ShoppingBag, label: 'Đơn hàng sản phẩm' },
  { id: 'service-orders', icon: Truck, label: 'Đơn hàng dịch vụ' },
  { id: 'complaint-orders', icon: MessageSquareX, label: 'Đơn hàng khiếu nại' },
  { id: 'top-stores', icon: Store, label: 'Gian hàng Top 1' },
  { divider: true, id: 'messages' as AdminView, icon: MessageSquare, label: '' },
  { id: 'messages', icon: MessageSquare, label: 'Quản lý nhắn tin' },
  { divider: true, id: 'payment-methods' as AdminView, icon: CreditCard, label: '' },
  { id: 'payment-methods', icon: CreditCard, label: 'Phương thức thanh toán' },
  { id: 'withdrawals', icon: Wallet, label: 'Rút tiền' },
  { id: 'payment-history', icon: History, label: 'Lịch sử giao dịch' },
  { id: 'seller-transaction-history', icon: HandCoins, label: 'Lịch sử giữ tiền' },
  { divider: true, id: 'notifications' as AdminView, icon: Bell, label: '' },
  { id: 'notifications', icon: Bell, label: 'Thông báo', badge: 0 },
];

const SidebarItem = ({
  item,
  active,
  onClick,
  collapsed,
}: {
  item: MenuItem;
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
}) => {
  const Icon = item.icon;
  return (
    <button
      type="button"
      title={collapsed ? item.label : undefined}
      onClick={onClick}
      className={`w-full flex items-center rounded-xl text-sm font-medium transition-all ${
        collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-2.5'
      } ${
        active
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
      }`}
    >
      <span className="relative shrink-0 inline-flex">
        <Icon size={18} />
        {collapsed && item.badge !== undefined && item.badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        )}
      </span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                active ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
              }`}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </button>
  );
};

export function AdminSidebar({
  activeView,
  onViewChange,
  notificationCount = 0,
  pendingGianHangCount = 0,
  complaintOrderCount = 0,
  pendingPreOrderCount = 0,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [adminName, setAdminName] = useState('Admin');
  const [adminRole, setAdminRole] = useState('Super Admin');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('taphoammo_demo_role');
    if (storedRole === 'admin') {
      setAdminRole('Admin');
      setAdminName('Admin');
    } else if (storedRole === 'super_admin') {
      setAdminRole('Super Admin');
      setAdminName('Super Admin');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white border-r border-slate-100 flex flex-col h-full select-none"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
            <LayoutDashboard size={20} className="text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-slate-900 truncate">TapHoammo</h2>
              <p className="text-[10px] text-slate-400 font-medium">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-3 pb-2">
        <button
          type="button"
          title="Quay lại khu vực quản trị chính (gian hàng, đơn hàng…)"
          onClick={() => navigate('/admin/gian-hang')}
          className={`w-full flex items-center gap-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-all ${
            isCollapsed ? 'justify-center p-2.5' : 'px-3 py-2.5'
          }`}
        >
          <ArrowLeft size={16} className="shrink-0" />
          {!isCollapsed && <span className="text-left truncate">Admin Console</span>}
        </button>
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border-none rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {MENU_ITEMS.map((item) => {
          if (item.divider) {
            return !isCollapsed ? (
              <div key={`divider-${item.id}`} className="my-3 border-t border-slate-100" />
            ) : null;
          }
          const itemForRow =
            item.id === 'notifications'
              ? { ...item, badge: notificationCount }
              : item.id === 'gian-hang-approval'
                ? { ...item, badge: pendingGianHangCount }
                : item.id === 'complaint-orders'
                  ? { ...item, badge: complaintOrderCount }
                  : item.id === 'product-orders'
                    ? { ...item, badge: pendingPreOrderCount }
                    : item;
          return (
            <SidebarItem
              item={itemForRow}
              active={activeView === item.id}
              collapsed={isCollapsed}
              onClick={() => onViewChange(item.id)}
            />
          );
        })}
      </nav>

      {/* Notification badge indicator */}
      {notificationCount > 0 && activeView !== 'notifications' && (
        <div className="px-4 py-2">
          <button
            type="button"
            title={isCollapsed ? 'Thông báo' : undefined}
            onClick={() => onViewChange('notifications')}
            className={`w-full flex items-center rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all ${
              isCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-4 py-2.5'
            }`}
          >
            <Bell size={18} />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">Thông báo</span>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                  {notificationCount}
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Profile */}
      <div className="p-3 border-t border-slate-100">
        <div
          ref={profileRef}
          className={`relative ${isCollapsed ? '' : ''}`}
        >
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl flex items-center justify-center shadow shrink-0">
              <span className="text-white text-xs font-bold">{adminName[0]}</span>
            </div>
            {!isCollapsed && (
              <>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{adminName}</p>
                  <p className="text-[10px] text-slate-400">{adminRole}</p>
                </div>
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                />
              </>
            )}
          </button>

          <AnimatePresence>
            {showProfileMenu && !isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50"
              >
                <div className="px-3 py-2 border-b border-slate-50">
                  <p className="text-xs font-bold text-slate-900">{adminName}</p>
                  <p className="text-[10px] text-slate-400">{adminRole} @taphoammo</p>
                </div>
                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                  <MoreHorizontal size={16} />
                  <span>Cài đặt</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('taphoammo_demo_role');
                    window.location.reload();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center mt-1 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all ${
            isCollapsed ? 'justify-center p-2.5' : 'justify-center gap-2 p-2 text-xs'
          }`}
        >
          {isCollapsed ? (
            <PanelLeft size={18} className="shrink-0" aria-hidden />
          ) : (
            <>
              <PanelLeftClose size={16} className="shrink-0" aria-hidden />
              <span>Thu gọn</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
