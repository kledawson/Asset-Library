import assert from 'node:assert/strict';
import R from '@dimforge/rapier3d-compat';
import { BALL_DROP_SETTINGS,ballDropMotion } from '../src/playBallMotion.mjs';
await R.init();
for(const [color,random]of [['coral',.12],['yellow',.43],['teal',.79]]){
  const world=new R.World({x:0,y:-9.81,z:0});world.timestep=1/60;
  world.createCollider(R.ColliderDesc.cuboid(100,.05,100).setTranslation(0,-.055,0).setFriction(.65).setRestitution(.08));
  const motion=ballDropMotion(()=>random),body=world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0,.65,0).setLinvel(...motion.linearVelocity).setAngvel({x:motion.angularVelocity[0],y:0,z:motion.angularVelocity[2]}).setLinearDamping(BALL_DROP_SETTINGS.linearDamping).setAngularDamping(BALL_DROP_SETTINGS.angularDamping).setCanSleep(BALL_DROP_SETTINGS.canSleep).setCcdEnabled(BALL_DROP_SETTINGS.ccd));
  const collider=world.createCollider(R.ColliderDesc.ball(.0909).setTranslation(0,.0909,0).setFriction(BALL_DROP_SETTINGS.friction).setFrictionCombineRule(BALL_DROP_SETTINGS.frictionCombineRule).setRestitution(BALL_DROP_SETTINGS.restitution).setRestitutionCombineRule(BALL_DROP_SETTINGS.restitutionCombineRule),body);
  let start,finish,impact=false,reboundStarted=false,rebound=0,pausedFrames=0;
  for(let i=0;i<900;i++){world.step();if(i===30)start=body.translation();if(i===180)finish=body.translation();const y=collider.translation().y;if(!impact&&y<.10)impact=true;if(impact&&body.linvel().y>.1)reboundStarted=true;if(impact&&i<65){rebound=Math.max(rebound,y-.0859);if(!reboundStarted&&y<.10&&Math.abs(body.linvel().y)<.05)pausedFrames++;}}
  const travel=Math.hypot(finish.x-start.x,finish.z-start.z),velocity=body.linvel();
  assert(travel>.025&&travel<.5,color+' did not roll a controlled distance');assert(Math.hypot(velocity.x,velocity.y,velocity.z)<.03,color+' did not settle');
  assert(rebound>.05&&rebound<.2,color+' rebound was missing or excessive');assert(pausedFrames<=1,color+' paused on the floor before rebounding');
  console.log(`${color}: rebound ${rebound.toFixed(3)}, roll ${travel.toFixed(3)}, no contact pause; settled`);world.free();
}
