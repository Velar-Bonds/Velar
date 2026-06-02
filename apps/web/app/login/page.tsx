'use client';
import { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('comprador');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        const { error: signUpErr } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName, role } },
        });
        if (signUpErr) throw signUpErr;
        setError('Revisá tu email para confirmar la cuenta.');
      } else {
        const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
        if (loginErr) throw loginErr;
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message ?? 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 to-blue-800">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-blue-900">VELAR</h1>
          <p className="text-gray-500 text-sm mt-1">Trazabilidad de Bonos Políticos</p>
        </div>

        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
          <button className={`flex-1 py-2 text-sm font-medium transition ${!isSignUp ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setIsSignUp(false)} type="button">Ingresar</button>
          <button className={`flex-1 py-2 text-sm font-medium transition ${isSignUp ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setIsSignUp(true)} type="button">Registrarse</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="comprador">Comprador</option>
                  <option value="recomprador">Recomprador</option>
                  <option value="emisor">Emisor (Partido)</option>
                  <option value="validador">Validador de Pago</option>
                  <option value="tse">TSE</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <div className={`rounded-lg px-3 py-2 text-sm ${error.includes('email') ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>{error}</div>}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50">
            {loading ? 'Procesando...' : isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
