import { Toaster } from 'react-hot-toast';

export default function ToastConfig() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#0A1F44',
          color: '#fff',
          borderRadius: '12px',
          fontSize: '14px',
          fontFamily: 'Poppins, sans-serif',
        },
        success: {
          iconTheme: { primary: '#C9962D', secondary: '#fff' },
        },
        error: {
          style: { background: '#DC2626' },
        },
      }}
    />
  );
}
