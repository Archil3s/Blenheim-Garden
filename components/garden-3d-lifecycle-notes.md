# WebGL lifecycle requirements

When integrating #44, all generated Mesh/Geometry/Material/Texture objects must remain reachable from the content/scene lifecycle and disposed on rebuild/unmount. Do not create per-frame materials. Fine-detail helpers should run only during scene construction, not inside the animation loop.
