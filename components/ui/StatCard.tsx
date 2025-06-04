import Link from "next/link";

type ColorKey = 'blue' | 'purple' | 'green' | 'red' | 'orange';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: ColorKey;
    href: string;
  }
  
  const StatCard = ({ title, value, icon, color, href }: StatCardProps) => {
    const colorClasses = {
      blue: 'from-blue-50/80 to-blue-100/40 border-blue-200/50',
      purple: 'from-purple-50/80 to-purple-100/40 border-purple-200/50',
      green: 'from-green-50/80 to-green-100/40 border-green-200/50',
      red: 'from-red-50/80 to-red-100/40 border-red-200/50',
      orange: 'from-orange-50/80 to-orange-100/40 border-orange-200/50'
    };
  
    return (
      <Link href={href} className="group block h-full">
        <div className={`
          h-full bg-gradient-to-br ${colorClasses[color]}
          rounded-xl border backdrop-blur-sm
          p-5 shadow-sm transition-all duration-300
          hover:shadow-md hover:border-${color}-300/70
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
            <div className="p-3 rounded-lg bg-white/70 border border-white/30">
              {icon}
            </div>
          </div>
        </div>
      </Link>
    );
  };
export default StatCard;