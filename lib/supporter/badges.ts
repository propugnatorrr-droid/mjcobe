import {
  Sunrise, Crown, Medal, Star, Disc3, Clapperboard, Award, type LucideIcon,
} from 'lucide-react';

/** Badge marks, keyed to the badge rows the seed defines. Unknown keys fall
 * back to a generic award rather than rendering nothing. */
const BADGE_ICONS: Record<string, LucideIcon> = {
  supporter: Star,
  day_one: Sunrise,
  inner_circle: Medal,
  gold: Crown,
  founding: Crown,
  founding_100: Crown,
  executive: Award,
  top_ten: Medal,
  number_one: Star,
  album_one: Disc3,
  video_one: Clapperboard,
};

export function badgeIcon(key: string): LucideIcon {
  return BADGE_ICONS[key] ?? Award;
}
