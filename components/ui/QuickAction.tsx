import Link from "next/link";

type ColorKey = 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'yellow';

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  href: string;
  color: ColorKey;
  alert?: boolean;
}

const QuickAction = ({ icon, title, href, color, alert = false }: QuickActionProps) => {
  const colorClasses = {
    blue: 'hover:bg-blue-100/30 border-blue-200/50',
    purple: 'hover:bg-purple-100/30 border-purple-200/50',
    green: 'hover:bg-green-100/30 border-green-200/50',
    red: 'hover:bg-red-100/30 border-red-200/50',
    orange: 'hover:bg-orange-100/30 border-orange-200/50',
    yellow: 'hover:bg-yellow-100/30 border-yellow-200/50'
  };

  return (
    <Link href={href} className="group block h-full relative">
      {alert && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          !
        </div>
      )}
      <div className={`
        h-full
        rounded-xl border ${alert ? 'border-red-200/50' : 'border-white/30'}
        p-4 transition-all duration-300 ${colorClasses[color]}
        flex flex-col items-center justify-center text-center
        hover:shadow-sm
      `}
        style={{
          background: "linear-gradient(to bottom, #61D6A6, #393785)",
          backdropFilter: "blur(4px)",
        }}
      >
        <div className={`p-3 mb-2 rounded-full border border-white`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
        <span className="text-sm font-medium text-white">
          {title}
        </span>
      </div>
    </Link>
  );
};

export default QuickAction;
