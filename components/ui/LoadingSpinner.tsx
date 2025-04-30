interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
  }
  
  const LoadingSpinner = ({ 
    size = 'md', 
    className = '' 
  }: LoadingSpinnerProps) => {
    const sizeClasses = {
      sm: 'h-6 w-6 border-t-2 border-b-2',
      md: 'h-8 w-8 border-t-2 border-b-2',
      lg: 'h-12 w-12 border-t-2 border-b-2'
    };
  
    return (
      <div
        className={`animate-spin rounded-full border-blue-500 ${sizeClasses[size]} ${className}`}
        style={{
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent'
        }}
      />
    );
  };
  
  export default LoadingSpinner;