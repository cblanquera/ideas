//styles
import 'adent/globals.css';
import 'react-toastify/dist/ReactToastify.css';
//types
import type { AppProps } from 'next/app';
//components
import AdentProvider from 'adent/components/Provider';
//helpers
import { access, i18n, admin } from 'adent.config';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AdentProvider 
      name="Admin"
      languages={i18n}
      access={access} 
      menu={admin.menu}
    >
      <Component {...pageProps} />
    </AdentProvider>
  );
}
