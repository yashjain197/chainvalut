# Makefile for NomineeVault Project

# Load environment variables
-include .env

# Contracts directory
CONTRACTS_DIR := contracts

# Default target
.PHONY: help
help:
	@echo "NomineeVault - Makefile Commands"
	@echo ""
	@echo "📦 Setup:"
	@echo "  make install           - Install all dependencies"
	@echo "  make install-contracts - Install contract dependencies (Foundry)"
	@echo "  make install-frontend  - Install frontend dependencies (npm)"
	@echo ""
	@echo "🔨 Build:"
	@echo "  make build             - Compile contracts"
	@echo "  make clean             - Clean build artifacts"
	@echo ""
	@echo "🧪 Testing:"
	@echo "  make test              - Run all tests"
	@echo "  make test-verbose      - Run tests with verbose output"
	@echo "  make test-gas          - Run tests with gas reporting"
	@echo "  make coverage          - Generate test coverage report"
	@echo ""
	@echo "🚀 Deployment:"
	@echo "  make deploy-sepolia    - Deploy to Sepolia testnet"
	@echo "  make deploy-mainnet    - Deploy to Ethereum mainnet"
	@echo ""
	@echo "🔍 Verification:"
	@echo "  make verify-sepolia    - Verify contract on Sepolia"
	@echo ""
	@echo "💻 Frontend:"
	@echo "  make dev               - Start frontend dev server"
	@echo "  make frontend-build    - Build frontend for production"
	@echo ""
	@echo "📊 Analysis:"
	@echo "  make size              - Check contract sizes"
	@echo "  make slither           - Run Slither security analysis"
	@echo ""

# ==================== Setup ====================

.PHONY: install
install: install-contracts install-frontend
	@echo "✅ All dependencies installed"

.PHONY: install-contracts
install-contracts:
	@echo "📦 Installing contract dependencies..."
	cd $(CONTRACTS_DIR) && forge install OpenZeppelin/openzeppelin-contracts --no-commit

.PHONY: install-frontend
install-frontend:
	@echo "📦 Installing frontend dependencies..."
	cd dapp && npm install

# ==================== Build ====================

.PHONY: build
build:
	@echo "🔨 Compiling contracts..."
	cd $(CONTRACTS_DIR) && forge build

.PHONY: clean
clean:
	@echo "🧹 Cleaning build artifacts..."
	cd $(CONTRACTS_DIR) && forge clean

# ==================== Testing ====================

.PHONY: test
test:
	@echo "🧪 Running tests..."
	cd $(CONTRACTS_DIR) && forge test

.PHONY: test-verbose
test-verbose:
	@echo "🧪 Running tests (verbose)..."
	cd $(CONTRACTS_DIR) && forge test -vvv

.PHONY: test-gas
test-gas:
	@echo "📊 Running tests with gas report..."
	cd $(CONTRACTS_DIR) && forge test --gas-report

.PHONY: coverage
coverage:
	@echo "📈 Generating coverage report..."
	cd $(CONTRACTS_DIR) && forge coverage

.PHONY: test-specific
test-specific:
	@echo "🧪 Running specific test..."
	@read -p "Enter test name: " test_name; \
	cd $(CONTRACTS_DIR) && forge test --match-test $$test_name -vvv

# ==================== Deployment ====================

.PHONY: deploy-sepolia
deploy-sepolia:
	@echo "🚀 Deploying to Sepolia..."
	cd $(CONTRACTS_DIR) && forge script script/Deploy.s.sol:Deploy \
		--rpc-url $(SEPOLIA_RPC_URL) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		-vvvv

.PHONY: deploy-mainnet
deploy-mainnet:
	@echo "⚠️  MAINNET DEPLOYMENT - Are you sure? (Ctrl+C to cancel)"
	@sleep 5
	@echo "🚀 Deploying to Mainnet..."
	cd $(CONTRACTS_DIR) && forge script script/Deploy.s.sol:Deploy \
		--rpc-url $(MAINNET_RPC_URL) \
		--broadcast \
		--verify \
		--etherscan-api-key $(ETHERSCAN_API_KEY) \
		--slow \
		-vvvv

# ==================== Verification ====================

.PHONY: verify-sepolia
verify-sepolia:
	@echo "🔍 Verifying contract on Sepolia..."
	@read -p "Enter contract address: " addr; \
	cd $(CONTRACTS_DIR) && forge verify-contract $$addr NomineeVault \
		--chain sepolia \
		--etherscan-api-key $(ETHERSCAN_API_KEY)

# ==================== Frontend ====================

.PHONY: dev
dev:
	@echo "💻 Starting frontend dev server..."
	cd dapp && npm run dev

.PHONY: frontend-build
frontend-build:
	@echo "🔨 Building frontend..."
	cd dapp && npm run build

# ==================== Analysis ====================

.PHONY: size
size:
	@echo "📊 Checking contract sizes..."
	cd $(CONTRACTS_DIR) && forge build --sizes

.PHONY: slither
slither:
	@echo "🔍 Running Slither analysis..."
	cd $(CONTRACTS_DIR) && slither src/

.PHONY: format
format:
	@echo "✨ Formatting code..."
	cd $(CONTRACTS_DIR) && forge fmt

.PHONY: snapshot
snapshot:
	@echo "📸 Creating gas snapshot..."
	cd $(CONTRACTS_DIR) && forge snapshot

# ==================== Utilities ====================

.PHONY: console
console:
	@echo "🖥️  Opening Foundry console..."
	cd $(CONTRACTS_DIR) && forge console

.PHONY: update
update:
	@echo "⬆️  Updating dependencies..."
	cd $(CONTRACTS_DIR) && forge update

.PHONY: lint
lint:
	@echo "🔍 Linting contracts..."
	cd $(CONTRACTS_DIR) && forge fmt --check
