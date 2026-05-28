/**
 * Иконки Bootstrap Icons (доступны на flaticon.com/packs/bootstrap-icons-8)
 * + Font Awesome и Material Design для иконок, отсутствующих в Bootstrap.
 */
import type { IconBaseProps, IconType } from 'react-icons';
import {
  BsActivity,
  BsExclamationCircle,
  BsArrowLeft,
  BsArrowRight,
  BsAward,
  BsBarChart,
  BsCalendar3,
  BsCheck2,
  BsCheckCircle,
  BsCheckCircleFill,
  BsChevronDown,
  BsChevronUp,
  BsClipboardCheck,
  BsEye,
  BsEyeSlash,
  BsFileText,
  BsFire,
  BsHeart,
  BsGrid,
  BsLightbulb,
  BsLink45Deg,
  BsLock,
  BsBoxArrowRight,
  BsEnvelope,
  BsList,
  BsDash,
  BsMoon,
  BsPencil,
  BsPlus,
  BsArrowClockwise,
  BsSearch,
  BsGear,
  BsShieldExclamation,
  BsShieldCheck,
  BsShieldSlash,
  BsStars,
  BsStar,
  BsBullseye,
  BsTrash3,
  BsGraphDownArrow,
  BsGraphUpArrow,
  BsUpload,
  BsPerson,
  BsPersonCheck,
  BsPersonPlus,
  BsPeople,
  BsPersonWalking,
  BsWifiOff,
  BsX,
  BsXCircle,
  BsLightning,
  BsHouseDoor,
} from 'react-icons/bs';
import { FaBrain, FaWeightHanging } from 'react-icons/fa';
import { MdLinkOff } from 'react-icons/md';

export type IconProps = IconBaseProps;
export type AppIcon = IconType;
export type LucideIcon = AppIcon;

export const Activity = BsActivity;
export const AlertCircle = BsExclamationCircle;
export const ArrowLeft = BsArrowLeft;
export const ArrowRight = BsArrowRight;
export const Award = BsAward;
export const BarChart3 = BsBarChart;
export const Brain = FaBrain;
export const Calendar = BsCalendar3;
export const Check = BsCheck2;
export const CheckCircle = BsCheckCircle;
export const CheckCircle2 = BsCheckCircleFill;
export const ChevronDown = BsChevronDown;
export const ChevronUp = BsChevronUp;
export const ClipboardList = BsClipboardCheck;
export const Eye = BsEye;
export const EyeOff = BsEyeSlash;
export const FileText = BsFileText;
export const Flame = BsFire;
export const Footprints = BsPersonWalking;
export const Heart = BsHeart;
export const LayoutDashboard = BsGrid;
export const Lightbulb = BsLightbulb;
export const Link2 = BsLink45Deg;
export const Link2Off = MdLinkOff;
export const Lock = BsLock;
export const LogOut = BsBoxArrowRight;
export const Mail = BsEnvelope;
export const Menu = BsList;
export const Minus = BsDash;
export const Moon = BsMoon;
export const Pencil = BsPencil;
export const Plus = BsPlus;
export const RefreshCw = BsArrowClockwise;
export const Search = BsSearch;
export const Settings = BsGear;
export const ShieldAlert = BsShieldExclamation;
export const ShieldCheck = BsShieldCheck;
export const ShieldOff = BsShieldSlash;
export const Sparkles = BsStars;
export const Star = BsStar;
export const Target = BsBullseye;
export const Trash2 = BsTrash3;
export const TrendingDown = BsGraphDownArrow;
export const TrendingUp = BsGraphUpArrow;
export const Upload = BsUpload;
export const User = BsPerson;
export const UserCheck = BsPersonCheck;
export const UserPlus = BsPersonPlus;
export const Users = BsPeople;
export const Weight = FaWeightHanging;
export const WifiOff = BsWifiOff;
export const X = BsX;
export const XCircle = BsXCircle;
export const Zap = BsLightning;
export const Home = BsHouseDoor;

export function Loader2({ className, style, ...props }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      style={style}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  );
}
