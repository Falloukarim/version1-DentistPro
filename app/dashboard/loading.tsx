import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <LoadingSpinner size="lg" />
    </div>
  );
}
