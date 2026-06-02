import { redirect } from 'next/navigation';

export default function AdminHealthRedirect() {
  redirect('/admin/api-health');
}
