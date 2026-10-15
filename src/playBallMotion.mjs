// Use the ball's rebound rather than averaging it with the low-bounce floor.
// Rapier combine rules: 3 = Max, 1 = Min.
export const BALL_CONTACT_SETTINGS={restitution:.42,restitutionCombineRule:3,friction:.28,frictionCombineRule:1};
export const BALL_DROP_SETTINGS={...BALL_CONTACT_SETTINGS,ccd:true,linearDamping:.35,angularDamping:.35,canSleep:true};
export function ballDropMotion(random=Math.random){
  const heading=random()*Math.PI*2,speed=.12+random()*.06;
  const x=Math.cos(heading)*speed,z=Math.sin(heading)*speed;
  return {linearVelocity:[x,0,z],angularVelocity:[z/.09,0,-x/.09]};
}
