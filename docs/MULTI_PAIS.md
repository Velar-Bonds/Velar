# VELAR Multi-país (LATAM) — Handoff

> Rama: **`feat/multi-country-latam`** · construido mientras dormías.
> Para volver a lo que ya funcionaba: `git checkout feat/rbac-roles-guard`.

Esto convierte a VELAR de una plataforma CR-only en **infraestructura de
transparencia política para LATAM**: un núcleo Stellar único (tokenización +
escrow + auditoría) y una **capa que se adapta a cada país** (autoridad,
instrumento, moneda, reglas). Costa Rica y Colombia quedan como mercados "live";
Brasil y Argentina como perfiles configurados (la UI se adapta, el flujo
completo es roadmap).

---

## 1. Qué se construyó

| Capa | Cambio |
|---|---|
| **DB** | Columna `country` en `parties`, `profiles`, `bonds` (default `CR`, aditiva y reversible). Partidos sembrados para CO/BR/AR. `handle_new_user` copia el país del signup. |
| **Tipos** | `@velar/types` ahora exporta `CountryProfile` + `COUNTRY_PROFILES` (CR/CO/BR/AR) con el contexto regulatorio real de cada país, y helpers (`formatMoney`, `currencyForCountry`, `getCountryProfile`). |
| **Backend** | Los bonos se emiten con el país del partido emisor. Moneda por defecto según país. Marketplace **segmentado por país**. **Guard anti cross-border**: un comprador solo puede adquirir bonos de su misma jurisdicción (compliance). |
| **Frontend** | `CountryProvider` + `useCountry()`, **selector de país** en el header, marketplace adaptado (autoridad, instrumento, moneda, banner de contexto), etiqueta de autoridad dinámica (TSE→CNE). |

### La regla estrella (para el pitch)
El **financiamiento político extranjero es ilegal** en CR/CO/BR/AR. VELAR lo
**impide por diseño**: la compra cross-border se rechaza en el servidor
(`transfers.service.ts`). No es un filtro cosmético — es cumplimiento regulatorio
codificado en la infraestructura.

---

## 2. Cómo correrlo (cuando despiertes)

```bash
# 1. Estás en la rama del feature
git checkout feat/multi-country-latam

# 2. Aplicar la migración nueva a tu Supabase
#    Archivo: supabase/migrations/20260629000000_multi_country.sql
#    Con CLI de Supabase:
supabase db push
#    …o pegá el SQL en el editor de Supabase. Es ADITIVA: no borra nada.

# 3. Levantar todo (ya corrí npm install)
npm run dev
# API  → http://localhost:3001/api
# Web  → http://localhost:3000
```

> **Rollback de la DB** (si te arrepentís): el bloque de `DROP` está documentado
> al inicio de `supabase/migrations/20260629000000_multi_country.sql`.

---

## 3. Cómo demostrarlo (guion del demo, ~90s)

1. **Entrá como TSE.** Arriba a la izquierda aparece el **selector de país** (🇨🇷 TSE · CRC).
2. **Mostrá Costa Rica funcionando** (tu flujo de siempre): emisión → marketplace → escrow → traspaso, verificable en stellar.expert.
3. **Cambiá el país a 🇨🇴 Colombia** en el selector. En vivo:
   - La autoridad pasa de **TSE → CNE**.
   - La moneda pasa de **₡ (CRC) → $ (COP)**.
   - El instrumento pasa de "Bono de deuda política" → **"Cesión de reposición de votos"**.
   - El marketplace muestra **solo bonos colombianos** (segmentación).
   - Hay partidos colombianos reales (Pacto Histórico, Centro Democrático…).
4. **Mostrá 🇧🇷 Brasil / 🇦🇷 Argentina** en el selector (badge "Beta"): la UI se
   adapta (TSE-BR / FEFC / R$, Cámara Nacional Electoral / ARS). Decí:
   *"la infraestructura ya los soporta a nivel de configuración."*
5. **Cerrá con la regla de compliance:** intentá comprar (como comprador CR) un
   bono de otro país → el sistema lo **bloquea**: *"el financiamiento político
   extranjero está prohibido por ley — VELAR lo impide por diseño."*

**Frase de cierre:** *"No construimos una solución para Costa Rica. Construimos
la infraestructura de transparencia política para LATAM sobre Stellar."*

---

## 4. Encuadre del pitch por país (preciso, no exagerado)

| País | Mecanismo real | Tu ángulo |
|---|---|---|
| 🇨🇷 **CR** | Deuda política: bonos negociables sobre reembolso estatal | Piloto que ya funciona |
| 🇨🇴 **CO** | Reposición de votos ($8.613/voto 2026, umbral 4%, vía CNE) | Match casi 1:1 — tokenizar la cesión de reposición |
| 🇧🇷 **BR** | Fundo Eleitoral (FEFC, ~R$4,9 bi 2026, reparte el TSE) | Trazabilidad del desembolso público; fin del *caixa dois* |
| 🇦🇷 **AR** | Modelo mixto (Ley 27.504), cuenta única de campaña | Aportes verificables on-chain en tiempo real |

> No digas "el bono político funciona igual en todos lados" (es falso, te lo
> refutan). Decí: "en toda LATAM el dinero político se mueve contra fondos
> públicos futuros y se rastrea en papel. CR ya lo formalizó como instrumento
> negociable → lo elegimos como piloto. CO tiene la misma estructura lista para
> adoptarlo. BR y AR tienen el mismo problema de trazabilidad."

---

## 5. Qué falta / próximos pasos (priorizado)

1. **Correr la migración** y probar el flujo CO end-to-end (emitir un bono a un
   partido colombiano y verificar que el marketplace lo segmenta). *(Requiere tus
   credenciales — no pude hacerlo yo.)*
2. **De-hardcode de moneda** en páginas secundarias que todavía formatean en CRC
   fijo (no rompen, solo muestran ₡): `app/tse/**`, `app/partido/**`,
   `app/tse/TSEPageClient.tsx`, etc. La utilidad `useCountry().money()` ya está
   lista para reemplazar los `fmtCRC`/`fmt` locales.
3. **Wallet-connect (Freighter)** — showcase no-custodial. No incluido (riesgo
   alto, necesita tu browser para probar el popup).
4. **1 bono en mainnet** — ventaja de puntaje. Necesita que fondees una wallet
   con XLM real (`STELLAR_NETWORK=mainnet`).

---

## 6. Verificación hecha

- ✅ `@velar/types` compila (`tsc`).
- ✅ API compila (`nest build`) y **35/35 tests pasan** (`npm test`).
- ✅ Web typechecks limpio (`tsc --noEmit` en `apps/web`).
- ⚠️ `next build` (producción) falla por un tema **ambiental** (descarga del
  binario SWC + detección de pnpm/workspaces), no por el código. `next dev`
  (que es lo que usás) no se ve afectado. Si querés arreglar el build de prod,
  suele resolverse con `npm rebuild` del paquete `@next/swc-darwin-*` o fijando
  el package manager.
- ❌ No pude correr el flujo E2E en vivo: necesita tu Supabase + Stellar (claves)
  y correr la migración. Eso queda para vos en el paso 1.

---

## 7. Commits en esta rama

```
feat(multi-country): add country dimension + CountryProfile (CR/CO/BR/AR)
feat(multi-country): country scoping + cross-border compliance guard (api)
feat(multi-country): country context, selector & adaptive marketplace (web)
```

Cada uno es un checkpoint estable: `git reset --hard <hash>` te lleva a
cualquiera de ellos sin tocar la rama `feat/rbac-roles-guard`.
