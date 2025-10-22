# Chainvault Web3 Banking dApp - 10 Day Hackathon Roadmap

## Team Setup
- 2 Solidity Developers: Smart contracts development & testing
- 1 Frontend Developer: React + Vite + Tailwind UI and Web3 integration

---

## Core Features
1. User Deposits & Payments: Deposit funds, pay anywhere
2. Nominee System: Add nominees with % share, activate after wallet inactivity (default 3 months)
3. Payroll Automation: Batch/scheduled payments to multiple users
4. Beta Loan Feature: Loan issuance with collateral checks, repayments

---

## Day 1: Project Setup & Planning
- Setup `contracts/` with Foundry + Hardhat
- Setup `dapp/` React + Vite + Tailwind
- Define contract interfaces and frontend API specs
- Team alignment and task breakdown

## Days 2-3: Core Contract Dev & UI Foundations
- Dev 1: Deposit & payment contracts + tests
- Dev 2: Nominee system basic contracts + inactivity logic
- Dev 3: Wallet connection and deposit UI, balance display

## Days 4-5: Nominee & Payroll Contracts + Frontend Flows
- Dev 1: Complete nominee with Lit Protocol integration for privacy
- Dev 2: Payroll contracts for batch/scheduled payments
- Dev 3: Nominee management UI + integrate deposit/payment contract calls

## Days 6-7: Beta Loan Feature & Payroll UI
- Dev 1: Collateral oracle integration with Pyth Network
- Dev 2: Loan issuance, repayment, and default logic
- Dev 3: Payroll batch payment UI + loan request interface

## Days 8-9: Integration, Testing & Polish
- Dev 1 & 2: Contract testing, optimization, deploy on testnet, verify on Blockscout
- Dev 3: End-to-end UI testing, Lit Protocol data access, UX improvements

## Day 10: Deployment & Demo Prep
- Deploy frontend and contracts to live testnet
- Demo scripts for all features:
  - Deposits and payments
  - Nominee auto-transfer on inactivity
  - Payroll automation
  - Beta loan feature with oracle support
- Final pitch rehearsal

---

## Tools & Partners Used
- Foundry + Hardhat: Smart contract development/testing
- Pyth Network: Oracle price feeds for loans
- Lit Protocol: Encrypted nominee data access
- Blockscout: Contract verification & transparency
- EVVM (optional): Enhanced EVM compatibility and performance

---

## Collaboration Notes
- Use shared Git repo with branches for contracts/frontend
- Daily standups and syncs for blockers and integrations
- Expose contract ABIs early for frontend integration
- Frontend mocks contract calls initially to enable UI dev pace
- Continuous integration and testing automation recommended

---

This roadmap balances ambitious features with a lean hackathon timeline across a 3-person team to deliver a polished, hackathon-winning Web3 bank app.
