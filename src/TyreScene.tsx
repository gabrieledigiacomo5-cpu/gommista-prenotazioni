// Gomma 3D che gira e rotola mentre si scorre la pagina (three.js caricato solo dopo la pagina).
// Nessun modello scaricato: geometria generata via codice; il cerchio e' dipinto come una ruota di carretto siciliano.
// Se WebGL non e' disponibile o l'utente chiede meno animazioni, resta la ruota disegnata (SVG) e non si carica nulla.
import { useEffect, useRef, useState } from 'react';
import { reducedMotion } from './motion';

const COLORS = { red: '#C1272D', blue: '#1F3A93', green: '#2E7D4F', yellow: '#F2B705', ink: '#14213D' };
const HORSE = 'M70 32 L68 21 L62 33 C56 38 50 45 45 52 C41 57 37 61 35 65 C33 69 35 73 39 74 C43 75 47 73 50 70 C53 67 56 65 59 66 C61 74 60 84 58 92 L84 92 C86 76 84 58 77 43 C75 38 73 35 70 32 Z';
const MANE = 'M73 29 C82 33 89 44 90 58 C91 70 89 82 87 92 L82 92 C85 80 85 66 82 54 C79 45 77 39 72 35 Z';


function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

/** Disegna la faccia del cerchio (raggi colorati, triangoli, mozzo con il cavallo) su una canvas 2D */
function paintRimFace(size: number) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d')!;
  const c = size / 2;
  const R = size / 2;
  g.fillStyle = COLORS.yellow; g.beginPath(); g.arc(c, c, R, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(c, c, R * 0.89, 0, Math.PI * 2); g.fill();
  const spokes = [COLORS.red, COLORS.blue, COLORS.green, COLORS.red, COLORS.blue, COLORS.green, COLORS.red, COLORS.blue, COLORS.green, COLORS.blue];
  spokes.forEach((col, i) => {
    g.save(); g.translate(c, c); g.rotate((i * Math.PI * 2) / 10);
    g.beginPath();
    g.moveTo(-R * 0.07, -R * 0.24); g.lineTo(R * 0.07, -R * 0.24); g.lineTo(R * 0.035, -R * 0.86); g.lineTo(-R * 0.035, -R * 0.86); g.closePath();
    g.fillStyle = col; g.fill(); g.lineWidth = R * 0.016; g.strokeStyle = COLORS.yellow; g.stroke();
    g.restore();
  });
  for (let i = 0; i < 20; i++) {
    g.save(); g.translate(c, c); g.rotate(((i + 0.5) * Math.PI * 2) / 20);
    g.beginPath(); g.moveTo(0, -R * 0.88); g.lineTo(-R * 0.05, -R * 0.8); g.lineTo(R * 0.05, -R * 0.8); g.closePath();
    g.fillStyle = COLORS.red; g.fill(); g.restore();
  }
  [[0.36, COLORS.red], [0.31, COLORS.yellow], [0.27, COLORS.blue]].forEach(([r, col]) => {
    g.fillStyle = col as string; g.beginPath(); g.arc(c, c, R * (r as number), 0, Math.PI * 2); g.fill();
  });
  // cavallo bianco nel mozzo (stesso disegno del logo)
  g.save(); g.translate(c, c); const s = (R * 0.56) / 120; g.scale(s, s); g.translate(-61, -60);
  g.fillStyle = '#ffffff'; g.fill(new Path2D(HORSE)); g.fill(new Path2D(MANE));
  g.restore();
  return cv;
}

export default function TyreScene() {
  const host = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (reducedMotion() || !webglAvailable() || !host.current) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import('three');
      if (disposed || !host.current) return;
      const el = host.current;

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      el.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
      camera.position.set(0, 0, 6);

      scene.add(new THREE.HemisphereLight(0xffffff, 0x445066, 1.4));
      const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(3, 4, 5); scene.add(key);
      const rimLight = new THREE.DirectionalLight(0xffe2a0, 1.2); rimLight.position.set(-4, -2, -3); scene.add(rimLight);

      const tyre = new THREE.Group();
      scene.add(tyre);

      // Spalla e battistrada: profilo della sezione ruotato attorno all'asse (poi asse lungo Z)
      const prof = [[0.64, -0.33], [0.8, -0.37], [0.93, -0.35], [0.99, -0.28], [1.02, -0.12], [1.02, 0.12], [0.99, 0.28], [0.93, 0.35], [0.8, 0.37], [0.64, 0.33]]
        .map(([r, y]) => new THREE.Vector2(r, y));
      const bodyGeo = new THREE.LatheGeometry(prof, 120);
      bodyGeo.rotateX(Math.PI / 2);
      const rubber = new THREE.MeshStandardMaterial({ color: 0x1d1f24, roughness: 0.92, metalness: 0.0 });
      tyre.add(new THREE.Mesh(bodyGeo, rubber));

      // Tasselli del battistrada (due file sfalsate)
      const N = 44;
      const block = new THREE.BoxGeometry(0.13, 0.05, 0.22);
      const tread = new THREE.InstancedMesh(block, rubber, N * 2);
      const m = new THREE.Matrix4(); const q = new THREE.Quaternion(); const p = new THREE.Vector3(); const sc = new THREE.Vector3(1, 1, 1);
      for (let i = 0; i < N * 2; i++) {
        const row = i < N ? 0 : 1;
        const a = ((i % N) + row * 0.5) * (Math.PI * 2 / N);
        p.set(Math.cos(a) * 1.03, Math.sin(a) * 1.03, row ? -0.14 : 0.14);
        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a + Math.PI / 2 + (row ? 0.25 : -0.25));
        m.compose(p, q, sc); tread.setMatrixAt(i, m);
      }
      tyre.add(tread);

      // Cerchio: canale giallo + faccia dipinta (davanti e dietro)
      const barrel = new THREE.CylinderGeometry(0.64, 0.64, 0.62, 64, 1, true); barrel.rotateX(Math.PI / 2);
      tyre.add(new THREE.Mesh(barrel, new THREE.MeshStandardMaterial({ color: COLORS.yellow, roughness: 0.45, metalness: 0.35, side: THREE.DoubleSide })));
      const tex = new THREE.CanvasTexture(paintRimFace(1024)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const faceMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.1 });
      const front = new THREE.Mesh(new THREE.CircleGeometry(0.64, 96), faceMat); front.position.z = 0.24; tyre.add(front);
      const back = front.clone(); back.rotation.y = Math.PI; back.position.z = -0.24; tyre.add(back);
      const lip = new THREE.TorusGeometry(0.645, 0.025, 12, 96);
      const lipMat = new THREE.MeshStandardMaterial({ color: COLORS.blue, roughness: 0.4, metalness: 0.3 });
      const lipF = new THREE.Mesh(lip, lipMat); lipF.position.z = 0.26; tyre.add(lipF);
      const lipB = lipF.clone(); lipB.position.z = -0.26; tyre.add(lipB);

      // Dimensioni e scorrimento
      let w = 1; let h = 1;
      const resize = () => {
        w = el.clientWidth; h = el.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h; camera.updateProjectionMatrix();
      };
      resize();
      window.addEventListener('resize', resize);

      const smooth = (x: number) => x * x * (3 - 2 * x);
      const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
      let visible = true;
      let raf = 0;
      let last = performance.now();
      let idle = 0;
      let rollTarget = 0; let roll = 0;

      const frame = (now: number) => {
        raf = 0;
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        const y = window.scrollY;
        const vh = window.innerHeight;
        const wide = w / h > 1.15;
        const t = smooth(clamp(y / (vh * 0.85)));
        idle += dt * 0.25;
        rollTarget = -y * 0.006;                 // rotola con lo scroll (segno: avanza verso destra)
        roll += (rollTarget - roll) * Math.min(1, dt * 8);
        tyre.rotation.z = roll - idle;
        tyre.rotation.y = -0.35 - t * 0.85;      // si gira e mostra il battistrada
        tyre.rotation.x = 0.12 + t * 0.25;
        if (wide) {
          tyre.position.set(1.55 + t * 0.55, 0.15 - t * 0.35, 0);
          tyre.scale.setScalar(1.15 - t * 0.25);
        } else {
          // telefono: in alto a destra, sopra il nome; scorrendo sale ed esce rotolando
          tyre.position.set(0.4 + t * 1.4, 1.02 + t * 2.6, 0);
          tyre.scale.setScalar(0.6 - t * 0.12);
        }
        el.style.opacity = wide ? '1' : String(1 - clamp((y / vh - 0.55) * 2.2));
        renderer.render(scene, camera);
        if (visible && !document.hidden) raf = requestAnimationFrame(frame);
      };
      const start = () => { if (!raf && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(frame); } };
      const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
      const onVis = () => (document.hidden ? stop() : start());
      const onScroll = () => {
        // Sul telefono la gomma esce di scena: oltre ~1,2 schermate si smette di disegnare
        const wide = w / h > 1.15;
        const wasVisible = visible;
        visible = wide || window.scrollY < window.innerHeight * 1.25;
        if (visible && !wasVisible) start();
        if (!visible) { el.style.opacity = '0'; stop(); }
      };
      document.addEventListener('visibilitychange', onVis);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      start();
      setReady(true);
      if (import.meta.env.DEV) (window as unknown as { __tyre: unknown }).__tyre = { tyre, camera, THREE };

      cleanup = () => {
        stop();
        window.removeEventListener('resize', resize);
        window.removeEventListener('scroll', onScroll);
        document.removeEventListener('visibilitychange', onVis);
        renderer.dispose(); tex.dispose();
        el.removeChild(renderer.domElement);
      };
    })().catch(() => { /* WebGL o caricamento falliti: resta la ruota disegnata */ });

    return () => { disposed = true; cleanup(); };
  }, []);

  return (
    <>
      <div ref={host} className="tyre-3d" aria-hidden="true" />
      {!ready && <img className="tyre-fallback" src="./ruota.svg" alt="" aria-hidden="true" />}
    </>
  );
}
