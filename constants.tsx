import React from 'react';
import { Shape, ColorTheme } from './types';
import { 
  FileText, Star, Heart, Zap, Coffee, Sun, Moon, Cloud, 
  Music, Camera, MapPin, Smile, Folder as FolderIcon,
  Book, Anchor, Feather, Key, Gift, Bell, Crown, 
  Gamepad, Headphones, Umbrella, Scissors,
  // Science & Academic
  Atom, FlaskConical, Dna, Microscope, Calculator, 
  Sigma, Brain, Globe, Hourglass, Compass, Telescope, GraduationCap
} from 'lucide-react';

// SOLID COLORS - MATERIAL YOU STYLE
export const LIGHT_COLORS: Record<ColorTheme, string> = {
  rose: 'bg-rose-300 text-rose-950',
  blue: 'bg-blue-300 text-blue-950',
  green: 'bg-green-300 text-green-950',
  yellow: 'bg-amber-300 text-amber-950',
  violet: 'bg-violet-300 text-violet-950',
  orange: 'bg-orange-300 text-orange-950',
  slate: 'bg-slate-300 text-slate-950',
  teal: 'bg-teal-300 text-teal-950',
  cyan: 'bg-cyan-300 text-cyan-950',
  lime: 'bg-lime-300 text-lime-950',
  fuchsia: 'bg-fuchsia-300 text-fuchsia-950',
  emerald: 'bg-emerald-300 text-emerald-950',
  indigo: 'bg-indigo-300 text-indigo-950',
  stone: 'bg-stone-300 text-stone-950',
  neutral: 'bg-neutral-300 text-neutral-950',
  mint: 'bg-emerald-200 text-emerald-900',
  graphite: 'bg-zinc-400 text-zinc-950',
  cherry: 'bg-red-300 text-red-950',
  gold: 'bg-yellow-400 text-yellow-950',
  lavender: 'bg-purple-300 text-purple-950',
  sky: 'bg-sky-300 text-sky-950',
  salmon: 'bg-red-200 text-red-950',
  charcoal: 'bg-gray-400 text-gray-950',
  coffee: 'bg-amber-400 text-amber-950',
  lilac: 'bg-fuchsia-200 text-fuchsia-950',
};

// Dark: Deep Solids
export const DARK_COLORS: Record<ColorTheme, string> = {
  rose: 'bg-rose-800 text-rose-50',
  blue: 'bg-blue-800 text-blue-50',
  green: 'bg-green-800 text-green-50',
  yellow: 'bg-amber-700 text-amber-50',
  violet: 'bg-violet-800 text-violet-50',
  orange: 'bg-orange-800 text-orange-50',
  slate: 'bg-slate-700 text-slate-50',
  teal: 'bg-teal-800 text-teal-50',
  cyan: 'bg-cyan-800 text-cyan-50',
  lime: 'bg-lime-800 text-lime-50',
  fuchsia: 'bg-fuchsia-800 text-fuchsia-50',
  emerald: 'bg-emerald-800 text-emerald-50',
  indigo: 'bg-indigo-800 text-indigo-50',
  stone: 'bg-stone-800 text-stone-50',
  neutral: 'bg-neutral-800 text-neutral-50',
  mint: 'bg-emerald-900 text-emerald-50',
  graphite: 'bg-zinc-700 text-zinc-50',
  cherry: 'bg-red-900 text-red-50',
  gold: 'bg-yellow-700 text-yellow-50',
  lavender: 'bg-purple-900 text-purple-50',
  sky: 'bg-sky-800 text-sky-50',
  salmon: 'bg-red-900 text-red-50',
  charcoal: 'bg-gray-700 text-gray-50',
  coffee: 'bg-amber-800 text-amber-50',
  lilac: 'bg-fuchsia-900 text-fuchsia-50',
};

export const SHAPES: Shape[] = [
  'rounded-3xl', 
  'rounded-t-[3rem] rounded-b-2xl', 
  'rounded-tr-[4rem] rounded-bl-[4rem] rounded-tl-xl rounded-br-xl', 
  'rounded-tl-[4rem] rounded-br-[4rem] rounded-tr-xl rounded-bl-xl', 
  'rounded-tl-[2.5rem] rounded-br-[2.5rem] rounded-tr-xl rounded-bl-xl', 
  'rounded-t-xl rounded-b-[4rem]', 
  'rounded-l-xl rounded-r-[4rem]', 
  'rounded-tl-3xl rounded-br-3xl rounded-tr-md rounded-bl-md', 
  'rounded-[2rem] rounded-tr-none', 
  'rounded-[2.5rem] rounded-bl-none', 
  'rounded-[3rem] rounded-t-lg', 
  'rounded-[1.5rem] rounded-tr-[5rem]', 
  'rounded-2xl', 
  'rounded-none rounded-tr-3xl rounded-bl-3xl',
  'rounded-[4rem] rounded-tr-none rounded-bl-none', 
  'rounded-t-full rounded-b-lg', 
  'rounded-b-full rounded-t-lg', 
  'rounded-tl-[3rem] rounded-br-[3rem] rounded-tr-none rounded-bl-none', 
  'rounded-[2rem] rounded-tl-none rounded-br-none', 
  'rounded-l-[3rem] rounded-r-lg', 
  'rounded-r-[3rem] rounded-l-lg', 
  'rounded-[3rem] rounded-br-lg', 
  'rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-[4rem]', 
  'rounded-tl-2xl rounded-tr-2xl rounded-br-2xl rounded-bl-[4rem]', 
  'rounded-lg', 
  'rounded-[50px]'
];

export const ICONS: Record<string, React.ElementType> = {
  'file-text': FileText, 'star': Star, 'heart': Heart, 'zap': Zap, 'coffee': Coffee, 
  'sun': Sun, 'moon': Moon, 'cloud': Cloud, 'music': Music, 'camera': Camera, 
  'map-pin': MapPin, 'smile': Smile, 'folder': FolderIcon, 'book': Book, 
  'anchor': Anchor, 'feather': Feather, 'key': Key, 'gift': Gift, 'bell': Bell, 
  'crown': Crown, 'gamepad': Gamepad, 'headphones': Headphones, 'umbrella': Umbrella, 
  'scissors': Scissors,
  'atom': Atom, 'flask': FlaskConical, 'dna': Dna, 'microscope': Microscope, 
  'calculator': Calculator, 'sigma': Sigma, 'brain': Brain, 'globe': Globe, 
  'hourglass': Hourglass, 'compass': Compass, 'telescope': Telescope, 
  'grad-cap': GraduationCap
};
