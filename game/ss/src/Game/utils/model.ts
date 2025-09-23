import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { Cache } from '@/Game/utils/cache';
export interface ModelResult {
    scene: THREE.Group;
    animations?: THREE.AnimationClip[] | [];
}

// GLB/GLTF ve Texture yükleyicileri
const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
export const cache: Record<any, any> = new Cache();
// 3D modeli (GLB/GLTF) yükle ve basit bir önbellekte sakla
export const load3DModel = (path: string, iscache: boolean = true): Promise<ModelResult> => {
    if (cache.cacheData[path] && iscache) {
        return cache.cacheData[path];
    }
    return new Promise(async resolve => {
        const { scene, animations } = await gltfLoader.loadAsync(path);
        cache.cacheData[path] = { scene, animations };
        resolve({ scene, animations });
    });
};

// Doku (texture) yükle ve önbelleğe al
export const textureload = (path: string): Promise<THREE.Texture> => {
    if (cache.cacheData[path]) {
        return cache.cacheData[path];
    }
    return new Promise(async resolve => {
        const texture = await textureLoader.loadAsync(path);
        cache.cacheData[path] = texture;
        resolve(texture);
    });
};
