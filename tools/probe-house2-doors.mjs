import RAPIER from '@dimforge/rapier3d-compat';
import { readFile } from 'node:fs/promises';
const scan=JSON.parse(await readFile('docs/house/house2-colliders.json','utf8'));
await RAPIER.init();
const world=new RAPIER.World({x:0,y:0,z:0});
for(const c of scan.colliders)world.createCollider(RAPIER.ColliderDesc.cuboid(...c.halfExtents).setTranslation(...c.center));
const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased());
const shape=world.createCollider(RAPIER.ColliderDesc.capsule(0.58,0.22),body);
const motor=world.createCharacterController(0.02);motor.setSlideEnabled(true);
for(const [name,z,direction,xs] of [['north',-2.5,-1,[0.7,0.8,0.9,1,1.1]],['south',-2.6,1,[2,2.2,2.4,2.6,2.8]],['east-south',-2.6,1,[5.8,6,6.2,6.4,6.6]],['garage',1.3,1,[-4.6,-4.4,-4.2,-4]]]){
 const results=[];
 for(const x of xs){body.setTranslation({x,y:0.85,z},true);body.setNextKinematicTranslation({x,y:0.85,z});world.step();
 for(let i=0;i<65;i++){motor.computeColliderMovement(shape,{x:0,y:0,z:direction*2.2/60});const p=body.translation(),m=motor.computedMovement();body.setNextKinematicTranslation({x:p.x+m.x,y:0.85,z:p.z+m.z});world.step();}
 results.push({x,end:{...body.translation()}});}
 console.log(name,JSON.stringify(results));
}
world.free();
