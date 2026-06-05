'use client';
import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Plus } from 'lucide-react';

const FAQS: Array<[string, string]> = [
  [
    '¿Qué pasa si VELAR desaparece mañana?',
    'Los registros viven en la red Stellar testnet, que opera con cientos de nodos independientes. El bono, su dueño actual y su historial completo siguen siendo consultables en stellar.expert aunque esta plataforma deje de existir. VELAR es la interfaz de coordinación; la fuente de verdad es la cadena.',
  ],
  [
    '¿El TSE puede borrar o modificar un bono ya emitido?',
    'No. Una vez que un bono se emite on-chain, ninguna persona ni institución puede reescribir su historial. El TSE puede congelar un bono para detener transferencias mientras se investiga una disputa, pero la acción de congelar también queda registrada como un evento más en la cadena.',
  ],
  [
    '¿Cómo puedo verificar un bono sin saber blockchain?',
    'Cada bono tiene un ID público (ejemplo: SOL-2026-018). Lo buscás en VELAR y ves todo su recorrido en formato legible: quién lo emitió, cuándo se asignó, quién lo compró, por cuánto. Si querés ir al ledger crudo, cada movimiento tiene un link directo a Stellar Expert.',
  ],
  [
    '¿Estamos en mainnet o testnet?',
    'Hoy VELAR corre en Stellar Testnet. Es una red pública real con las mismas reglas que mainnet, pero los tokens no tienen valor monetario. Es el entorno correcto para pruebas regulatorias antes de mover a producción. El cambio a mainnet requiere aprobación del TSE.',
  ],
  [
    '¿Quién paga las comisiones de Stellar?',
    'Las transacciones en Stellar cuestan fracciones de centavo (0.00001 XLM por operación). VELAR cubre esos costos automáticamente desde la wallet de plataforma. El usuario nunca paga gas ni necesita una wallet propia para empezar.',
  ],
  [
    '¿VELAR maneja dinero real?',
    'No. VELAR coordina la trazabilidad del bono como activo único. El pago entre comprador y vendedor sigue siendo en colones por transferencia bancaria fuera del sistema. Lo que VELAR firma en cadena es el cambio de dueño del bono, no el flujo de dinero.',
  ],
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();

  return (
    <div className="mx-auto max-w-3xl">
      <ul className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {FAQS.map(([q, a], i) => {
          const isOpen = open === i;
          return (
            <li key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition hover:bg-slate-50"
                aria-expanded={isOpen}
              >
                <span className={`text-[15.5px] font-semibold leading-snug transition-colors ${isOpen ? 'text-primary' : 'text-slate-900'}`} style={{ fontFamily: 'Geist, sans-serif' }}>
                  {q}
                </span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${isOpen ? 'rotate-45 border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-400'}`}>
                  <Plus size={15} strokeWidth={2.3} />
                </span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    key="content"
                    initial={reduce ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={reduce ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-[14.5px] leading-relaxed text-slate-600">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
