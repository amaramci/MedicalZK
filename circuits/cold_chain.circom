pragma circom 2.0.0;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

// Proves that ALL N temperature readings are within [minTemp, maxTemp]
// Temperatures are scaled by 100 to avoid floats (2.5°C = 250)
// Private inputs: readings (actual temperatures * 100)
// Public inputs: minTemp, maxTemp (also * 100), commitment (Poseidon hash)
template ColdChain(N) {
    // Private inputs - actual temperature readings (scaled *100)
    signal input readings[N];

    // Public inputs
    signal input minTemp;   // minimum allowed temperature * 100
    signal input maxTemp;   // maximum allowed temperature * 100
    signal input commitment; // Poseidon hash of all readings

    // Internal signals for range checks
    signal geMin[N];
    signal leMax[N];
    signal inRange[N];

    // Accumulated product: 1 if all in range, 0 if any out
    signal accum[N+1];
    accum[0] <== 1;

    // LessEqThan is unsigned — backend applies CIRCUIT_OFFSET=4000 before calling circuit:
    //   -40°C * 100 + 4000 = 0   (floor)
    //   +50°C * 100 + 4000 = 9000 (ceiling)
    // LessEqThan(17) supports 0..131071, so 9000 fits comfortably.

    component gtMin[N];   // reading >= minTemp  ⟺  minTemp <= reading
    component ltMax[N];   // reading <= maxTemp  ⟺  reading <= maxTemp

    for (var i = 0; i < N; i++) {
        // Check minTemp <= readings[i]
        gtMin[i] = LessEqThan(17);
        gtMin[i].in[0] <== minTemp;
        gtMin[i].in[1] <== readings[i];
        geMin[i] <== gtMin[i].out;

        // Check readings[i] <= maxTemp
        ltMax[i] = LessEqThan(17);
        ltMax[i].in[0] <== readings[i];
        ltMax[i].in[1] <== maxTemp;
        leMax[i] <== ltMax[i].out;

        // Both must be 1
        inRange[i] <== geMin[i] * leMax[i];

        // Accumulate: if any reading is out of range, accum goes to 0
        accum[i+1] <== accum[i] * inRange[i];
    }

    // Final accumulator must equal 1 (all readings in range)
    accum[N] === 1;

    // Compute Poseidon hash of all readings and verify against public commitment
    component poseidon = Poseidon(N);
    for (var i = 0; i < N; i++) {
        poseidon.inputs[i] <== readings[i];
    }

    // The computed hash must match the public commitment
    commitment === poseidon.out;
}

// Instantiate with N=10 readings
component main {public [minTemp, maxTemp, commitment]} = ColdChain(10);
