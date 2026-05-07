import { Navigate } from 'react-router-dom';

/** @deprecated route — billing module lives under /dashboard/billing/overview */
export default function AdminBillingPage() {
  return <Navigate to="/dashboard/billing/overview" replace />;
}
