import { redirect } from 'next/navigation';

// Server-side redirect a /login. Funciona aunque el cliente tenga cache
// o algún service worker rebelde, porque Next responde con un 307 al GET.
export default function IrLoginPage() {
  redirect('/login');
}
