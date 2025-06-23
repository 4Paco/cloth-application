import * as THREE from 'three/webgpu';
import { OrbitControls } from '@react-three/drei';

export default function Controls() {
    return (
        <OrbitControls
            mouseButtons={{
                LEFT: THREE.MOUSE.ROTATE,
                RIGHT: THREE.MOUSE.PAN,
                MIDDLE: THREE.MOUSE.DOLLY,
            }}
        />
    );
}
