import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminHubinDashboard } from './roles/AdminHubinDashboard';
import { GuruDashboard } from './roles/GuruDashboard';
import { IndustriDashboard } from './roles/IndustriDashboard';
import { SiswaDashboard } from './roles/SiswaDashboard';

export const DashboardPage: React.FC = () => {
  const { role } = useAuth();

  switch (role) {
    case 'siswa':
      return <SiswaDashboard />;

    case 'guru_pembimbing':
      return <GuruDashboard />;

    case 'pembimbing_industri':
      return <IndustriDashboard />;

    case 'super_admin':
    case 'admin_pkl':
    case 'wakasek':
    case 'kepala_sekolah':
    default:
      return <AdminHubinDashboard />;
  }
};

export default DashboardPage;
