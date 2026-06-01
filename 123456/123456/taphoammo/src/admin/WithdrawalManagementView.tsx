/**
 * WithdrawalManagementView - Quản lý rút tiền
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  QrCode,
  MoreHorizontal,
  X,
  CheckCircle2,
  XCircle,
  UserCircle2,
  FileText,
} from 'lucide-react';
import { WITHDRAWAL_REQUESTS } from './data';
import type { WithdrawalRequest } from './types';

const QRCodeModal = ({ request, onClose }: { request: WithdrawalRequest; onClose: () => void }) => {
  const parts = request.bankAccount.split(' - ');
  const accountNo = parts[0] || '';
  const bankId = parts[1] || '';
  const amount = request.amount.replace(/[^0-9]/g, '');
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.jpg?amount=${amount}&addInfo=${request.id}&accountName=${encodeURIComponent(request.fullName)}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Mã QR Thanh toán</h3>
            <p className="text-xs text-slate-400 font-medium">Quét để chuyển khoản nhanh</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-4 bg-emerald-500/5 rounded-[40px] blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
            <div className="relative bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
              <img src={qrUrl} alt="QR Code" className="w-48 h-48 object-contain" onError={(e) => { (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(`ST:${accountNo};TA:${bankId};AM:${amount};NT:QR;RA:${request.fullName}`)}`; }} />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-900">{request.fullName}</p>
            <p className="text-xs text-slate-500">{request.bankAccount}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 w-full text-center">
            <p className="text-xs text-slate-400 font-medium mb-1">Số tiền cần chuyển</p>
            <p className="text-2xl font-extrabold text-blue-600">{request.amount}</p>
            <p className="text-[10px] text-slate-400 mt-1">{request.id} · {request.username}</p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-50">
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${request.amount} -> ${request.bankAccount} (${request.fullName})`);
            }}
            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm"
          >
            Sao chép thông tin
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export function WithdrawalManagementView() {
  const [selectedQR, setSelectedQR] = useState<WithdrawalRequest | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRequests = useMemo(() => {
    return WITHDRAWAL_REQUESTS.filter((req) => {
      const matchesSearch =
        req.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.bankAccount.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'Tất cả' || req.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const pa = a.status === 'Chờ duyệt' ? 0 : 1;
      const pb = b.status === 'Chờ duyệt' ? 0 : 1;
      return pa - pb;
    });
  }, [searchQuery, statusFilter]);

  const statusStyles: Record<string, string> = {
    'Hoàn thành': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'Chờ duyệt': 'bg-amber-50 text-amber-600 border-amber-100',
    'Đang xử lý': 'bg-blue-50 text-blue-600 border-blue-100',
    'Từ chối': 'bg-red-50 text-red-600 border-red-100',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 w-full h-full overflow-y-auto"
    >
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Quản lý rút tiền</h2>
          <p className="text-slate-500 text-sm">Danh sách các yêu cầu rút tiền từ gian hàng</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto min-w-[160px] text-xs font-bold text-slate-700 bg-slate-50 border-2 border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400"
          >
            <option value="Tất cả">Tất cả</option>
            <option value="Chờ duyệt">Chờ duyệt</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Từ chối">Từ chối</option>
          </select>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản, tên, STK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>
      </header>

      <section className="bg-white rounded-3xl border border-slate-100 shadow-sm min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-6 py-4 border-r border-slate-100">Mã / Thời gian</th>
                <th className="px-4 py-4 border-r border-slate-100">Tài khoản</th>
                <th className="px-4 py-4 border-r border-slate-100">Thông tin thụ hưởng</th>
                <th className="px-4 py-4 border-r border-slate-100">Số tiền</th>
                <th className="px-4 py-4 border-r border-slate-100">Số dư / Đã rút</th>
                <th className="px-4 py-4 border-r border-slate-100 text-center">Khiếu nại</th>
                <th className="px-4 py-4 border-r border-slate-100 text-center">Trạng thái</th>
                <th className="px-4 py-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req, idx) => (
                  <motion.tr
                    key={req.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 border-r border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 mb-1">{req.id}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{req.time}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r border-slate-100">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-blue-700 bg-blue-50/50 px-2 py-0.5 rounded-md border border-blue-100 shadow-sm w-fit mb-1.5 uppercase tracking-widest">{req.username}</span>
                        <span className="text-[11px] text-slate-500 font-medium">{req.accountName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r border-slate-100">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{req.fullName}</span>
                          <span className="text-[11px] text-slate-500 font-medium">{req.bankAccount}</span>
                        </div>
                        <button
                          onClick={() => setSelectedQR(req)}
                          className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-100"
                          title="Lấy mã QR"
                        >
                          <QrCode size={18} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r border-slate-100">
                      <span className="text-sm font-bold text-red-600">{req.amount}</span>
                    </td>
                    <td className="px-4 py-4 border-r border-slate-100">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Số dư:</span>
                          <span className="text-xs font-bold text-emerald-600">{req.currentBalance}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Đã rút:</span>
                          <span className="text-xs font-bold text-slate-600">{req.totalWithdrawn}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Tiền tạm giữ:</span>
                          <span className="text-xs font-bold text-amber-600">{req.heldFunds}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r border-slate-100 text-center">
                      <div className="flex flex-col items-center">
                        <div className="text-xs font-bold text-slate-700">Tổng: {req.totalComplaints}</div>
                        {req.activeComplaints > 0 ? (
                          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-1 animate-pulse">
                            Đang bị: {req.activeComplaints}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full mt-1">
                            Không có
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 border-r border-slate-100 text-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${statusStyles[req.status] || 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center relative">
                      <div className="flex items-center justify-center">
                        <div className="relative" ref={dropdownRef}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === req.id ? null : req.id);
                            }}
                            className={`p-2 rounded-xl transition-all ${activeDropdown === req.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-900'}`}
                          >
                            <MoreHorizontal size={20} />
                          </button>
                          <AnimatePresence>
                            {activeDropdown === req.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: idx >= filteredRequests.length - 2 ? -10 : 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: idx >= filteredRequests.length - 2 ? -10 : 10 }}
                                className={`absolute right-0 ${idx >= filteredRequests.length - 2 ? 'bottom-full mb-2' : 'top-full mt-2'} w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 py-2 overflow-hidden`}
                              >
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                  <UserCircle2 size={18} className="text-slate-400" /> Thông tin người rút
                                </button>
                                <div className="h-px bg-slate-50 my-1 mx-2" />
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50 transition-colors">
                                  <CheckCircle2 size={18} /> Phê duyệt
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">
                                  <XCircle size={18} /> Từ chối
                                </button>
                                <div className="h-px bg-slate-50 my-1 mx-2" />
                                <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                                  <FileText size={18} className="text-slate-400" /> Ghi chú admin
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 italic">
                    Không tìm thấy yêu cầu rút tiền nào phù hợp
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AnimatePresence>
        {selectedQR && <QRCodeModal request={selectedQR} onClose={() => setSelectedQR(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
