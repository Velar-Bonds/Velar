'use client';

// Aurora.tsx — fondo WebGL animado (northern lights) con ogl.
// Adaptado de https://www.reactbits.dev/backgrounds/aurora
// Paleta por defecto alineada a la marca VELAR (azules sobre navy).
import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Color } from 'ogl';

const VERT = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const FRAG = `
precision highp float;
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uAmplitude;
uniform float uBlend;
varying vec2 vUv;

vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  float t = uTime * 0.3;
  vec2 uv = vUv;

  float n1 = snoise(vec3(uv * 1.2, t * 0.5)) * uAmplitude;
  float n2 = snoise(vec3(uv * 2.0 + 1.7, t * 0.4)) * uAmplitude * 0.6;
  float n3 = snoise(vec3(uv * 0.8 - 0.5, t * 0.6)) * uAmplitude * 0.8;

  float band1 = smoothstep(0.2, 0.8, uv.y + n1 * 0.4);
  float band2 = smoothstep(0.0, 0.6, uv.y + n2 * 0.3 - 0.1);
  float band3 = smoothstep(0.4, 1.0, uv.y + n3 * 0.3 + 0.1);

  vec3 col = mix(uColor3, uColor1, band1);
  col = mix(col, uColor2, band2 * 0.5);
  col = mix(col, uColor3, band3 * uBlend * 0.4);

  gl_FragColor = vec4(col, 1.0);
}
`;

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  speed?: number;
}

export default function Aurora({
  // Azul marca (band alta) · cian aurora (band media) · navy profundo (base).
  colorStops = ['#1f63ff', '#38bdf8', '#020617'],
  amplitude = 1.2,
  blend = 0.6,
  speed = 0.8,
}: AuroraProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Creamos un canvas propio (no uno reutilizado por React). Asi cada montaje
    // obtiene un contexto WebGL limpio y al desmontar lo liberamos por completo,
    // evitando que StrictMode/HMR o alternar login<->signup agoten los contextos.
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    host.appendChild(canvas);

    const renderer = new Renderer({ canvas, alpha: false, antialias: false });
    const gl = renderer.gl;

    // Dimensionar segun el contenedor padre (no el propio canvas: ogl le fija
    // un width inline en px, lo que rompe el seguimiento en resizes posteriores).
    const handleResize = () => {
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
    };
    handleResize();

    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handleResize) : null;
    ro?.observe(host);
    window.addEventListener('resize', handleResize);

    const parseColor = (hex: string) => {
      const c = new Color(hex);
      return [c.r, c.g, c.b];
    };

    const [c1, c2, c3] = colorStops.map(parseColor);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: c1 },
        uColor2: { value: c2 },
        uColor3: { value: c3 },
        uAmplitude: { value: amplitude },
        uBlend: { value: blend },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    // Respetar a quienes prefieren menos movimiento: dibujamos un frame estatico.
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    let rafId = 0;
    const start = performance.now();

    const draw = () => {
      // Si el contexto se perdio (p.ej. limite de WebGL del navegador), abortamos
      // en silencio en vez de dejar que ogl lance y rompa la pagina.
      if (gl.isContextLost()) {
        cancelAnimationFrame(rafId);
        return;
      }
      program.uniforms.uTime.value = ((performance.now() - start) / 1000) * speed;
      renderer.render({ scene: mesh });
    };

    if (reduceMotion) {
      program.uniforms.uTime.value = 0;
      draw();
    } else {
      const loop = () => {
        rafId = requestAnimationFrame(loop);
        draw();
      };
      loop();
    }

    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
      window.removeEventListener('resize', handleResize);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
    // colorStops/amplitude/blend/speed son estaticos en este uso (fondo de auth).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />;
}
