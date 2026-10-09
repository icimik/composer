import { FileText, ListTree, Users, Globe2, Feather } from 'lucide-react';
import type { Kind } from '../types';
import { previewBridge } from '../preview';
export const bridge = window.composer || previewBridge();
export const desktop = !!window.composer;
export const kinds: { id: Kind; label: string; icon: typeof FileText }[] = [
  { id: 'chapter', label: '章节', icon: FileText },
  { id: 'outline', label: '大纲', icon: ListTree },
  { id: 'character', label: '人物', icon: Users },
  { id: 'world', label: '世界观', icon: Globe2 },
  { id: 'style', label: '风格规范', icon: Feather }
];
export const checkLabels = [
  '推进目标明确',
  '人物动机一致',
  '冲突有实际后果',
  '章尾留下钩子',
  '中文表达自然'
];
export const stages = ['立项', '设定', '大纲', '样章', '写作', '审阅', '发布'];
export const cleanError = (e: unknown) =>
  String(e instanceof Error ? e.message : e).replace(
    /^Error invoking remote method '[^']+': Error: /,
    ''
  );
export const count = (text: string) => Array.from(text.replace(/\s/g, '')).length;
