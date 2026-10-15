import * as T from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const palette = {
  wood: '#d6aa70', edge: '#e4bd84', deck: '#344552',
  rubber: '#293943', gold: '#dda644', slot: '#344552', arrow: '#efe6d2',
  brassRim: '#aa7938',
};
const materials = Object.fromEntries(Object.entries(palette).map(([name, color]) => [name,
  new T.MeshStandardMaterial({ name: 'Play_' + name, color: new T.Color(color).convertSRGBToLinear(),
    roughness: name === 'gold' ? .48 : .76, metalness: name === 'gold' ? .35 : 0,
    side: name === 'deck' || name === 'arrow' ? T.DoubleSide : T.FrontSide })]));

function add(group, name, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const object = new T.Mesh(geometry, materials[material]);
  object.name = name;
  object.position.fromArray(position);
  object.rotation.set(...rotation);
  object.userData.assetGroup = 'play-ramp';
  group.add(object);
  return object;
}
function rounded(group, name, size, material, position, radius = .003) {
  return add(group, name, new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map(value => value / 3))), material, position);
}
function panelGeometry() {
  const x = .1375, front = .193, rear = -.182;
  const topFront = .003, topRear = .128, bottomFront = .0012, bottomRear = .121;
  const rlt = [-x, topRear, rear], rrt = [x, topRear, rear];
  const flt = [-x, topFront, front], frt = [x, topFront, front];
  const rlb = [-x, bottomRear, rear], rrb = [x, bottomRear, rear];
  const flb = [-x, bottomFront, front], frb = [x, bottomFront, front];
  const vertices = [];
  const face = (a, b, c, d) => vertices.push(...a, ...b, ...c, ...a, ...c, ...d);
  face(rlt, flt, frt, rrt); // driving face
  face(rlb, rrb, frb, flb); // thin open underside
  face(rlt, rlb, flb, flt);
  face(rrt, frt, frb, rrb);
  face(rlt, rrt, rrb, rlb);
  face(flt, flb, frb, frt);
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}
function railGeometry(centerX) {
  // Side profile narrows to the floor at the leading edge.
  const profile = new T.Shape();
  profile.moveTo(-.187, .111);
  profile.lineTo(-.187, .146);
  profile.lineTo(.169, .025);
  profile.lineTo(.196, .005);
  profile.lineTo(.198, .001);
  profile.lineTo(.166, .001);
  profile.closePath();
  const width = .026;
  const geometry = new T.ExtrudeGeometry(profile, {
    depth: width, steps: 1, bevelEnabled: true, bevelThickness: .0012,
    bevelSize: .0012, bevelSegments: 2, curveSegments: 2,
  });
  geometry.applyMatrix4(new T.Matrix4().set(
    0, 0, -1, centerX + width / 2,
    0, 1, 0, 0,
    1, 0, 0, 0,
    0, 0, 0, 1,
  ));
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  const strip = centerX < 0 ? .015 : .515;
  for (let index = 0; index < position.count; index++) {
    const z = position.getZ(index), y = position.getY(index), x = position.getX(index);
    const along = T.MathUtils.clamp((z + .187) / .385, 0, 1);
    const across = Math.abs(normal.getY(index)) > .6
      ? T.MathUtils.clamp((x - centerX) / .026 + .5, 0, 1)
      : T.MathUtils.clamp((y - railBottom(z)) / Math.max(.006, railTop(z) - railBottom(z)), 0, 1);
    uv.setXY(index, along, strip + across * .47);
  }
  uv.needsUpdate = true;
  return geometry;
}
const deckTop = z => .003 + (.128 - .003) * (.193 - z) / (.193 + .182);
const deckBottom = z => .0012 + (.121 - .0012) * (.193 - z) / (.193 + .182);
const railTop = z => .146 + (.025 - .146) * (z + .187) / (.169 + .187);
const railBottom = z => .111 + (.001 - .111) * (z + .187) / (.166 + .187);
const railEnds = { rear: -.187, front: .198 };
const braceZ = {
  middle: railEnds.rear + (railEnds.front - railEnds.rear) / 3,
  lower: railEnds.rear + 2 * (railEnds.front - railEnds.rear) / 3,
};
// The rail starts bending into its entry lip at z=.169. Keep the screw head
// completely on the straight section, just behind that transition.
const frontTopBoltZ = .155;
function supportGeometry(side) {
  const geometry = new RoundedBoxGeometry(.024, .117, .026, 2, .004);
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  const strip = side === 'Left' ? .13 : .63;
  for (let index = 0; index < position.count; index++) {
    const across = Math.abs(normal.getX(index)) > .6
      ? position.getZ(index) / .026 + .5 : position.getX(index) / .024 + .5;
    uv.setXY(index, T.MathUtils.clamp(position.getY(index) / .117 + .5, 0, 1),
      strip + T.MathUtils.clamp(across, 0, 1) * .32);
  }
  uv.needsUpdate = true;
  return geometry;
}
function braceGeometry(height, textureOffset) {
  const geometry = new RoundedBoxGeometry(.278, height, .022, 2, .0018);
  const position = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  for (let index = 0; index < position.count; index++) {
    const across = Math.abs(normal.getY(index)) > .6
      ? position.getZ(index) / .022 + .5 : position.getY(index) / height + .5;
    uv.setXY(index, T.MathUtils.clamp(position.getX(index) / .278 + .5, 0, 1),
      textureOffset + T.MathUtils.clamp(across, 0, 1) * .45);
  }
  uv.needsUpdate = true;
  return geometry;
}
function undersideBrace(ramp, name, z, height, textureOffset) {
  // Align the beam's broad face with the sloping underside of the deck.
  const angle = Math.atan((.121 - .0012) / (.193 + .182));
  const centerY = deckBottom(z) - height / (2 * Math.cos(angle)) - .0006;
  add(ramp, name, braceGeometry(height, textureOffset), 'wood', [0, centerY, z]).rotation.x = angle;
}
function paintedStrip(group, name, x1, z1, x2, z2, width) {
  const length = Math.hypot(x2 - x1, z2 - z1);
  const px = -(z2 - z1) * width / (2 * length);
  const pz = (x2 - x1) * width / (2 * length);
  const point = (x, z) => [x, deckTop(z) + .0012, z];
  const a = point(x1 + px, z1 + pz), b = point(x2 + px, z2 + pz);
  const c = point(x2 - px, z2 - pz), d = point(x1 - px, z1 - pz);
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute([...a, ...b, ...c, ...a, ...c, ...d], 3));
  geometry.computeVertexNormals();
  add(group, name, geometry, 'arrow');
}

export function buildFlushRamp() {
  const ramp = new T.Group();
  ramp.name = 'Asset play-ramp';
  ramp.userData.assetGroup = 'play-ramp';
  add(ramp, 'Ramp_Driving_Surface', panelGeometry(), 'deck');
  for (const [side, x] of [['Left', -.145], ['Right', .145]]) {
    add(ramp, `Ramp_Wood_Rail_${side}`, railGeometry(x), 'wood');
    for (const [end, z] of [['Rear', -.155], ['Front', frontTopBoltZ]]) {
      const tilt = Math.atan((.146 - .025) / (.169 + .187));
      const y = railTop(z) + .001;
      add(ramp, `Ramp_Brass_Bolt_${side}_${end}`,
        new T.CylinderGeometry(.006, .006, .0025, 20), 'gold', [x, y, z], [tilt, 0, 0]);
      rounded(ramp, `Ramp_Bolt_Slot_${side}_${end}`,
        [.0055, .0007, .0009], 'slot', [x, y + .0015, z], .0002).rotation.x = tilt;
    }
    // The rear legs meet the rails, while their bottoms sit inside the pads.
    add(ramp, `Ramp_Rear_Support_${side}`,
      supportGeometry(side), 'wood', [x, .0715, -.155]);
    rounded(ramp, `Ramp_Rear_Foot_${side}`,
      [.040, .014, .044], 'rubber', [x, .007, -.155], .0035);
    for (const [end, z] of [['Brace', braceZ.middle], ['Lower_Brace', braceZ.lower]]) {
      const y = (railTop(z) + railBottom(z)) / 2;
      const sign = x < 0 ? -1 : 1;
      const outerX = x + sign * .0143;
      // Side fasteners mark the two underside cross-brace joints.
      add(ramp, `Ramp_Side_Pin_${side}_${end}`,
        new T.CylinderGeometry(.0041, .0041, .0011, 20), 'brassRim', [outerX, y, z],
        [0, 0, Math.PI / 2]);
      const faceX = outerX + sign * .00065;
      add(ramp, `Ramp_Side_Pin_Face_${side}_${end}`,
        new T.CylinderGeometry(.0033, .0033, .00045, 20), 'gold', [faceX, y, z],
        [0, 0, Math.PI / 2]);
      rounded(ramp, `Ramp_Side_Pin_Slot_${side}_${end}`,
        [.00045, .0007, .0042], 'slot', [faceX + sign * .00038, y, z], .00015);
    }
  }
  undersideBrace(ramp, 'Ramp_Underside_Brace', braceZ.middle, .012, .04);
  undersideBrace(ramp, 'Ramp_Lower_Underside_Brace', braceZ.lower, .010, .52);
  for (const [number, z] of [[1, -.055], [2, .080]]) {
    paintedStrip(ramp, `Ramp_Arrow_${number}_Left`, -.023, z + .015, 0, z - .014, .0055);
    paintedStrip(ramp, `Ramp_Arrow_${number}_Right`, 0, z - .014, .023, z + .015, .0055);
  }
  return ramp;
}
