// /**
//  * Python Script Runner Utility
//  * Executes Python ML scripts directly from Node.js backend
//  * Eliminates the need to run a separate ML Flask server
//  */

// const { spawn } = require('child_process');
// const path = require('path');

// // Path to ML engine directory
// const ML_ENGINE_PATH = path.join(__dirname, '../../surfapp--ml-engine');

// // Detect Python command (python or python3)
// const PYTHON_CMD = process.platform === 'win32' ? 'python' : 'python3';

// /**
//  * Execute a Python script and return the result
//  * @param {string} scriptName - Name of the Python script (without .py)
//  * @param {object} args - Arguments to pass to the script as JSON
//  * @returns {Promise<object>} - Parsed JSON result from Python
//  */
// const runPythonScript = (scriptName, args = {}) => {
//   return new Promise((resolve, reject) => {
//     const scriptPath = path.join(ML_ENGINE_PATH, `${scriptName}.py`);
    
//     // Pass arguments as JSON string via stdin
//     const argsJson = JSON.stringify(args);
    
//     console.log(`🐍 Running Python script: ${scriptName}`);
//     console.log(`📁 Script path: ${scriptPath}`);
    
//     const pythonProcess = spawn(PYTHON_CMD, [
//       '-c',
//       `
// import sys
// import json
// sys.path.insert(0, r'${ML_ENGINE_PATH}')

// # Read input arguments
// input_args = json.loads('''${argsJson}''')

// # Import and run the appropriate function
// if '${scriptName}' == 'analyze_hazard':
//     from analyze_hazard import analyze_hazard_image
//     result = analyze_hazard_image(input_args.get('image_path'), input_args.get('hazard_type'))
// elif '${scriptName}' == 'predict_risk':
//     from predict_risk import predict_risk_score
//     result = predict_risk_score(input_args.get('spot_name'))
// elif '${scriptName}' == 'update_risk_scores':
//     from predict_risk import update_all_risk_scores
//     result = update_all_risk_scores()
// elif '${scriptName}' == 'calculate_skill_risk':
//     from calculate_skill_risk import update_all_skill_level_risks
//     result = update_all_skill_level_risks()
// else:
//     result = {'error': 'Unknown script'}

// print(json.dumps(result))
//       `
//     ], {
//       cwd: ML_ENGINE_PATH,
//       env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
//     });

//     let stdout = '';
//     let stderr = '';

//     pythonProcess.stdout.on('data', (data) => {
//       stdout += data.toString();
//     });

//     pythonProcess.stderr.on('data', (data) => {
//       stderr += data.toString();
//     });

//     pythonProcess.on('close', (code) => {
//       if (code !== 0) {
//         console.error(`❌ Python script error (exit code ${code}):`, stderr);
//         reject(new Error(stderr || `Python script exited with code ${code}`));
//         return;
//       }

//       try {
//         // Find JSON in output (skip any non-JSON output)
//         const jsonMatch = stdout.match(/\{[\s\S]*\}/);
//         if (jsonMatch) {
//           const result = JSON.parse(jsonMatch[0]);
//           console.log(`✅ Python script completed:`, scriptName);
//           resolve(result);
//         } else {
//           console.log(`⚠️ No JSON output from Python script`);
//           resolve({ success: true, output: stdout });
//         }
//       } catch (parseError) {
//         console.error('❌ Failed to parse Python output:', stdout);
//         reject(new Error(`Failed to parse Python output: ${parseError.message}`));
//       }
//     });

//     pythonProcess.on('error', (error) => {
//       console.error('❌ Failed to start Python process:', error);
//       reject(error);
//     });
//   });
// };

// /**
//  * Analyze hazard image using ML
//  * @param {string} imagePath - Path to the image file
//  * @param {string} hazardType - Type of hazard being reported
//  */
// const analyzeHazardImage = async (imagePath, hazardType) => {
//   try {
//     return await runPythonScript('analyze_hazard', {
//       image_path: imagePath,
//       hazard_type: hazardType
//     });
//   } catch (error) {
//     console.error('❌ Hazard analysis failed:', error.message);
//     return {
//       detectedHazards: ['Analysis unavailable'],
//       confidenceScore: 0,
//       aiSuggestions: 'ML analysis could not be performed'
//     };
//   }
// };

// /**
//  * Predict risk score for a surf spot
//  * @param {string} spotName - Name of the surf spot
//  */
// const predictRiskScore = async (spotName) => {
//   try {
//     return await runPythonScript('predict_risk', { spot_name: spotName });
//   } catch (error) {
//     console.error('❌ Risk prediction failed:', error.message);
//     return null;
//   }
// };

// /**
//  * Update all risk scores after new hazard report
//  */
// const updateAllRiskScores = async () => {
//   try {
//     return await runPythonScript('update_risk_scores', {});
//   } catch (error) {
//     console.error('❌ Risk score update failed:', error.message);
//     return null;
//   }
// };

// /**
//  * Update skill-level specific risks for all spots
//  */
// const updateSkillLevelRisks = async () => {
//   try {
//     return await runPythonScript('calculate_skill_risk', {});
//   } catch (error) {
//     console.error('❌ Skill risk update failed:', error.message);
//     return null;
//   }
// };

// module.exports = {
//   runPythonScript,
//   analyzeHazardImage,
//   predictRiskScore,
//   updateAllRiskScores,
//   updateSkillLevelRisks
// };