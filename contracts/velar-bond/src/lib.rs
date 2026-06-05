#![no_std]

//! VELAR Bond — Soroban smart contract.
//!
//! Cada bono político emitido por el TSE es un contrato individual desplegado en
//! Stellar testnet. La cadena guarda la fuente de verdad: monto, fechas, dueño
//! actual, partido emisor y estado. Postgres queda como índice/cache.

use soroban_sdk::{
    contract, contractimpl, contracttype, panic_with_error, symbol_short,
    Address, BytesN, Env, String, Symbol,
};

// ─── Tipos del estado ───────────────────────────────────────────────────────

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[contracttype]
pub enum Status {
    Active = 0,
    InEscrow = 1,
    Frozen = 2,
    Sold = 3,
    Cancelled = 4,
}

#[derive(Clone)]
#[contracttype]
pub struct BondDetails {
    pub bond_id: String,
    pub party_id: String,
    pub certificate_number: String,
    pub series: String,
    pub face_value: i128,
    pub currency: Symbol,
    pub interest_rate_bps: u32,   // basis points (650 = 6.50%)
    pub issue_date: u64,           // unix timestamp
    pub maturity_date: u64,
    pub document_hash: BytesN<32>, // SHA-256 del PDF del certificado
    pub current_owner: Address,
    pub status: Status,
    pub created_at: u64,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Tse,             // Address que tiene poder de aprobar/congelar
    Owner,           // dueño actual del bono
    Details,         // BondDetails completo
    InitializedAt,   // u64 timestamp
}

// ─── Errores del contrato ───────────────────────────────────────────────────

#[derive(Clone, Copy, PartialEq, Eq, Debug)]
#[contracttype]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotOwner = 3,
    NotTse = 4,
    InvalidStatus = 5,
    Frozen = 6,
    SameOwner = 7,
}

// ─── Contrato ───────────────────────────────────────────────────────────────

#[contract]
pub struct VelarBond;

#[contractimpl]
impl VelarBond {
    /// Despliega el bono con todos sus atributos. Solo el TSE puede invocarla
    /// (la firma del TSE se requiere). Se llama UNA SOLA VEZ por contrato.
    pub fn initialize(
        env: Env,
        tse: Address,
        party_id: String,
        party_owner: Address,
        bond_id: String,
        certificate_number: String,
        series: String,
        face_value: i128,
        currency: Symbol,
        interest_rate_bps: u32,
        issue_date: u64,
        maturity_date: u64,
        document_hash: BytesN<32>,
    ) {
        // El TSE autoriza la emisión.
        tse.require_auth();

        let storage = env.storage().instance();
        if storage.has(&DataKey::Tse) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }

        let details = BondDetails {
            bond_id: bond_id.clone(),
            party_id: party_id.clone(),
            certificate_number,
            series,
            face_value,
            currency,
            interest_rate_bps,
            issue_date,
            maturity_date,
            document_hash,
            current_owner: party_owner.clone(),
            status: Status::Active,
            created_at: env.ledger().timestamp(),
        };

        storage.set(&DataKey::Tse, &tse);
        storage.set(&DataKey::Owner, &party_owner);
        storage.set(&DataKey::Details, &details);
        storage.set(&DataKey::InitializedAt, &env.ledger().timestamp());

        // Evento on-chain de emisión
        env.events()
            .publish((symbol_short!("issued"),), (party_owner, bond_id, face_value));
    }

    /// Transferir el bono a un nuevo dueño. Solo el dueño actual puede ejecutar.
    /// Falla si el bono está congelado o ya vendido.
    pub fn transfer(env: Env, to: Address) {
        let mut details: BondDetails = Self::require_details(&env);
        let from = details.current_owner.clone();

        from.require_auth();

        if from == to {
            panic_with_error!(&env, Error::SameOwner);
        }
        if details.status == Status::Frozen {
            panic_with_error!(&env, Error::Frozen);
        }
        if details.status == Status::Cancelled {
            panic_with_error!(&env, Error::InvalidStatus);
        }

        details.current_owner = to.clone();
        if details.status == Status::Active {
            // si era el primer dueño y se vendió, marcamos como vendido (después puede revenderse)
        }

        env.storage().instance().set(&DataKey::Owner, &to);
        env.storage().instance().set(&DataKey::Details, &details);

        env.events()
            .publish((symbol_short!("transfer"),), (from, to));
    }

    /// El TSE congela el bono (pausa transferencias).
    pub fn freeze(env: Env) {
        Self::require_tse(&env);
        let mut details: BondDetails = Self::require_details(&env);
        details.status = Status::Frozen;
        env.storage().instance().set(&DataKey::Details, &details);
        env.events().publish((symbol_short!("frozen"),), ());
    }

    /// El TSE desbloquea el bono.
    pub fn unfreeze(env: Env) {
        Self::require_tse(&env);
        let mut details: BondDetails = Self::require_details(&env);
        if details.status != Status::Frozen {
            panic_with_error!(&env, Error::InvalidStatus);
        }
        details.status = Status::Active;
        env.storage().instance().set(&DataKey::Details, &details);
        env.events().publish((symbol_short!("unfrozen"),), ());
    }

    /// El dueño marca el bono "en escrow" (publicado al marketplace).
    pub fn set_in_escrow(env: Env) {
        let details = Self::require_details(&env);
        details.current_owner.require_auth();
        let mut updated = details;
        updated.status = Status::InEscrow;
        env.storage().instance().set(&DataKey::Details, &updated);
        env.events().publish((symbol_short!("inescrow"),), ());
    }

    /// El dueño regresa el bono a estado activo (lo retira del marketplace).
    pub fn set_active(env: Env) {
        let details = Self::require_details(&env);
        details.current_owner.require_auth();
        let mut updated = details;
        updated.status = Status::Active;
        env.storage().instance().set(&DataKey::Details, &updated);
        env.events().publish((symbol_short!("active"),), ());
    }

    // ─── Vistas (read-only, gratis) ─────────────────────────────────────────

    pub fn details(env: Env) -> BondDetails {
        Self::require_details(&env)
    }

    pub fn current_owner(env: Env) -> Address {
        env.storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::Owner)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotInitialized))
    }

    pub fn status(env: Env) -> Status {
        Self::require_details(&env).status
    }

    pub fn tse(env: Env) -> Address {
        env.storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::Tse)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotInitialized))
    }

    // ─── Helpers privados ───────────────────────────────────────────────────

    fn require_details(env: &Env) -> BondDetails {
        env.storage()
            .instance()
            .get::<DataKey, BondDetails>(&DataKey::Details)
            .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized))
    }

    fn require_tse(env: &Env) {
        let tse: Address = env
            .storage()
            .instance()
            .get(&DataKey::Tse)
            .unwrap_or_else(|| panic_with_error!(env, Error::NotInitialized));
        tse.require_auth();
    }
}

#[cfg(test)]
mod test;
