import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  Folder,
  Package,
  Layout,
  Calendar,
  Users,
  ChevronDown,
  ShoppingBag,
  Trash2,
  Plus,
  Search,
  Copy,
  Download,
  CheckSquare,
  Square,
  Maximize2,
  Minimize2,
  X,
  FileText,
  Code,
} from 'lucide-react';
import { StatusBadge } from './CategorySection';
import { formatGianHangDisplayDate } from './categorySectionUtils';
import type { Category, Product, WarehouseItem } from './types';

export interface WarehouseViewProps {
  product: Product;
  category: Category;
  onBack: () => void;
  onUpdateProduct: (product: Product) => void;
}

export function WarehouseView({
  product,
  category,
  onBack,
  onUpdateProduct,
}: WarehouseViewProps) {
  const [search, setSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addMethod, setAddMethod] = useState<'single' | 'multiple' | 'file' | 'api'>('single');
  const [newContent, setNewContent] = useState('');

  const items = product.warehouseItems || [];
  const filteredItems = items.filter(item => 
    item.id.toLowerCase().includes(search.toLowerCase()) || 
    item.content.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedItems.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(i => i.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleExpandItem = (id: string) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(i => i.id !== id);
    onUpdateProduct({ ...product, warehouseItems: updatedItems, stock: updatedItems.length });
  };

  const handleDeleteSelected = () => {
    const updatedItems = items.filter(i => !selectedItems.includes(i.id));
    onUpdateProduct({ ...product, warehouseItems: updatedItems, stock: updatedItems.length });
    setSelectedItems([]);
  };

  const handleDeleteAll = () => {
    onUpdateProduct({ ...product, warehouseItems: [], stock: 0 });
    setSelectedItems([]);
  };

  const handleCopySelected = () => {
    const itemsToCopy = selectedItems.length > 0 
      ? items.filter(i => selectedItems.includes(i.id))
      : items;
    
    if (itemsToCopy.length === 0) return;

    const content = itemsToCopy.map(i => i.content).join('\n');
    navigator.clipboard.writeText(content);
    // Using a simple notification style since we can't use alert()
  };

  const handleExportTxt = () => {
    const itemsToExport = selectedItems.length > 0 
      ? items.filter(i => selectedItems.includes(i.id))
      : items;
    
    if (itemsToExport.length === 0) return;

    const content = itemsToExport.map(i => i.content).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warehouse_export_${product.name}_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddItems = () => {
    let newItems: WarehouseItem[] = [];
    if (addMethod === 'single') {
      newItems = [{ id: `WH-${Date.now()}`, content: newContent, time: new Date().toLocaleString() }];
    } else if (addMethod === 'multiple' || addMethod === 'file') {
      const lines = newContent.split('\n').filter(l => l.trim());
      newItems = lines.map((line, idx) => ({
        id: `WH-${Date.now()}-${idx}`,
        content: line,
        time: new Date().toLocaleString()
      }));
    }
    
    const updatedItems = [...items, ...newItems];
    onUpdateProduct({ ...product, warehouseItems: updatedItems, stock: updatedItems.length });
    setNewContent('');
    setIsAddModalOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      {/* Visual Hierarchy from Image */}
      <div className="space-y-0.5">
        {/* Thanh tiêu đề — nền sáng đồng bộ admin */}
        <div className="bg-white border border-slate-200 text-slate-900 p-2 px-4 rounded-t-xl flex items-center justify-between shadow-sm relative z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all mr-1"
              title="Quay lại"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <Folder size={16} />
            </div>
            <h2 className="text-sm font-bold text-slate-900 font-display tracking-tight">
              {category.isParent ? category.name : 'Quản lý kho hệ thống'}
            </h2>
          </div>
        </div>

        {/* Product Group Bar (White) */}
        <div className="bg-white p-3 px-4 flex items-center justify-between border-x border-slate-200 shadow-sm relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm text-white shrink-0">
              <Package size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-display">{category.name}</h3>
                <div className="flex gap-1">
                  {category.tags?.map((tag, idx) => (
                    <span key={`${tag}-${idx}`} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded border border-emerald-100 uppercase tracking-wider">
                      {tag}
                    </span>
                  )) || (
                    <>
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded border border-emerald-200 uppercase tracking-wider">TRÙNG</span>
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded border border-emerald-200 uppercase tracking-wider">RESELLER</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium mt-0.5">
                <span className="flex items-center gap-1">
                  <Layout size={10} className="text-blue-500" /> 
                  {category.classification?.product.split(' (')[0] || category.platform || 'Danh mục'}
                </span>
                <span className="text-slate-200 opacity-50">|</span>
                <span className="flex items-center gap-1 tabular-nums">
                  <Calendar size={10} className="text-blue-500" /> 
                  {formatGianHangDisplayDate(category.date) || '10/10/2025 10:30'}
                </span>
                <span className="text-slate-200 opacity-50">|</span>
                <span className="flex items-center gap-1 text-blue-600 font-bold" title="Tên người bán hàng">
                  <Users size={10} /> 
                  {category.sellerDisplayName?.trim() || category.createdByName?.trim() || '—'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <button className="p-1 text-slate-300"><ChevronDown size={16} /></button>
          </div>
        </div>

        {/* Product Details Row (Mimicking main table) */}
        <div className="bg-white border border-slate-200 rounded-b-xl overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">Tên mặt hàng</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 w-32">Đơn giá</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 w-24">Tồn kho</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 w-24">Đã bán</th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display w-32">Trạng thái</th>
              </tr>
            </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="py-4 px-4 border-r border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                        <Package size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-blue-600 truncate">{product.name}</div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">ID: {product.id}</span>
                          <span className="flex items-center gap-1"><Calendar size={10} /> {product.date}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm font-bold text-slate-900 font-display border-r border-slate-200">{product.price}</td>
                  <td className="py-4 px-4 text-sm font-semibold text-slate-600 border-r border-slate-200">{product.stock.toLocaleString()}</td>
                  <td className="py-4 px-4 text-sm font-semibold text-blue-600 border-r border-slate-200">{product.sold.toLocaleString()}</td>
                  <td className="py-4 px-4">
                    <StatusBadge status={product.status} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Warehouse Items Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">Danh sách sản phẩm trong kho</h3>
              <p className="text-[10px] text-slate-500 font-medium">Quản lý nội dung tài khoản, mã code hoặc dữ liệu bán hàng</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus size={16} />
              Thêm sản phẩm mới
            </button>
          </div>
        </div>

        {/* Search & Bulk Actions */}
        <div className="p-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo ID hoặc nội dung..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border border-slate-200/50 rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            {selectedItems.length > 0 && (
              <>
                <button 
                  onClick={handleCopySelected}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100 hover:bg-blue-100 transition-all"
                >
                  <Copy size={14} />
                  Sao chép ({selectedItems.length})
                </button>
                <button 
                  onClick={handleExportTxt}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100 hover:bg-emerald-100 transition-all"
                >
                  <Download size={14} />
                  Xuất TXT ({selectedItems.length})
                </button>
                <button 
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold border border-rose-100 hover:bg-rose-100 transition-all"
                >
                  <Trash2 size={14} />
                  Xóa ({selectedItems.length})
                </button>
              </>
            )}
            {selectedItems.length === 0 && items.length > 0 && (
              <>
                <button 
                  onClick={handleCopySelected}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  <Copy size={14} />
                  Sao chép tất cả
                </button>
                <button 
                  onClick={handleExportTxt}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-100 transition-all"
                >
                  <Download size={14} />
                  Xuất TXT
                </button>
              </>
            )}
            <button 
              onClick={handleDeleteAll}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-200 transition-all"
            >
              <Trash2 size={14} />
              Xóa tất cả
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[920px]">
            <colgroup>
              <col style={{ width: 48 }} />
              <col style={{ width: 56 }} />
              <col style={{ width: 80 }} />
              <col style={{ width: 200 }} />
              <col />
              <col style={{ width: 168 }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="py-4 pl-4 pr-2 border-r border-slate-200">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    title="Chọn tất cả"
                    className={`p-1 rounded transition-colors ${
                      filteredItems.length > 0 && selectedItems.length === filteredItems.length
                        ? 'text-blue-600'
                        : 'text-slate-300 hover:text-slate-500'
                    }`}
                  >
                    {filteredItems.length > 0 && selectedItems.length === filteredItems.length ? (
                      <CheckSquare size={18} />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center">
                  STT
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200 text-center">
                  Hành động
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">
                  ID
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display border-r border-slate-200">
                  Sản phẩm (nội dung)
                </th>
                <th className="py-4 px-4 text-[11px] font-bold text-slate-600 uppercase tracking-[0.15em] font-display text-right">
                  Thời gian
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, idx) => (
                <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors group ${selectedItems.includes(item.id) ? 'bg-blue-50/30' : ''}`}>
                  <td className="py-4 pl-4 pr-2 border-r border-slate-100 align-middle">
                    <button
                      type="button"
                      onClick={() => toggleSelectItem(item.id)}
                      className={`p-1 rounded transition-colors ${selectedItems.includes(item.id) ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                      {selectedItems.includes(item.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-xs font-bold text-slate-500 tabular-nums text-center border-r border-slate-100 align-middle">
                    {idx + 1}
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 text-center align-middle">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      title="Xóa dòng kho"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all inline-flex"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 align-middle max-w-0">
                    <span
                      title={item.id}
                      className="block text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 truncate max-w-full"
                    >
                      {item.id}
                    </span>
                  </td>
                  <td className="py-4 px-4 border-r border-slate-100 align-middle">
                    <div className="flex flex-col gap-1">
                      <div className={`text-xs font-medium text-slate-600 bg-slate-100/80 p-3 rounded-xl border border-slate-200/50 relative overflow-hidden transition-all ${expandedItems.includes(item.id) ? 'max-h-none whitespace-normal' : 'max-h-12 truncate whitespace-nowrap'}`}>
                        {item.content}
                        {!expandedItems.includes(item.id) && item.content.length > 50 && (
                          <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-slate-100/80 to-transparent" />
                        )}
                      </div>
                      {item.content.length > 50 && (
                        <button 
                          onClick={() => toggleExpandItem(item.id)}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 w-fit mt-1"
                        >
                          {expandedItems.includes(item.id) ? (
                            <><Minimize2 size={10} /> Thu gọn</>
                          ) : (
                            <><Maximize2 size={10} /> Mở rộng</>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 align-middle">
                    <div className="flex items-center justify-end gap-2 text-[10px] text-slate-400 font-medium tabular-nums">
                      <Calendar size={12} className="shrink-0" />
                      {item.time}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Package size={40} className="opacity-20" />
                      <p className="text-sm font-medium">Không tìm thấy sản phẩm nào trong kho</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-50/50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Showing 1-{filteredItems.length} of {filteredItems.length} products
          </div>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Previous</button>
            <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/20">1</button>
            <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors">2</button>
            <button className="w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors">3</button>
            <button className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl relative overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 font-display">Thêm sản phẩm vào kho</h3>
                    <p className="text-xs text-slate-500 font-medium">{product.name}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  {(['single', 'multiple', 'file', 'api'] as const).map((method) => (
                    <button 
                      key={method}
                      onClick={() => setAddMethod(method)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-all duration-300 relative ${
                        addMethod === method ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {addMethod === method && (
                        <motion.div 
                          layoutId="add-method-active"
                          className="absolute inset-0 bg-white rounded-lg shadow-sm"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        {method === 'single' && <Plus size={14} />}
                        {method === 'multiple' && <FileText size={14} />}
                        {method === 'file' && <Download size={14} />}
                        {method === 'api' && <Code size={14} />}
                        {method === 'single' ? 'Thêm từng cái' : method === 'multiple' ? 'Thêm nhiều' : method === 'file' ? 'Thêm tệp txt' : 'Nhập bằng API'}
                      </span>
                    </button>
                  ))}
                </div>

                {addMethod === 'api' ? (
                  <div className="p-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                    <Code size={40} className="mx-auto text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Tính năng nhập bằng API đang được phát triển</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                      {addMethod === 'single' ? 'Nội dung sản phẩm' : 'Danh sách sản phẩm (Mỗi dòng 1 sản phẩm)'}
                    </label>
                    <textarea 
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder={addMethod === 'single' ? 'Nhập nội dung tài khoản...' : 'uid|pass|2fa|email|passmail\nuid|pass|2fa|email|passmail...'}
                      className="w-full h-40 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none resize-none"
                    />
                    {addMethod === 'file' && (
                      <div className="flex items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                        <div className="text-center">
                          <Download size={32} className="mx-auto text-slate-300 group-hover:text-blue-500 transition-colors mb-2" />
                          <p className="text-xs font-bold text-slate-500">Kéo thả tệp .txt vào đây hoặc nhấp để chọn</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleAddItems}
                  disabled={!newContent && addMethod !== 'api'}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  Xác nhận thêm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}