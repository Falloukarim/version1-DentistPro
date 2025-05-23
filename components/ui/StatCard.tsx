import Link from "next/link";

type ColorKey = 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'yellow';

const colorConfig = {
  blue: {
    bg: 'bg-blue-50/80',
    text: 'text-blue-600',
    hover: 'hover:bg-blue-100/70',
    border: 'border-blue-200'
  },
  purple: {
    bg: 'bg-purple-50/80',
    text: 'text-purple-600',
    hover: 'hover:bg-purple-100/70',
    border: 'border-purple-200'
  },
  green: {
    bg: 'bg-green-50/80',
    text: 'text-green-600',
    hover: 'hover:bg-green-100/70',
    border: 'border-green-200'
  },
  red: {
    bg: 'bg-red-50/80',
    text: 'text-red-600',
    hover: 'hover:bg-red-100/70',
    border: 'border-red-200'
  },
  orange: {
    bg: 'bg-orange-50/80',
    text: 'text-orange-600',
    hover: 'hover:bg-orange-100/70',
    border: 'border-orange-200'
  },
  yellow: {
    bg: 'bg-yellow-50/80',
    text: 'text-yellow-600',
    hover: 'hover:bg-yellow-100/70',
    border: 'border-yellow-200'
  }
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: ColorKey;
  href: string;
  alert?: boolean;
}

const StatCard = ({ title, value, icon, color, href, alert = false }: StatCardProps) => {
  const colorClasses = {
    blue: 'from-blue-50/80 to-blue-100/40 border-blue-200/50',
    purple: 'from-purple-50/80 to-purple-100/40 border-purple-200/50',
    green: 'from-green-50/80 to-green-100/40 border-green-200/50',
    red: 'from-red-50/80 to-red-100/40 border-red-200/50',
    orange: 'from-orange-50/80 to-orange-100/40 border-orange-200/50',
    yellow: 'from-yellow-50/80 to-yellow-100/40 border-yellow-200/50'
  };

  return (
    <Link href={href} className="group block h-full relative">
      {alert && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          !
        </div>
      )}
      <div className={`
        h-full bg-gradient-to-br ${colorClasses[color]}
        rounded-xl border backdrop-blur-sm
        p-5 shadow-sm transition-all duration-300
        hover:shadow-md ${alert ? 'border-red-300/70' : `hover:border-${color}-300/70`}
        flex flex-col justify-between
      `}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {title}
            </p>
            <p className="text-2xl font-bold mt-2 text-gray-800">
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-lg bg-white/70 border ${alert ? 'border-red-200/30' : 'border-white/30'}`}>
            {icon}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default StatCard;