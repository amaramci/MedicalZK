// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ColdChainVerifier
 * @notice On-chain registry for ZK-verified cold chain shipments.
 *
 * The contract stores the verification status keyed by the Poseidon
 * commitment that was proved in the Groth16 circuit.  Only the owner
 * (e.g. the backend oracle) may submit new results; anyone may query
 * whether a commitment has been verified.
 *
 * Full on-chain Groth16 verification is omitted here (that would require
 * the auto-generated Verifier.sol from snarkjs).  Instead the backend
 * verifies off-chain and then calls submitProof() as a trusted oracle.
 * A TODO shows where to plug in on-chain verification.
 */
contract ColdChainVerifier {
    // ── State ──────────────────────────────────────────────────────────────────
    address public owner;

    struct ShipmentProof {
        bool submitted;
        bool isValid;
        uint256 submittedAt;
        string medicineName;
    }

    /// commitment (from Poseidon hash) → proof result
    mapping(bytes32 => ShipmentProof) public proofs;

    /// List of all submitted commitments (for enumeration)
    bytes32[] public commitmentList;

    // ── Events ─────────────────────────────────────────────────────────────────
    event ProofSubmitted(
        bytes32 indexed commitment,
        bool isValid,
        string medicineName,
        uint256 timestamp
    );

    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

    // ── Modifiers ──────────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "ColdChainVerifier: caller is not owner");
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
    }

    // ── Owner functions ────────────────────────────────────────────────────────

    /**
     * @notice Submit the verification result for a shipment.
     * @param commitment  Poseidon hash of the temperature readings (as bytes32)
     * @param isValid     true if all readings were within range
     * @param medicineName Human-readable drug name (stored as metadata)
     *
     * TODO: Replace the isValid parameter with actual Groth16 proof inputs
     *       and call the auto-generated Verifier.sol from snarkjs here.
     */
    function submitProof(
        bytes32 commitment,
        bool isValid,
        string calldata medicineName
    ) external onlyOwner {
        if (!proofs[commitment].submitted) {
            commitmentList.push(commitment);
        }

        proofs[commitment] = ShipmentProof({
            submitted: true,
            isValid: isValid,
            submittedAt: block.timestamp,
            medicineName: medicineName
        });

        emit ProofSubmitted(commitment, isValid, medicineName, block.timestamp);
    }

    /**
     * @notice Transfer ownership to a new address.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ColdChainVerifier: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ── View functions ─────────────────────────────────────────────────────────

    /**
     * @notice Check whether a commitment has been verified on-chain.
     * @param commitment  Poseidon hash of the temperature readings
     * @return True if the commitment was submitted and is valid.
     */
    function isShipmentVerified(bytes32 commitment) external view returns (bool) {
        ShipmentProof storage p = proofs[commitment];
        return p.submitted && p.isValid;
    }

    /**
     * @notice Get full proof record for a commitment.
     */
    function getProof(bytes32 commitment)
        external
        view
        returns (
            bool submitted,
            bool isValid,
            uint256 submittedAt,
            string memory medicineName
        )
    {
        ShipmentProof storage p = proofs[commitment];
        return (p.submitted, p.isValid, p.submittedAt, p.medicineName);
    }

    /**
     * @notice Total number of commitments ever submitted.
     */
    function totalSubmitted() external view returns (uint256) {
        return commitmentList.length;
    }
}
