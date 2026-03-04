"""
gen-model.py — Blender 3.6+ Python script
Generates core.glb: a clean low-poly monolith/cube for the Three.js section.

USAGE in Blender:
  1. Open Blender
  2. Go to Scripting workspace
  3. Paste this script
  4. Click "Run Script"
  5. File will be saved to /tmp/core.glb (or adjust OUT_PATH below)
  6. Copy core.glb → public/models/core.glb

ALTERNATIVE (headless):
  blender --background --python scripts/gen-model.py
"""

import bpy
import math
import os

OUT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../public/models/core.glb')

# ── Clear scene ────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# ── Create monolith (tall box, ratio ~1:1.6:1) ────────────────
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
monolith = bpy.context.active_object
monolith.name = 'ReframeCore'
monolith.scale = (1.0, 1.6, 1.0)
bpy.ops.object.transform_apply(scale=True)

# ── Bevel edges slightly ──────────────────────────────────────
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.bevel(offset=0.04, segments=2)
bpy.ops.object.mode_set(mode='OBJECT')

# ── Material: dark metallic with emissive edge ────────────────
mat = bpy.data.materials.new(name='CoreMaterial')
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links

# Clear defaults
for n in nodes: nodes.remove(n)

# BSDF
bsdf = nodes.new('ShaderNodeBsdfPrincipled')
bsdf.location = (0, 0)
bsdf.inputs['Base Color'].default_value = (0.067, 0.071, 0.114, 1.0)  # #111223
bsdf.inputs['Metallic'].default_value = 0.85
bsdf.inputs['Roughness'].default_value = 0.18
bsdf.inputs['Emission Color'].default_value = (0.353, 0.322, 0.839, 1.0)  # #5A52D6
bsdf.inputs['Emission Strength'].default_value = 0.15

output = nodes.new('ShaderNodeOutputMaterial')
output.location = (300, 0)
links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])

monolith.data.materials.append(mat)

# ── Subdivision (smooth appearance in Three.js) ───────────────
# Not needed for low-poly — keep clean

# ── Export GLB ────────────────────────────────────────────────
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath=OUT_PATH,
    export_format='GLB',
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False,
    use_selection=False,
)

print(f"✓ Exported: {OUT_PATH}")
