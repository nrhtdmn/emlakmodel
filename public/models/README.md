# Blender modelleri

1. Blender’da modeli metre biriminde hazırla (veya mm → export’ta ölçekle).
2. **File → Export → glTF 2.0 (.glb)**  
   - Transform: +Y Up  
   - Apply modifiers  
3. Dosyayı buraya koy: örn. `sofa.glb`
4. Katalogda `modelUrl: '/models/sofa.glb'` yaz.

Dosya yoksa uygulama yedek (procedural) mesh gösterir — kırılmaz.
