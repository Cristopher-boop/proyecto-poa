import React from 'react';
import { Layers, CheckCircle2, XCircle, SlidersHorizontal } from 'lucide-react';
import { ResumenCards } from '../../../components/commons';
import type { ResumenCardItem } from '../../../components/commons/ResumenCards';
import type { PartidaStats } from '../types/partidas.types';

interface PartidasResumenProps {
  stats: PartidaStats;
}

export const PartidasResumen: React.FC<PartidasResumenProps> = ({ stats }) => {
  const porcentajeActivas = stats.total > 0 ? Math.round((stats.activas / stats.total) * 100) : 0;

  const items: ResumenCardItem[] = [
    {
      id: 'total',
      title: 'Total Catálogo',
      value: stats.total,
      subtitle: 'Partidas de egreso registradas',
      icon: <Layers size={18} />,
      color: 'primary',
    },
    {
      id: 'activas',
      title: 'Partidas Activas',
      value: stats.activas,
      subtitle: `${porcentajeActivas}% del catálogo disponible`,
      icon: <CheckCircle2 size={18} />,
      color: 'emerald',
      progress: {
        value: porcentajeActivas,
        label: `${porcentajeActivas}% operativas`,
        colorClass: 'bg-emerald-500',
      },
    },
    {
      id: 'inactivas',
      title: 'Bajas Lógicas',
      value: stats.inactivas,
      subtitle: 'No utilizables en formulación',
      icon: <XCircle size={18} />,
      color: 'rose',
    },
    {
      id: 'grupos',
      title: 'Capítulos / Rubros',
      value: `${stats.totalGrupos} Grupos`,
      subtitle: 'Clasificadores por objeto de gasto',
      icon: <SlidersHorizontal size={18} />,
      color: 'indigo',
    },
  ];

  return <ResumenCards items={items} columns={4} />;
};
