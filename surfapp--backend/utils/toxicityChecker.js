const { exec } = require("child_process");
const { promisify } = require("util");
const path = require("path");

const execAsync = promisify(exec);

/**
 * Check if text contains toxic content using Python CLI
 * @param {string} text - Text to check
 * @returns {Promise<{isToxic: boolean, confidence: number}>}
 */
const checkToxicity = async (text) => {
  try {
    // Validate input
    if (!text || typeof text !== "string") {
      return { isToxic: false, confidence: 0 };
    }

    // Limit text length to prevent abuse
    if (text.length > 5000) {
      text = text.substring(0, 5000);
    }

    // Escape text for command line
    const escapedText = text.replace(/"/g, '\\"').replace(/`/g, "\\`");
    const scriptPath = path.join(
      __dirname,
      "..",
      "..",
      "surfapp--ml-engine",
      "check_toxicity_cli.py"
    );

    // Use exec with callback to handle stderr properly
    const result = await new Promise((resolve, reject) => {
      exec(
        `python "${scriptPath}" "${escapedText}"`,
        {
          timeout: 5000,
          maxBuffer: 10 * 1024 * 1024,
        },
        (error, stdout, stderr) => {
          // Ignore stderr warnings, only fail on actual errors
          if (error && !stdout) {
            reject(error);
            return;
          }

          // Extract JSON from stdout
          const lines = stdout.split("\n");
          const jsonLine = lines.find((line) => line.trim().startsWith("{"));

          if (!jsonLine) {
            reject(new Error("No JSON output from toxicity checker"));
            return;
          }

          try {
            resolve(JSON.parse(jsonLine.trim()));
          } catch (parseError) {
            reject(parseError);
          }
        }
      );
    });

    if (result.success) {
      return {
        isToxic: result.is_toxic,
        confidence: result.toxic_probability || 0,
      };
    }

    // If check unsuccessful, default to non-toxic
    console.error("Toxicity check unsuccessful:", result.error);
    return {
      isToxic: false,
      confidence: 0,
    };
  } catch (error) {
    console.error("Toxicity check error:", error.message);
    // If service is unavailable, default to non-toxic to not block users
    return {
      isToxic: false,
      confidence: 0,
    };
  }
};

module.exports = { checkToxicity };
