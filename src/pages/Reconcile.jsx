import ReconDashboard from '../components/reconciliation/ReconDashboard';
import ReconHistory from '../components/reconciliation/ReconHistory';

export default function Reconcile({ memberId }) {
  return (
    <main className="max-w-xl mx-auto px-6 pt-8 pb-32 space-y-12">
      <ReconDashboard memberId={memberId} />
      <ReconHistory />
    </main>
  );
}
