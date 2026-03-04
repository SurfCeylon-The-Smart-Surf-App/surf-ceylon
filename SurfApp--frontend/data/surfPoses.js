/**
 * Surfing technique data and local model mapping for AR Experience.
 */

// Use original GLB geometry with sanitized filenames for Metro compatibility.
export const MODEL_MAP = {
  paddling: require("../assets/models/arcore/paddling.glb"),
  pop_up: require("../assets/models/arcore/pop_up.glb"),
  stance_balance: require("../assets/models/arcore/stance_balance.glb"),
  safely_falling: require("../assets/models/arcore/safely_falling.glb"),
  bottom_turn: require("../assets/models/arcore/bottom_turn.glb"),
  generating_speed: require("../assets/models/arcore/generating_speed.glb"),
  cutback: require("../assets/models/arcore/cutback.glb"),
  tube_riding_stance: require("../assets/models/arcore/tube_riding_stance.glb"),
  catching_whitewater: require("../assets/models/arcore/catching_whitewater.glb"),
  catching_green_waves: require("../assets/models/arcore/catching_green_waves.glb"),
  trimming_angling: require("../assets/models/arcore/trimming_angling.glb"),
  floater: require("../assets/models/arcore/floater.glb"),
  re_entry_snap: require("../assets/models/arcore/re_entry_snap.glb"),
  roundhouse_cutback: require("../assets/models/arcore/roundhouse_cutback.glb"),
  air_aerial: require("../assets/models/arcore/air_aerial.glb"),
};

export const AR_DEFAULTS = {
  scale: 0.48,
  position: [0, -0.18, -1.2],
  rotationY: 0,
};

export const SURF_POSES = [
  {
    id: "paddling",
    title: "Paddling Technique & Posture",
    description: "Shows the correct arched back and arm stroke rhythm.",
    icon: "rowing",
    difficulty: "Beginner",
    modelKey: "paddling",
    arDefaults: {
      scale: 0.44,
    },
  },
  {
    id: "pop_up",
    title: "The Pop-Up",
    description: "Demonstrates the explosive transition from lying down to standing.",
    icon: "fitness-center",
    difficulty: "Beginner",
    modelKey: "pop_up",
    arDefaults: {
      scale: 0.5,
    },
  },
  {
    id: "stance_balance",
    title: "Surfing Stance & Balance",
    description: "Displays the ideal low-center-of-gravity stance.",
    icon: "accessibility",
    difficulty: "Beginner",
    modelKey: "stance_balance",
    arDefaults: {
      scale: 0.5,
    },
  },
  {
    id: "safely_falling",
    title: "Safely Falling & Dismounting",
    description: "Teaches how to fall away from the board and protect the head.",
    icon: "shield",
    difficulty: "Beginner",
    modelKey: "safely_falling",
    arDefaults: {
      scale: 0.47,
    },
  },
  {
    id: "bottom_turn",
    title: "The Bottom Turn (Mechanics)",
    description: "Visualizes deep compression and rotation to start a turn.",
    icon: "arrow-downward",
    difficulty: "Intermediate",
    modelKey: "bottom_turn",
    arDefaults: {
      scale: 0.49,
    },
  },
  {
    id: "generating_speed",
    title: "Generating Speed (Pumping)",
    description: "Shows rhythmic weighting and unweighting to gain speed.",
    icon: "speed",
    difficulty: "Intermediate",
    modelKey: "generating_speed",
    arDefaults: {
      scale: 0.49,
    },
  },
  {
    id: "cutback",
    title: "The Cutback (Mechanics)",
    description: "Demonstrates turning back toward the wave's power source.",
    icon: "swap-horiz",
    difficulty: "Intermediate",
    modelKey: "cutback",
    arDefaults: {
      scale: 0.49,
    },
  },
  {
    id: "tube_riding_stance",
    title: "Tube Riding Stance",
    description: "Shows the extreme crouch required to fit inside a barrel.",
    icon: "water",
    difficulty: "Advanced",
    modelKey: "tube_riding_stance",
    arDefaults: {
      scale: 0.49,
    },
  },
  {
    id: "catching_whitewater",
    title: "Catching Whitewater Waves",
    description: "Shows where to position the board on a broken wave.",
    icon: "waves",
    difficulty: "Beginner",
    modelKey: "catching_whitewater",
    arDefaults: {
      scale: 0.49,
    },
  },
  {
    id: "catching_green_waves",
    title: "Catching Green (Unbroken) Waves",
    description: "Visualizes timing and angled takeoff for clean faces.",
    icon: "eco",
    difficulty: "Intermediate",
    modelKey: "catching_green_waves",
    arDefaults: {
      scale: 0.49,
    },
  },
  {
    id: "trimming_angling",
    title: "Trimming & Angling Down the Line",
    description: "Demonstrates the diagonal line to stay ahead of the lip.",
    icon: "timeline",
    difficulty: "Intermediate",
    modelKey: "trimming_angling",
    arDefaults: {
      scale: 0.47,
    },
  },
  {
    id: "floater",
    title: "The Floater",
    description: "Shows the path for riding up and over a breaking section.",
    icon: "flight",
    difficulty: "Advanced",
    modelKey: "floater",
    arDefaults: {
      scale: 0.48,
    },
  },
  {
    id: "re_entry_snap",
    title: "The Re-entry / Snap",
    description: "Visualizes a sharp vertical hit off the top.",
    icon: "rotate-right",
    difficulty: "Advanced",
    modelKey: "re_entry_snap",
    arDefaults: {
      scale: 0.47,
    },
  },
  {
    id: "roundhouse_cutback",
    title: "The Roundhouse Cutback",
    description: "Displays the full figure-8 path and rebound.",
    icon: "loop",
    difficulty: "Advanced",
    modelKey: "roundhouse_cutback",
    arDefaults: {
      scale: 0.46,
    },
  },
  {
    id: "air_aerial",
    title: "The Air / Aerial",
    description: "Demonstrates approach, launch, and landing absorption.",
    icon: "flight-takeoff",
    difficulty: "Advanced",
    modelKey: "air_aerial",
    arDefaults: {
      scale: 0.48,
    },
  },
];

export const POSE_BY_ID = SURF_POSES.reduce((acc, pose) => {
  acc[pose.id] = pose;
  return acc;
}, {});
