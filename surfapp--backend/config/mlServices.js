/**
 * ML Services Manager
 * Automatically spawns and manages Python ML services when backend starts
 */

const { spawn } = require("child_process");
const {
  PYTHON_EXECUTABLE,
  AR_PREDICTION_SCRIPT,
  CARDIO_ML_SCRIPT,
} = require("./python.js");

// Track spawned processes
const mlProcesses = {
  arPrediction: null,
  cardioML: null,
};

/**
 * Spawn a Python ML service
 * @param {string} name - Service name for logging
 * @param {string} script - Path to Python script
 * @param {number} port - Expected port number
 * @returns {ChildProcess} - Spawned process
 */
function spawnMLService(name, script, port) {
  console.log(`\n🚀 Starting ${name} on port ${port}...`);
  console.log(`   Python: ${PYTHON_EXECUTABLE}`);
  console.log(`   Script: ${script}`);

  const childProcess = spawn(PYTHON_EXECUTABLE, [script], {
    stdio: ["ignore", "pipe", "pipe"],
    detached: false,
    shell: false,
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",  // Fix Unicode emoji issues on Windows
      PYTHONUNBUFFERED: "1",       // Disable output buffering
    },
  });

  // Handle stdout
  childProcess.stdout.on("data", (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[${name}] ${output}`);
    }
  });

  // Handle stderr
  childProcess.stderr.on("data", (data) => {
    const error = data.toString().trim();
    if (error && !error.includes("WARNING")) {
      console.error(`[${name}] ⚠️  ${error}`);
    }
  });

  // Handle process exit
  childProcess.on("exit", (code, signal) => {
    if (code !== 0 && code !== null) {
      console.error(`[${name}] ❌ Exited with code ${code}`);
    } else if (signal) {
      console.log(`[${name}] 🛑 Terminated by signal ${signal}`);
    } else {
      console.log(`[${name}] ✅ Stopped gracefully`);
    }
  });

  // Handle process errors
  childProcess.on("error", (error) => {
    console.error(`[${name}] ❌ Failed to start: ${error.message}`);
  });

  console.log(`✅ ${name} started (PID: ${childProcess.pid})`);
  return childProcess;
}

/**
 * Start all ML services
 */
function startMLServices() {
  console.log("\n" + "=".repeat(80));
  console.log("🤖 STARTING ML SERVICES");
  console.log("=".repeat(80));

  try {
    // Start AR Prediction Service (port 5003)
    mlProcesses.arPrediction = spawnMLService(
      "AR Prediction Service",
      AR_PREDICTION_SCRIPT,
      5003
    );

    // Start Cardio ML Server (port 5006)
    mlProcesses.cardioML = spawnMLService(
      "Cardio ML Server",
      CARDIO_ML_SCRIPT,
      5006
    );

    console.log("\n" + "=".repeat(80));
    console.log("✅ ML SERVICES INITIALIZED");
    console.log("   - AR Prediction Service: http://localhost:5003");
    console.log("   - Cardio ML Server: http://localhost:5006");
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("❌ Error starting ML services:", error.message);
  }
}

/**
 * Stop all ML services
 */
function stopMLServices() {
  console.log("\n🛑 Stopping ML services...");

  Object.entries(mlProcesses).forEach(([name, childProcess]) => {
    if (childProcess && !childProcess.killed) {
      try {
        childProcess.kill("SIGTERM");
        console.log(`   ✅ Stopped ${name}`);
      } catch (error) {
        console.error(`   ❌ Error stopping ${name}:`, error.message);
      }
    }
  });

  console.log("✅ ML services stopped\n");
}

/**
 * Graceful shutdown handler
 */
function setupShutdownHandlers() {
  // Handle Ctrl+C
  process.on("SIGINT", () => {
    console.log("\n\n📡 Received SIGINT, shutting down gracefully...");
    stopMLServices();
    process.exit(0);
  });

  // Handle termination
  process.on("SIGTERM", () => {
    console.log("\n\n📡 Received SIGTERM, shutting down gracefully...");
    stopMLServices();
    process.exit(0);
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (error) => {
    console.error("\n❌ Uncaught Exception:", error);
    stopMLServices();
    process.exit(1);
  });
}

module.exports = {
  startMLServices,
  stopMLServices,
  setupShutdownHandlers,
  mlProcesses,
};
