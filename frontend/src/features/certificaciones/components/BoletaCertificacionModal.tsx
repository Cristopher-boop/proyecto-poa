import React, { useRef } from 'react';
import { Printer, ShieldCheck } from 'lucide-react';
import { CertificacionPOA } from '../../../types/certificacion';
import { Modal, Button } from '../../../components/commons';
import { CertificacionDocumentoOficial } from './CertificacionDocumentoOficial';

interface BoletaCertificacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificacion: CertificacionPOA | null;
}

export const BoletaCertificacionModal: React.FC<BoletaCertificacionModalProps> = ({
  isOpen,
  onClose,
  certificacion,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!certificacion) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Boleta Oficial de Certificación POA — ${certificacion.codigo_certificacion || certificacion.hoja_ruta}`}
      size="xl"
    >
      <div className="space-y-4">
        {/* Barra superior de acciones de impresión */}
        <div className="flex items-center justify-between pb-3 border-b border-theme-border print:hidden">
          <div className="flex items-center gap-2 text-xs text-theme-muted">
            <ShieldCheck size={16} className="text-emerald-500" />
            <span>Documento Oficial Certificado y Aprobado</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              size="sm"
            >
              Cerrar
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handlePrint}
              icon={<Printer size={15} />}
              size="sm"
              className="font-bold shadow-md shadow-theme-primary/20"
            >
              Imprimir Boleta
            </Button>
          </div>
        </div>

        {/* Contenido imprimible de la Boleta con formato oficial */}
        <div className="rounded-2xl overflow-hidden border border-theme-border/60 shadow-sm bg-slate-100 dark:bg-slate-900/60 p-2 sm:p-4">
          <CertificacionDocumentoOficial
            certificacion={certificacion}
            printRef={printRef}
          />
        </div>
      </div>
    </Modal>
  );
};
