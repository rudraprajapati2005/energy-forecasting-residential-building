import Head from 'next/head';
import DashboardLayout from '../components/DashboardLayout';

export default function Dashboard() {
  return (
    <div>
      <Head>
        <title>Dashboard | Energy Forecasting</title>
      </Head>
      <DashboardLayout />
    </div>
  );
}
