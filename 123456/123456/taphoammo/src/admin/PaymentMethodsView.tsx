/**
 * PaymentMethodsView - Phương thức thanh toán
 */

import { motion } from 'motion/react';
import { CreditCard, Check, Plus, Smartphone, Building, QrCode } from 'lucide-react';

const METHODS = [
  { id: 'vnpay', name: 'VNPay', desc: 'Thanh toán qua cổng VNPay', icon: CreditCard, status: 'active', color: 'bg-blue-50 text-blue-600' },
  { id: 'mbbank', name: 'Ngân hàng MB', desc: 'Chuyển khoản qua MB Bank', icon: Building, status: 'active', color: 'bg-emerald-50 text-emerald-600' },
  { id: 'vietqr', name: 'VietQR', desc: 'Quét mã QR để thanh toán', icon: QrCode, status: 'active', color: 'bg-purple-50 text-purple-600' },
  { id: 'manual', name: 'Manual', desc: 'Nạp tiền thủ công bởi admin', icon: Plus, status: 'active', color: 'bg-amber-50 text-amber-600' },
  { id: 'momo', name: 'MoMo', desc: 'Thanh toán qua ví MoMo', icon: Smartphone, status: 'inactive', color: 'bg-pink-50 text-pink-600' },
];

export function PaymentMethodsView() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-8 w-full h-full overflow-y-auto"
    >
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Phương thức thanh toán</h2>
          <p className="text-slate-500 text-sm">Quản lý các cổng thanh toán trên hệ thống</p>
        </div>
        <button className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2">
          <Plus size={16} /> Thêm phương thức
        </button>
      </header>

      <div className="grid gap-4">
        {METHODS.map((method, idx) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${method.color}`}>
              <method.icon size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-slate-900">{method.name}</h3>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                  method.status === 'active'
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {method.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{method.desc}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button className="px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                Chỉnh sửa
              </button>
              {method.status === 'active' ? (
                <button className="px-4 py-2 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all">
                  Tắt
                </button>
              ) : (
                <button className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1">
                  <Check size={12} /> Bật
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
