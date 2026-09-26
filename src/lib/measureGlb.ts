import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

/** Blender / glTF gerçek dünya birimi = metre → mm */
export type MeasuredMm = {
  widthMm: number
  depthMm: number
  heightMm: number
}

export async function measureGlbMm(blob: Blob): Promise<MeasuredMm> {
  const url = URL.createObjectURL(blob)
  try {
    const gltf = await new Promise<{ scene: THREE.Object3D }>((resolve, reject) => {
      new GLTFLoader().load(url, resolve, undefined, reject)
    })
    const box = new THREE.Box3().setFromObject(gltf.scene)
    const size = box.getSize(new THREE.Vector3())
    return {
      widthMm: Math.max(1, Math.round(size.x * 1000)),
      depthMm: Math.max(1, Math.round(size.z * 1000)),
      heightMm: Math.max(1, Math.round(size.y * 1000)),
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}
