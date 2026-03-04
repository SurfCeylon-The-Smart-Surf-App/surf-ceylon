import React from 'react';
import { View } from 'react-native';

/**
 * @typedef {Object} SafeLinearGradientProps
 * @property {string[]} colors
 * @property {{x: number, y: number}} [start]
 * @property {{x: number, y: number}} [end]
 * @property {import('react-native').ViewStyle|import('react-native').ViewStyle[]} [style]
 * @property {React.ReactNode} [children]
 */

// Cache the LinearGradient component and availability
let LinearGradientComponent = null;
let gradientAvailable = false;

// Force fallback mode until app is rebuilt with native module
// Set to true to enable LinearGradient after rebuilding with: npx expo run:android
const FORCE_FALLBACK_MODE = true;

// Try to load LinearGradient once at module load time (only if not forcing fallback)
if (!FORCE_FALLBACK_MODE) {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a9af6247-da90-472c-8617-bf1275ff3bd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SafeLinearGradient.jsx:20',message:'Attempting to import LinearGradient',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const { LinearGradient } = require('expo-linear-gradient');
    LinearGradientComponent = LinearGradient;
    gradientAvailable = true;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a9af6247-da90-472c-8617-bf1275ff3bd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SafeLinearGradient.jsx:27',message:'LinearGradient imported successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a9af6247-da90-472c-8617-bf1275ff3bd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SafeLinearGradient.jsx:31',message:'LinearGradient import failed, will use fallback',data:{error:error?.toString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    gradientAvailable = false;
  }
} else {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a9af6247-da90-472c-8617-bf1275ff3bd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SafeLinearGradient.jsx:35',message:'Fallback mode forced - native module not linked yet',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  gradientAvailable = false;
}

/**
 * Safe LinearGradient wrapper that falls back to solid color if native module fails
 * This prevents crashes when expo-linear-gradient native module is not properly linked
 * @param {SafeLinearGradientProps} props
 */
export default function SafeLinearGradient({ colors, start, end, style, children }) {
  // Always use fallback if LinearGradient is not available or forced fallback mode
  if (!gradientAvailable || !LinearGradientComponent || FORCE_FALLBACK_MODE) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a9af6247-da90-472c-8617-bf1275ff3bd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SafeLinearGradient.jsx:48',message:'Using fallback View - LinearGradient not available or forced fallback',data:{color:colors[0],forced:FORCE_FALLBACK_MODE},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    return (
      <View style={[{ backgroundColor: colors[0] || '#667eea' }, style]}>
        {children}
      </View>
    );
  }

  // Try to render LinearGradient only if available and not forced to fallback
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/a9af6247-da90-472c-8617-bf1275ff3bd4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SafeLinearGradient.jsx:59',message:'Rendering LinearGradient component',data:{colors:colors[0]},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // Use LinearGradient if available
  return (
    <LinearGradientComponent
      colors={colors}
      start={start}
      end={end}
      style={style}
    >
      {children}
    </LinearGradientComponent>
  );
}

