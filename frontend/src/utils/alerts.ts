import Swal from 'sweetalert2';

// Helper para detectar tema oscuro
const isDark = () => document.documentElement.classList.contains('dark');

export const alertService = {
  /**
   * Diálogo de confirmación con SweetAlert2
   */
  confirm: async (options: {
    title: string;
    text?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    isDanger?: boolean;
    icon?: 'warning' | 'question' | 'info';
  }): Promise<boolean> => {
    const dark = isDark();
    const result = await Swal.fire({
      title: options.title,
      text: options.text,
      icon: options.icon ?? (options.isDanger ? 'warning' : 'question'),
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText ?? (options.isDanger ? 'Sí, desactivar' : 'Sí, confirmar'),
      cancelButtonText: options.cancelButtonText ?? 'Cancelar',
      confirmButtonColor: options.isDanger ? '#E11D48' : '#059669',
      cancelButtonColor: '#64748B',
      background: dark ? '#272B33' : '#FFFFFF',
      color: dark ? '#FFFFFF' : '#0F172A',
      reverseButtons: true,
      focusCancel: options.isDanger,
      customClass: {
        popup: 'rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700',
        confirmButton: 'rounded-xl px-4 py-2 text-sm font-semibold',
        cancelButton: 'rounded-xl px-4 py-2 text-sm font-semibold',
      },
    });

    return result.isConfirmed;
  },

  /**
   * Notificación de éxito
   */
  success: (title: string, text?: string) => {
    const dark = isDark();
    return Swal.fire({
      icon: 'success',
      title,
      text,
      timer: 2500,
      timerProgressBar: true,
      showConfirmButton: false,
      background: dark ? '#272B33' : '#FFFFFF',
      color: dark ? '#FFFFFF' : '#0F172A',
      customClass: {
        popup: 'rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700',
      },
    });
  },

  /**
   * Alerta de error
   */
  error: (title: string, text?: string) => {
    const dark = isDark();
    return Swal.fire({
      icon: 'error',
      title,
      text: text || 'Ocurrió un error al procesar la solicitud.',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#059669',
      background: dark ? '#272B33' : '#FFFFFF',
      color: dark ? '#FFFFFF' : '#0F172A',
      customClass: {
        popup: 'rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700',
        confirmButton: 'rounded-xl px-4 py-2 text-sm font-semibold',
      },
    });
  },

  /**
   * Toast flotante en esquina superior derecha
   */
  toast: (title: string, icon: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const dark = isDark();
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      background: dark ? '#272B33' : '#FFFFFF',
      color: dark ? '#FFFFFF' : '#0F172A',
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      },
    });

    return Toast.fire({
      icon,
      title,
    });
  },
};

export default alertService;
