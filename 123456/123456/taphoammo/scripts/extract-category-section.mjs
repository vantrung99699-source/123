import fs from 'fs';
import path from 'path';

const appPath = path.join('src', 'App.tsx');
const lines = fs.readFileSync(appPath, 'utf8').split(/\r?\n/);
const slice = lines.slice(2467, 3047).join('\n');

const header = `/**
 * CategorySection, ProductRow, StatusBadge — dùng chung Admin Console & Admin Panel
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  LayoutDashboard,
  Users,
  Plus,
  ChevronDown,
  MoreVertical,
  Edit2,
  Trash2,
  Folder,
  Package,
  Calendar,
  Globe,
  Layout,
  GripVertical,
  Clock,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Gavel,
  Zap,
  FileText,
} from 'lucide-react';
import type { Category, Product, Status, BusinessLine } from './types';
import {
  formatGianHangDisplayDate,
  effectiveGianHangStatus,
  resolveGianHangBusinessLine,
  matchesAdminStatusTab,
} from './categorySectionUtils';

`;

let body = slice
  .replace(/^const StatusBadge/, 'export function StatusBadge')
  .replace(/^const ProductRow/, 'export function ProductRow')
  .replace(/^const ICON_MAP/, 'export const ICON_MAP')
  .replace(/^const CategorySection/, 'export function CategorySection');

const iconBlock = body.match(/export const ICON_MAP[\s\S]*?};\n\n/);
if (iconBlock) {
  body = body.replace(iconBlock[0], '');
}

const outDir = path.join('src', 'gianHang');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'CategorySection.tsx'),
  header + (iconBlock ? iconBlock[0] : '') + body
);
console.log('OK CategorySection.tsx');
