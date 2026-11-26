// qa.js v6.2 : automatic mistake detector. Run BEFORE the long render:  node tools/qa.cjs <scale 0.2> <f0> <f1> <step>
// "Every thing has its own existence" - nothing may be inside anything else:
//   FOOT_SUNK / FOOT_FLOAT / FOOT_IN_SOLID      feet vs ground, steps, furniture
//   BODY_UNDER_GROUND                           ANY body part (knee, hand, coat hem, hair, elbow...) below the floor/steps
//   BODY_IN_OBJECT / BODY_IN_WALL               17+ points over the whole body vs every collider (furniture, walls, props)
//   BODY_INTERPENETRATION                       a body part of one character inside another character
//   SELF_PENETRATION                            a hand/forearm inside the character's own torso or head
//   PROP_IN_BODY                                a held/placed prop passing through a body (not counting the hand that holds it)
//   ARM_OVERSTRETCH, HAND_OFF_PROP              reach and grips
//   CAMERA_IN_SOLID / CAMERA_TOO_CLOSE / ACTOR_OUT_OF_FRAME / MUST_SEE_MISSING   camera
// env: {actors:[{name,P,r,inFrame,contact:[names]}], terrain, colliders, grips:[...], props:[{name,group,r,holder}], mustSee:[...], penTol, groundTol}
import * as THREE from 'three';
import * as C from './core.js';
export function createQA(env) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  return {
    check(f) {
      const out = [], t = f / C.FPS, A = env.actors || [], add = (type, who, msg) => out.push({ f, t: +t.toFixed(2), type, who, msg });
      const tol = env.penTol ?? 0.035, gtol = env.groundTol ?? 0.02, samples = new Map();
      for (const a of A) { a.P.root.updateMatrixWorld(true); samples.set(a, a.P.bodySamples()); }
      for (const a of A) {
        const P = a.P, S = samples.get(a);
        // ---- ground / steps: every part ----
        for (const s of S) { const g = env.terrain ? env.terrain.at(s.p.x, s.p.z) : 0; const below = g - (s.p.y - s.r);
          if (s.name.startsWith('sole')) { if (below > gtol) add('FOOT_SUNK', a.name, `${s.name} ${below.toFixed(3)} m below the ground/step`); }
          else if (below > gtol + 0.01 && !(a.allowLow && a.allowLow.includes(s.name))) add('BODY_UNDER_GROUND', a.name, `${s.name} is ${(below * 100).toFixed(1)} cm below the floor/step`); }
        for (let i = 0; i < 2; i++) { const w = P.footWorld(i), sole = w.y - 0.078 * P.height, g = env.terrain ? env.terrain.at(w.x, w.z) : 0;
          if (a.grounded !== false && sole > g + 0.12 && !(P.lastPose && P.lastPose.walk != null)) add('FOOT_FLOAT', a.name, `foot ${i ? 'R' : 'L'} ${(sole - g).toFixed(2)} m above ground`);
          if (env.colliders && env.colliders.inside(w.x, sole + 0.05, w.z, 0.0)) add('FOOT_IN_SOLID', a.name, `foot ${i ? 'R' : 'L'} inside a collider`); }
        for (const s of ['L', 'R']) { const d = P.dbg.hands && P.dbg.hands[s]; if (d && d.reach > 0.995 && d.k > 0.9) add('ARM_OVERSTRETCH', a.name, `hand ${s} target out of reach (${d.reach.toFixed(2)}) - move character closer / lean`); }
        // ---- furniture / walls / props ----
        if (env.colliders) { const p = P.root.position; if (env.colliders.inside(p.x, p.y + 0.5, p.z, 0.05)) add('BODY_IN_WALL', a.name, 'body centre inside a collider');
          for (const s of S) { if (s.name.startsWith('sole')) continue; const d = env.colliders.penetration(s.p.x, s.p.y, s.p.z, s.r); if (d.depth > tol) add('BODY_IN_OBJECT', a.name, `${s.name} is ${(d.depth * 100).toFixed(0)} cm inside a solid (furniture/wall/prop) at (${s.p.x.toFixed(2)}, ${s.p.y.toFixed(2)}, ${s.p.z.toFixed(2)})`); } }
        // ---- self penetration: hands vs own torso & head ----
        P.torso.updateWorldMatrix(true, false); for (const h of ['L', 'R']) { const hp = P.handPos[h]; if (!hp) continue; const bd = P.bd, rx = 0.19 * bd.w + 0.01, rz = 0.125 * bd.d + 0.01;
          if (hp.y > 0.0 && hp.y < 0.62) { const q = Math.hypot(hp.x / rx, hp.z / rz); if (q < 0.82) add('SELF_PENETRATION', a.name, `hand ${h} is inside its own torso (${(q * 100).toFixed(0)}% of radius)`); }
          const dh = Math.hypot(hp.x, hp.y - 0.9, hp.z - 0.01); if (dh < 0.172 * (P.sp.headScale || 1) - 0.005) add('SELF_PENETRATION', a.name, `hand ${h} is inside its own head`); }
      }
      // ---- character vs character: every body part against every body part ----
      for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) { const a = A[i], b = A[j]; if (Math.abs(a.P.root.position.y - b.P.root.position.y) > 1.6) continue; let n = 0;
        for (const s1 of samples.get(a)) for (const s2 of samples.get(b)) { if (s1.name.startsWith('sole') || s2.name.startsWith('sole')) continue; if (env.contactOK && env.contactOK(a, b, s1.name, s2.name, f)) continue;
          const d = s1.p.distanceTo(s2.p), pen = s1.r + s2.r - d; if (pen > (env.interTol ?? 0.03) && n < 1) { n++; add('BODY_INTERPENETRATION', a.name + '/' + b.name, `${s1.name} of ${a.name} is ${(pen * 100).toFixed(0)} cm inside ${s2.name} of ${b.name}`); } } }
      // ---- props vs bodies (holder's own hand/forearm excluded) ----
      for (const pr of env.props || []) { pr.group.updateMatrixWorld(true); const c = pr.group.getWorldPosition(new THREE.Vector3()); let n = 0;
        for (const a of A) for (const s of samples.get(a)) { if (a.P === pr.holder && /^(hand|foreArm|elbow|upperArm)/.test(s.name)) continue; if (s.name.startsWith('sole')) continue; const pen = pr.r + s.r - s.p.distanceTo(c); if (pen > (env.propTol ?? 0.035) && n < 1) { n++; add('PROP_IN_BODY', pr.name, `prop ${pr.name} is ${(pen * 100).toFixed(0)} cm inside ${s.name} of ${a.name}`); } } }
      for (const g of env.grips || []) { const pa = g.P.palmWorld(g.hand); const gr = g.prop.grips[g.grip], mir = g.hand === 'R' ? -1 : 1; g.prop.group.updateMatrixWorld(true); const pw = g.prop.group.localToWorld(V(gr.p[0] * mir, gr.p[1], gr.p[2])); if (g.active && !g.active(t)) continue; const e = pa.distanceTo(pw); if (e > 0.035) add('HAND_OFF_PROP', g.P.sp.name || g.hand, `palm ${e.toFixed(3)} m from the grip point of the prop (hand floating / sunk)`); }
      // ---- camera ----
      const cam = C.stage.cam; cam.updateMatrixWorld(true); const cp = cam.position;
      if (env.colliders && env.colliders.inside(cp.x, cp.y, cp.z, 0.12)) add('CAMERA_IN_SOLID', 'camera', `camera at ${cp.toArray().map(v => v.toFixed(2))} is inside/too close to a wall or prop`);
      for (const a of A) { const h = a.P.headWorld(); const d = cp.distanceTo(h); if (d < 0.32) add('CAMERA_TOO_CLOSE', a.name, `camera ${d.toFixed(2)} m from head (clipping)`);
        if (a.inFrame) { const v = h.clone().project(cam); if (Math.abs(v.x) > 1.0 || v.y > 1.0 || v.y < -1.0 || v.z > 1) add('ACTOR_OUT_OF_FRAME', a.name, `head off-screen (${v.x.toFixed(2)}, ${v.y.toFixed(2)})`); } }
      for (const m of env.mustSee || []) { if (t < m.t0 || t > m.t1) continue; for (const tg of m.targets) { const w = tg(t); if (!w) continue; const v = w.clone().project(cam), mg = m.margin ?? 0.92; if (Math.abs(v.x) > mg || Math.abs(v.y) > mg || v.z > 1 || v.z < -1) add('MUST_SEE_MISSING', m.name || 'target', `required subject is off-screen (ndc ${v.x.toFixed(2)}, ${v.y.toFixed(2)})`); } }
      return out;
    },
  };
}
