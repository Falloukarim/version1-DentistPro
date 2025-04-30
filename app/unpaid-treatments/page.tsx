// app/unpaid-treatments/page.tsx
import { FiArrowLeft, FiDollarSign } from 'react-icons/fi';
import Link from 'next/link';
import Layout from 'components/layout';
import UnpaidTreatmentsList from 'components/UnpaidTreatmentsList';
import { Button } from '@/components/ui/button';

export default function UnpaidTreatmentsPage() {
  return (
    <Layout>
<div className="p-6 max-w-4xl mx-auto min-h-screen">
<div className="flex items-center gap-3 mb-6">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard">
              <FiArrowLeft size={20} />
            </Link>
          </Button>
          <h2 className="text-2xl font-bold text-foreground">
            <FiDollarSign className="inline mr-2 text-destructive" />
            Traitements Impayés
          </h2>
        </div>

        <div className="bg-card dark:bg-background rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="font-semibold text-foreground">
              Liste des traitements avec solde restant
            </h3>
          </div>
          <div className="p-5">
            <UnpaidTreatmentsList />
          </div>
        </div>
      </div>
    </Layout>
  );
}
