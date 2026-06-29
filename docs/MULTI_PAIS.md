# VELAR Multi-país (LATAM) — Handoff

> Rama: **`feat/multi-country-latam`** · construido mientras dormías.
> Para volver a lo que ya funcionaba: `git checkout feat/rbac-roles-guard`.

Esto convierte a VELAR de una plataforma CR-only en **infraestructura de
transparencia política para LATAM**: un núcleo Stellar único (tokenización +
escrow + auditoría) y una **capa que se adapta a cada país** (autoridad,
instrumento, moneda, reglas).

**Estrategia (refinada):** **Costa Rica es el producto al 100%, a full.**
CO/BR/AR son **roadmap** — no flujos completos — pero la infraestructura **ya se
adapta a ellos**, y eso se demuestra en el pitch. El mensaje al jurado:
"profundidad real en CR + una infraestructura genuinamente adaptable", no
"4 países a medias".

### Segmentación por login (importante)
El **usuario real queda fijado a la jurisdicción de su cuenta** (el tico ve solo
Costa Rica) y **no ve el selector de país**. El selector existe únicamente en
**modo demo** (`NEXT_PUBLIC_DEMO_MODE=1`) para que vos, en el pitch, muestres en
vivo cómo la misma infraestructura se reconfigura por país. En producción, nadie
ve jurisdicciones ajenas — lo que refuerza el argumento de compliance.

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

> **Para mostrar el multi-país en el pitch:** poné `NEXT_PUBLIC_DEMO_MODE=1` en
> `apps/web/.env.local` y reiniciá el dev server. Aparece el selector de país en
> el header. Para la experiencia "producto real" (usuario fijado a CR, sin
> selector), dejalo en `0`.

### Nuevo: verificación pública (Costa Rica al 100%)
- **`/verificar`** — página pública (sin login) donde cualquier ciudadano pega
  el ID de un bono (p. ej. `SOL-2026-114`) y ve su historial on-chain.
- **`/verificar/<id>`** — vista compartible: timeline de eventos con links a
  cada transacción en stellar.expert, cadena de propiedad y hash del certificado.
- Endpoint público: `GET /public/bonds/:idOrToken/traceability` (sin auth,
  rate-limited, mensajes privados de negociación removidos).

> **Rollback de la DB** (si te arrepentís): el bloque de `DROP` está documentado
> al inicio de `supabase/migrations/20260629000000_multi_country.sql`.

---

## 3. Cómo demostrarlo (guion del demo, ~2 min)

**Acto 1 — Costa Rica, el producto completo (el corazón del pitch):**
1. Flujo TSE de punta a punta: emisión → marketplace → escrow on-chain → traspaso, cada paso verificable en stellar.expert.
2. **El golpe de transparencia:** abrí **`/verificar`** (sin login), pegá el ID del bono → aparece todo su historial on-chain con links a cada transacción. Decí: *"esto lo puede auditar cualquier ciudadano, sin cuenta, ahora mismo. VELAR no puede alterarlo."*

**Acto 2 — la infraestructura es adaptable (prueba, no promesa):**
3. Activá el modo demo (`NEXT_PUBLIC_DEMO_MODE=1`) y abrí el **selector de país**. Cambiá de 🇨🇷 a 🇨🇴/🇧🇷/🇦🇷 y mostrá cómo **la misma plataforma se reconfigura sola**: autoridad (TSE→CNE), moneda (₡→$→R$), instrumento, terminología. Decí: *"no es un producto de un país; es infraestructura para LATAM. CR está al 100%; los demás son nuestro roadmap, ya soportados a nivel de configuración."*
4. **Cerrá con compliance:** el usuario real está fijado a su país y la compra cross-border se bloquea → *"el financiamiento político extranjero es ilegal en LATAM, y VELAR lo impide por diseño."*

> Nota honesta: CO/BR/AR no tienen bonos sembrados end-to-end (son roadmap). El
> selector demuestra la **adaptación de la interfaz/infra**, no 4 mercados llenos.
> No prometas "4 países funcionando" — prometé "CR completo + infra adaptable".

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
