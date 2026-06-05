#![cfg(test)]

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger},
    BytesN, Env, String, Symbol,
};

fn setup() -> (Env, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_700_000_000);

    let contract_id = env.register(VelarBond, ());
    let tse = Address::generate(&env);
    let party = Address::generate(&env);
    let buyer = Address::generate(&env);

    (env, contract_id, tse, party, buyer)
}

fn init(env: &Env, contract_id: &Address, tse: &Address, party: &Address) -> VelarBondClient<'_> {
    let client = VelarBondClient::new(env, contract_id);
    let args = InitArgs {
        party_id: String::from_str(env, "party-aurora-001"),
        party_owner: party.clone(),
        bond_id: String::from_str(env, "SOL-2026-018"),
        certificate_number: String::from_str(env, "CERT-2026-018"),
        series: String::from_str(env, "Serie A"),
        face_value: 5_000_000_i128,
        currency: Symbol::new(env, "CRC"),
        interest_rate_bps: 650_u32, // 6.50%
        issue_date: 1_700_000_000_u64,
        maturity_date: 1_731_536_000_u64,
        document_hash: BytesN::from_array(env, &[0xAB; 32]),
    };
    client.initialize(tse, &args);
    client
}

#[test]
fn initializes_with_all_fields() {
    let (env, contract_id, tse, party, _) = setup();
    let c = init(&env, &contract_id, &tse, &party);

    let d = c.details();
    assert_eq!(d.bond_id, String::from_str(&env, "SOL-2026-018"));
    assert_eq!(d.face_value, 5_000_000);
    assert_eq!(d.interest_rate_bps, 650);
    assert_eq!(d.current_owner, party);
    assert_eq!(d.status, Status::Active);
    assert_eq!(c.tse(), tse);
}

#[test]
#[should_panic(expected = "Error(Contract, #1)")] // AlreadyInitialized
fn cannot_initialize_twice() {
    let (env, contract_id, tse, party, _) = setup();
    init(&env, &contract_id, &tse, &party);
    init(&env, &contract_id, &tse, &party);
}

#[test]
fn owner_can_transfer_to_buyer() {
    let (env, contract_id, tse, party, buyer) = setup();
    let c = init(&env, &contract_id, &tse, &party);

    c.transfer(&buyer);

    assert_eq!(c.current_owner(), buyer);
    assert_eq!(c.details().current_owner, buyer);
}

#[test]
#[should_panic(expected = "Error(Contract, #6)")] // Frozen
fn cannot_transfer_when_frozen() {
    let (env, contract_id, tse, party, buyer) = setup();
    let c = init(&env, &contract_id, &tse, &party);

    c.freeze();
    c.transfer(&buyer);
}

#[test]
fn tse_can_freeze_and_unfreeze() {
    let (env, contract_id, tse, party, buyer) = setup();
    let c = init(&env, &contract_id, &tse, &party);

    c.freeze();
    assert_eq!(c.status(), Status::Frozen);

    c.unfreeze();
    assert_eq!(c.status(), Status::Active);

    c.transfer(&buyer);
    assert_eq!(c.current_owner(), buyer);
}

#[test]
#[should_panic(expected = "Error(Contract, #7)")] // SameOwner
fn cannot_transfer_to_self() {
    let (env, contract_id, tse, party, _) = setup();
    let c = init(&env, &contract_id, &tse, &party);
    c.transfer(&party);
}

#[test]
fn owner_can_put_in_escrow_and_back_to_active() {
    let (env, contract_id, tse, party, _) = setup();
    let c = init(&env, &contract_id, &tse, &party);

    c.set_in_escrow();
    assert_eq!(c.status(), Status::InEscrow);

    c.set_active();
    assert_eq!(c.status(), Status::Active);
}

#[test]
fn second_owner_can_resell() {
    let (env, contract_id, tse, party, buyer) = setup();
    let c = init(&env, &contract_id, &tse, &party);

    // party → buyer
    c.transfer(&buyer);

    // buyer → tercer comprador
    let third = Address::generate(&env);
    c.transfer(&third);

    assert_eq!(c.current_owner(), third);
}
