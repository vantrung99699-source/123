import fs from 'fs';

const appPath = new URL('../src/App.tsx', import.meta.url);
const outPath = new URL('../src/admin/ProductOrdersView.tsx', import.meta.url);
const lines = fs.readFileSync(appPath, 'utf8').split(/\r?\n/);

const header = `import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Filter,
  ChevronDown,
  Search,
  MessageSquare,
  XCircle,
  Shield,
  Calendar,
  Users,
  Facebook,
  Music,
  Globe,
  Folder,
  Package,
  X,
  AlertCircle,
} from 'lucide-react';
import { compareOrdersNewestFirst, type Order, type OrderStatus } from '../ordersTypes';

export interface ProductOrdersViewProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  onOrderClick?: (id: string) => void;
}

export function ProductOrdersView({ onOrderClick, orders, setOrders }: ProductOrdersViewProps) {
`;

const inner = lines.slice(4921, 5385).join('\n');
fs.writeFileSync(outPath, header + inner + '\n}\n', 'utf8');
console.log('written', outPath.pathname);
