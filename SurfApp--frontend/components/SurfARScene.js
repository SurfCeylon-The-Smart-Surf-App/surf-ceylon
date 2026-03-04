import React from "react";
import {
  Viro3DObject,
  ViroAmbientLight,
  ViroARScene,
  ViroBox,
  ViroDirectionalLight,
  ViroMaterials,
  ViroNode,
  ViroOmniLight,
  ViroText,
} from "@reactvision/react-viro";
import { AR_DEFAULTS, MODEL_MAP } from "../data/surfPoses";

ViroMaterials.createMaterials({
  placeholderBlue: {
    diffuseColor: "#2563eb",
    lightingModel: "Lambert",
  },
});

export default function SurfARScene(props) {
  const appProps = props.sceneNavigator.viroAppProps || {};
  const modelKey = appProps.modelKey;
  const poseTitle = appProps.poseTitle || "Surf Technique";
  const scale = typeof appProps.scale === "number" ? appProps.scale : AR_DEFAULTS.scale;
  const rotationY =
    typeof appProps.rotationY === "number" ? appProps.rotationY : AR_DEFAULTS.rotationY;
  const modelPosition =
    Array.isArray(appProps.position) && appProps.position.length === 3
      ? appProps.position
      : AR_DEFAULTS.position;
  const modelSource = modelKey ? MODEL_MAP[modelKey] : null;

  return (
    <ViroARScene>
      <ViroAmbientLight color="#ffffff" intensity={70} />
      <ViroDirectionalLight
        color="#fff4df"
        direction={[0.2, -1, -0.3]}
        intensity={430}
        castsShadow={true}
        shadowOpacity={0.35}
        shadowMapSize={1024}
        shadowNearZ={0.1}
        shadowFarZ={5}
      />
      <ViroOmniLight
        color="#dbeafe"
        position={[0.6, 0.4, -0.4]}
        intensity={130}
        attenuationStartDistance={0.5}
        attenuationEndDistance={3.5}
      />
      <ViroDirectionalLight color="#b3e5ff" direction={[-0.6, -0.25, 0.8]} intensity={240} />

      <ViroNode
        position={modelPosition}
        rotation={[0, rotationY, 0]}
        scale={[scale, scale, scale]}
      >
        {modelSource ? (
          <Viro3DObject
            source={modelSource}
            type="GLB"
            onLoadStart={() => console.log("[SurfARScene] Load start:", modelKey)}
            onLoadEnd={() => console.log("[SurfARScene] Load end:", modelKey)}
            onError={(event) =>
              console.warn("[SurfARScene] Model error:", modelKey, event?.nativeEvent)
            }
          />
        ) : (
          <ViroBox
            width={0.4}
            height={0.4}
            length={0.4}
            position={[0, 0.2, 0]}
            materials={["placeholderBlue"]}
          />
        )}

        <ViroText
          text={poseTitle}
          position={[0, 1.15, 0]}
          width={2}
          height={0.4}
          style={{
            fontSize: 13,
            color: "#ffffff",
            textAlign: "center",
            textAlignVertical: "center",
            fontWeight: "bold",
          }}
        />
      </ViroNode>
    </ViroARScene>
  );
}
