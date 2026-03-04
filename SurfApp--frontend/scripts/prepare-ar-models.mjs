#!/usr/bin/env node

/**
 * Prepares mobile-safe AR GLB assets for Viro.
 *
 * - Converts source files in assets/models/
 * - Writes optimized files into assets/models/optimized/
 * - Removes animation/skin data and skinned primitives
 * - Simplifies geometry to reduce crash risk on Android devices
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO, Primitive } from "@gltf-transform/core";
import {
  dedup,
  prune,
  quantize,
  simplify,
  textureCompress,
  weld,
} from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "assets", "models");
const OUT_DIR = path.join(SRC_DIR, "optimized");

const MODEL_SOURCE_MAP = {
  paddling: "Paddling.glb",
  pop_up: "Pop-Up.glb",
  stance_balance: "Surfing Stance & Balance.glb",
  safely_falling: "Safely Falling & Dismounting.glb",
  bottom_turn: "The Bottom Turn.glb",
  generating_speed: "Generating Speed (Pumping).glb",
  cutback: "The Cutback.glb",
  tube_riding_stance: "Tube Riding Stance.glb",
  catching_whitewater: "Catching Whitewater Waves.glb",
  catching_green_waves: "Catching Green (Unbroken) Waves.glb",
  trimming_angling: "Trimming & Angling Down the Line.glb",
  floater: "The Floater.glb",
  re_entry_snap: "The Re-entry.glb",
  roundhouse_cutback: "The Roundhouse Cutback.glb",
  air_aerial: "The Air.glb",
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function stripSkinAndAnimation(doc) {
  const root = doc.getRoot();

  for (const animation of [...root.listAnimations()]) {
    animation.dispose();
  }

  for (const node of root.listNodes()) {
    node.setSkin(null);
  }

  for (const skin of [...root.listSkins()]) {
    skin.dispose();
  }

  for (const mesh of [...root.listMeshes()]) {
    for (const primitive of [...mesh.listPrimitives()]) {
      const hasSkinAttrs =
        !!primitive.getAttribute("JOINTS_0") || !!primitive.getAttribute("WEIGHTS_0");
      const isTriangles = primitive.getMode() === Primitive.Mode.TRIANGLES;
      if (hasSkinAttrs || !isTriangles) {
        mesh.removePrimitive(primitive);
        primitive.dispose();
      }
    }

    if (mesh.listPrimitives().length === 0) {
      for (const node of root.listNodes()) {
        if (node.getMesh() === mesh) {
          node.setMesh(null);
        }
      }
      mesh.dispose();
    }
  }
}

async function optimizeModel(inputPath, outputPath) {
  const io = new NodeIO();
  const doc = await io.read(inputPath);

  stripSkinAndAnimation(doc);

  await MeshoptSimplifier.ready;

  await doc.transform(
    dedup(),
    weld({ tolerance: 0.00001 }),
    simplify({
      simplifier: MeshoptSimplifier,
      ratio: 0.03,
      error: 0.2,
      lockBorder: false,
    }),
    textureCompress({
      resize: [2048, 2048],
      quality: 80,
    }),
    quantize({
      quantizePosition: 14,
      quantizeNormal: 10,
      quantizeTexcoord: 12,
      quantizeColor: 8,
      quantizeWeight: 8,
    }),
    prune()
  );

  await io.write(outputPath, doc);
}

async function main() {
  ensureDir(OUT_DIR);

  const entries = Object.entries(MODEL_SOURCE_MAP);
  for (const [modelKey, sourceFile] of entries) {
    const srcPath = path.join(SRC_DIR, sourceFile);
    const outPath = path.join(OUT_DIR, `${modelKey}.glb`);

    if (!fs.existsSync(srcPath)) {
      throw new Error(`Source model missing: ${srcPath}`);
    }

    // Keep progress visible when running in terminal.
    console.log(`[AR] Optimizing ${sourceFile} -> ${path.basename(outPath)}`);
    await optimizeModel(srcPath, outPath);
  }

  console.log("[AR] Model preparation complete.");
}

main().catch((error) => {
  console.error("[AR] Model preparation failed:", error);
  process.exit(1);
});
