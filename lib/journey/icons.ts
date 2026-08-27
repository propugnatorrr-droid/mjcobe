import {
  Music2, Users, DollarSign, Landmark, Star, Camera, Disc,
  Headphones, Eye, FolderOpen, Lock, FileText, type LucideIcon,
} from 'lucide-react';

const JOURNEY_ICONS: Record<string, LucideIcon> = {
  preview_uploaded: Music2,
  supporter_milestone: Users,
  funding_milestone: DollarSign,
  new_top_sponsor: Landmark,
  new_top_supporter: Star,
  production_update: Camera,
  release: Disc,
  video_release: Camera,
  stream_milestone: Headphones,
  view_milestone: Eye,
  campaign_opened: FolderOpen,
  campaign_closed: Lock,
  manual: FileText,
};

export function journeyIcon(kind: string): LucideIcon {
  return JOURNEY_ICONS[kind] ?? FileText;
}
