"""
Blender Python script to generate core.glb
Run from Blender's scripting tab, or:
  blender --background --python generate-glb.py

Produces: public/models/core.glb
"""
import bpy
import os
import math

# Clear scene
bpy.ops.wm.read_factory_settings(use_empty=True)
for obj in bpy.data.objects:
    bpy.data.objects.remove(obj, do_unlink=True)

# ─── Monolith (main cube, elongated) ─────────────────────────────────────────
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
monolith = bpy.context.object
monolith.name = 'Monolith'
monolith.scale = (1.0, 1.0, 1.6)
bpy.ops.object.transform_apply(scale=True)

mat_mono = bpy.data.materials.new('MonolithMat')
mat_mono.use_nodes = True
nodes = mat_mono.node_tree.nodes
links = mat_mono.node_tree.links

# Clear defaults
for n in nodes:
    nodes.remove(n)

# PBR setup
bsdf = nodes.new('ShaderNodeBsdfPrincipled')
bsdf.inputs['Base Color'].default_value = (0.04, 0.05, 0.08, 1)
bsdf.inputs['Metallic'].default_value = 0.85
bsdf.inputs['Roughness'].default_value = 0.15

emission = nodes.new('ShaderNodeEmission')
emission.inputs['Color'].default_value = (0.353, 0.322, 0.839, 1)  # #5A52D6
emission.inputs['Strength'].default_value = 0.3

mix = nodes.new('ShaderNodeMixShader')
mix.inputs['Fac'].default_value = 0.15

out = nodes.new('ShaderNodeOutputMaterial')
links.new(bsdf.outputs[0], mix.inputs[1])
links.new(emission.outputs[0], mix.inputs[2])
links.new(mix.outputs[0], out.inputs[0])
monolith.data.materials.append(mat_mono)

# ─── Outer ring ───────────────────────────────────────────────────────────────
bpy.ops.mesh.primitive_torus_add(
    align='WORLD',
    location=(0, 0, 0),
    rotation=(math.pi/2, 0, 0),
    major_radius=1.6,
    minor_radius=0.012,
    major_segments=80,
    minor_segments=8
)
ring = bpy.context.object
ring.name = 'Ring'

mat_ring = bpy.data.materials.new('RingMat')
mat_ring.use_nodes = True
for n in mat_ring.node_tree.nodes: mat_ring.node_tree.nodes.remove(n)
em = mat_ring.node_tree.nodes.new('ShaderNodeEmission')
em.inputs['Color'].default_value = (0.353, 0.322, 0.839, 1)
em.inputs['Strength'].default_value = 1.5
out2 = mat_ring.node_tree.nodes.new('ShaderNodeOutputMaterial')
mat_ring.node_tree.links.new(em.outputs[0], out2.inputs[0])
ring.data.materials.append(mat_ring)

# ─── Second ring (tilted) ─────────────────────────────────────────────────────
bpy.ops.mesh.primitive_torus_add(
    align='WORLD',
    location=(0, 0, 0),
    rotation=(math.pi/3, 0, math.pi/6),
    major_radius=1.6,
    minor_radius=0.008,
    major_segments=80,
    minor_segments=6
)
ring2 = bpy.context.object
ring2.name = 'Ring2'
mat_ring2 = mat_ring.copy()
mat_ring2.name = 'RingMat2'
for n in mat_ring2.node_tree.nodes:
    if n.type == 'EMISSION':
        n.inputs['Strength'].default_value = 0.8
ring2.data.materials.append(mat_ring2)

# ─── Export ───────────────────────────────────────────────────────────────────
out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'models', 'core.glb')
os.makedirs(os.path.dirname(out_path), exist_ok=True)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format='GLB',
    use_selection=True,
    export_apply=True,
    export_materials='EXPORT',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6
)
print(f"✓ Exported: {out_path}")
