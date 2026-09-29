import React from 'react';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { PageHeader } from '../../../components/commons';

interface PartidasHeaderProps {
  canManage: boolean;
  onCreateNew: () => void;
}

export const PartidasHeader: React.FC<PartidasHeaderProps> = ({
  canManage,
  onCreateNew,
}) => {
  return (
    <PageHeader
      icon={<FileSpreadsheet size={26} />}
      title="Partidas Presupuestarias"
      subtitle="Catálogo oficial de partidas presupuestarias por objeto del gasto para la formulación del POA y ejecución presupuestaria."
      actions={
        canManage ? (
          <button
            type="button"
            onClick={onCreateNew}
            className="px-4 py-2 rounded-xl bg-theme-primary text-theme-primaryText font-semibold text-xs shadow-sm hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={15} /> Nueva Partida
          </button>
        ) : undefined
      }
    />
  );
};
