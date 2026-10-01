// Icon set for the whole site (Phosphor), exposed under the names the components already use.
import { forwardRef } from 'react';
import type { Icon as PhosphorIcon, IconProps } from '@phosphor-icons/react';
import {
  ArmchairIcon,
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  ArrowSquareOutIcon,
  ArrowUpIcon,
  ArrowUpRightIcon,
  ArrowsClockwiseIcon,
  ArrowsDownUpIcon,
  ArrowsInIcon,
  ArrowsLeftRightIcon,
  ArrowsOutIcon,
  ArrowsOutCardinalIcon,
  BatteryChargingIcon,
  BatteryFullIcon,
  BookOpenIcon,
  BookmarkSimpleIcon,
  BrainIcon,
  BuildingsIcon,
  CalculatorIcon,
  CalendarBlankIcon,
  CameraIcon,
  CaretDownIcon,
  CaretRightIcon,
  ChartBarIcon,
  ChartBarHorizontalIcon,
  ChartPieIcon,
  ChatTextIcon,
  CheckIcon,
  CheckCircleIcon,
  CircleNotchIcon,
  CircuitryIcon,
  ClockIcon,
  ClockCounterClockwiseIcon,
  CompassIcon,
  CopyIcon,
  CpuIcon,
  CrosshairIcon,
  CubeIcon,
  CurrencyDollarIcon,
  CurrencyInrIcon,
  DatabaseIcon,
  DeviceMobileIcon,
  DownloadSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  FanIcon,
  FastForwardIcon,
  FileArrowDownIcon,
  FileTextIcon,
  FilmStripIcon,
  FlameIcon,
  FolderOpenIcon,
  GameControllerIcon,
  GaugeIcon,
  GitDiffIcon,
  GitForkIcon,
  GitMergeIcon,
  HardDriveIcon,
  HardDrivesIcon,
  HeadphonesIcon,
  HeartIcon,
  InfoIcon,
  KeyboardIcon,
  LaptopIcon,
  LeafIcon,
  LightbulbIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  MedalIcon,
  MemoryIcon,
  MonitorIcon,
  MonitorPlayIcon,
  MoonIcon,
  MusicNoteIcon,
  PaletteIcon,
  PauseIcon,
  PencilSimpleIcon,
  PlayIcon,
  PlugIcon,
  PlusIcon,
  PlusCircleIcon,
  PowerIcon,
  PulseIcon,
  QrCodeIcon,
  QuestionIcon,
  RadioIcon,
  ScalesIcon,
  ScanIcon,
  ShareNetworkIcon,
  ShieldIcon,
  ShieldCheckIcon,
  ShieldWarningIcon,
  ShoppingBagIcon,
  SkullIcon,
  SlidersIcon,
  SlidersHorizontalIcon,
  SnowflakeIcon,
  SpeakerHighIcon,
  SpeakerXIcon,
  SquareIcon,
  SquaresFourIcon,
  StackIcon,
  StethoscopeIcon,
  StorefrontIcon,
  SunIcon,
  TableIcon,
  TagIcon,
  TargetIcon,
  TelevisionIcon,
  TerminalWindowIcon,
  ThermometerIcon,
  ThermometerColdIcon,
  TrashIcon,
  TrendDownIcon,
  TrendUpIcon,
  TrophyIcon,
  UploadSimpleIcon,
  UsbIcon,
  UsersIcon,
  VideoCameraIcon,
  WarningIcon,
  WarningCircleIcon,
  WarningOctagonIcon,
  WifiHighIcon,
  WindIcon,
  WrenchIcon,
  XIcon,
  XCircleIcon
} from '@phosphor-icons/react';

type SiteIconProps = Omit<IconProps, 'weight'> & { strokeWidth?: number | string; fill?: string };

function wrap(Base: PhosphorIcon, name: string) {
  const Wrapped = forwardRef<SVGSVGElement, SiteIconProps>(({ strokeWidth, fill, className, size = 24, ...rest }, ref) => (
    <Base
      ref={ref}
      size={size}
      // fill="currentColor" asked for a solid glyph; heavier strokes map to the bold weight
      weight={fill && fill !== 'none' ? 'fill' : Number(strokeWidth) >= 2.5 ? 'bold' : 'regular'}
      className={className ? `icon ${className}` : 'icon'}
      {...rest}
    />
  ));
  Wrapped.displayName = name;
  return Wrapped;
}

export const Activity = wrap(PulseIcon, 'Activity');
export const AlertCircle = wrap(WarningCircleIcon, 'AlertCircle');
export const AlertOctagon = wrap(WarningOctagonIcon, 'AlertOctagon');
export const AlertTriangle = wrap(WarningIcon, 'AlertTriangle');
export const Armchair = wrap(ArmchairIcon, 'Armchair');
export const ArrowLeftRight = wrap(ArrowsLeftRightIcon, 'ArrowLeftRight');
export const ArrowRight = wrap(ArrowRightIcon, 'ArrowRight');
export const ArrowUp = wrap(ArrowUpIcon, 'ArrowUp');
export const ArrowUpDown = wrap(ArrowsDownUpIcon, 'ArrowUpDown');
export const ArrowUpRight = wrap(ArrowUpRightIcon, 'ArrowUpRight');
export const Award = wrap(MedalIcon, 'Award');
export const BarChart2 = wrap(ChartBarIcon, 'BarChart2');
export const BarChart3 = wrap(ChartBarHorizontalIcon, 'BarChart3');
export const Battery = wrap(BatteryFullIcon, 'Battery');
export const BatteryCharging = wrap(BatteryChargingIcon, 'BatteryCharging');
export const BookOpen = wrap(BookOpenIcon, 'BookOpen');
export const Bookmark = wrap(BookmarkSimpleIcon, 'Bookmark');
export const Box = wrap(CubeIcon, 'Box');
export const Boxes = wrap(StackIcon, 'Boxes');
export const Brain = wrap(BrainIcon, 'Brain');
export const Building = wrap(BuildingsIcon, 'Building');
export const Cable = wrap(PlugIcon, 'Cable');
export const Calculator = wrap(CalculatorIcon, 'Calculator');
export const Calendar = wrap(CalendarBlankIcon, 'Calendar');
export const Camera = wrap(CameraIcon, 'Camera');
export const Check = wrap(CheckIcon, 'Check');
export const CheckCircle = wrap(CheckCircleIcon, 'CheckCircle');
export const CheckCircle2 = wrap(CheckCircleIcon, 'CheckCircle2');
export const ChevronDown = wrap(CaretDownIcon, 'ChevronDown');
export const ChevronRight = wrap(CaretRightIcon, 'ChevronRight');
export const Clock = wrap(ClockIcon, 'Clock');
export const Compass = wrap(CompassIcon, 'Compass');
export const Copy = wrap(CopyIcon, 'Copy');
export const Cpu = wrap(CpuIcon, 'Cpu');
export const Crosshair = wrap(CrosshairIcon, 'Crosshair');
export const Database = wrap(DatabaseIcon, 'Database');
export const DollarSign = wrap(CurrencyDollarIcon, 'DollarSign');
export const Download = wrap(DownloadSimpleIcon, 'Download');
export const Edit3 = wrap(PencilSimpleIcon, 'Edit3');
export const ExternalLink = wrap(ArrowSquareOutIcon, 'ExternalLink');
export const Eye = wrap(EyeIcon, 'Eye');
export const EyeOff = wrap(EyeSlashIcon, 'EyeOff');
export const Fan = wrap(FanIcon, 'Fan');
export const FastForward = wrap(FastForwardIcon, 'FastForward');
export const FileDown = wrap(FileArrowDownIcon, 'FileDown');
export const FileText = wrap(FileTextIcon, 'FileText');
export const Film = wrap(FilmStripIcon, 'Film');
export const Flame = wrap(FlameIcon, 'Flame');
export const FolderOpen = wrap(FolderOpenIcon, 'FolderOpen');
export const Gamepad2 = wrap(GameControllerIcon, 'Gamepad2');
export const Gauge = wrap(GaugeIcon, 'Gauge');
export const GitCompare = wrap(GitDiffIcon, 'GitCompare');
export const GitFork = wrap(GitForkIcon, 'GitFork');
export const GitMerge = wrap(GitMergeIcon, 'GitMerge');
export const HardDrive = wrap(HardDriveIcon, 'HardDrive');
export const Headphones = wrap(HeadphonesIcon, 'Headphones');
export const Heart = wrap(HeartIcon, 'Heart');
export const HelpCircle = wrap(QuestionIcon, 'HelpCircle');
export const History = wrap(ClockCounterClockwiseIcon, 'History');
export const IndianRupee = wrap(CurrencyInrIcon, 'IndianRupee');
export const Info = wrap(InfoIcon, 'Info');
export const Keyboard = wrap(KeyboardIcon, 'Keyboard');
export const Laptop = wrap(LaptopIcon, 'Laptop');
export const Layers = wrap(StackIcon, 'Layers');
export const LayoutGrid = wrap(SquaresFourIcon, 'LayoutGrid');
export const Leaf = wrap(LeafIcon, 'Leaf');
export const Lightbulb = wrap(LightbulbIcon, 'Lightbulb');
export const Loader2 = wrap(CircleNotchIcon, 'Loader2');
export const MapPin = wrap(MapPinIcon, 'MapPin');
export const Maximize2 = wrap(ArrowsOutIcon, 'Maximize2');
export const MemoryStick = wrap(MemoryIcon, 'MemoryStick');
export const MessageSquare = wrap(ChatTextIcon, 'MessageSquare');
export const Microchip = wrap(CircuitryIcon, 'Microchip');
export const Minimize2 = wrap(ArrowsInIcon, 'Minimize2');
export const Monitor = wrap(MonitorIcon, 'Monitor');
export const MonitorX = wrap(MonitorPlayIcon, 'MonitorX');
export const Moon = wrap(MoonIcon, 'Moon');
export const Move = wrap(ArrowsOutCardinalIcon, 'Move');
export const Music = wrap(MusicNoteIcon, 'Music');
export const Palette = wrap(PaletteIcon, 'Palette');
export const Pause = wrap(PauseIcon, 'Pause');
export const PieChart = wrap(ChartPieIcon, 'PieChart');
export const Play = wrap(PlayIcon, 'Play');
export const Plus = wrap(PlusIcon, 'Plus');
export const PlusCircle = wrap(PlusCircleIcon, 'PlusCircle');
export const Power = wrap(PowerIcon, 'Power');
export const QrCode = wrap(QrCodeIcon, 'QrCode');
export const Radio = wrap(RadioIcon, 'Radio');
export const RefreshCw = wrap(ArrowsClockwiseIcon, 'RefreshCw');
export const RotateCcw = wrap(ArrowCounterClockwiseIcon, 'RotateCcw');
export const RotateCw = wrap(ArrowClockwiseIcon, 'RotateCw');
export const Scale = wrap(ScalesIcon, 'Scale');
export const ScanLine = wrap(ScanIcon, 'ScanLine');
export const Search = wrap(MagnifyingGlassIcon, 'Search');
export const Server = wrap(HardDrivesIcon, 'Server');
export const Share2 = wrap(ShareNetworkIcon, 'Share2');
export const Shield = wrap(ShieldIcon, 'Shield');
export const ShieldAlert = wrap(ShieldWarningIcon, 'ShieldAlert');
export const ShieldCheck = wrap(ShieldCheckIcon, 'ShieldCheck');
export const ShoppingBag = wrap(ShoppingBagIcon, 'ShoppingBag');
export const Skull = wrap(SkullIcon, 'Skull');
export const Sliders = wrap(SlidersIcon, 'Sliders');
export const SlidersHorizontal = wrap(SlidersHorizontalIcon, 'SlidersHorizontal');
export const Smartphone = wrap(DeviceMobileIcon, 'Smartphone');
export const Snowflake = wrap(SnowflakeIcon, 'Snowflake');
export const Sparkles = wrap(CircuitryIcon, 'Sparkles');
export const Square = wrap(SquareIcon, 'Square');
export const Stethoscope = wrap(StethoscopeIcon, 'Stethoscope');
export const Store = wrap(StorefrontIcon, 'Store');
export const Sun = wrap(SunIcon, 'Sun');
export const TableProperties = wrap(TableIcon, 'TableProperties');
export const Tag = wrap(TagIcon, 'Tag');
export const Target = wrap(TargetIcon, 'Target');
export const Terminal = wrap(TerminalWindowIcon, 'Terminal');
export const Thermometer = wrap(ThermometerIcon, 'Thermometer');
export const ThermometerSnowflake = wrap(ThermometerColdIcon, 'ThermometerSnowflake');
export const Trash2 = wrap(TrashIcon, 'Trash2');
export const TrendingDown = wrap(TrendDownIcon, 'TrendingDown');
export const TrendingUp = wrap(TrendUpIcon, 'TrendingUp');
export const Trophy = wrap(TrophyIcon, 'Trophy');
export const Tv = wrap(TelevisionIcon, 'Tv');
export const Upload = wrap(UploadSimpleIcon, 'Upload');
export const Usb = wrap(UsbIcon, 'Usb');
export const Users = wrap(UsersIcon, 'Users');
export const Video = wrap(VideoCameraIcon, 'Video');
export const Volume2 = wrap(SpeakerHighIcon, 'Volume2');
export const VolumeX = wrap(SpeakerXIcon, 'VolumeX');
export const Wifi = wrap(WifiHighIcon, 'Wifi');
export const Wind = wrap(WindIcon, 'Wind');
export const Wrench = wrap(WrenchIcon, 'Wrench');
export const X = wrap(XIcon, 'X');
export const XCircle = wrap(XCircleIcon, 'XCircle');
export const Zap = wrap(LightningIcon, 'Zap');
