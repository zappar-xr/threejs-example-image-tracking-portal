/* eslint-disable import/no-unresolved */
/// Zappar for ThreeJS Examples
/// Portal

// In this image tracked example we'll mask and render passes to create a
// 'portal' effect. It will look like we are looking into a room - please
// try moving your mobile device around to see the full effect.

import * as THREE from 'three';
import * as ZapparThree from '@zappar/zappar-threejs';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass';
import { MaskPass, ClearMaskPass } from 'three/examples/jsm/postprocessing/MaskPass';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';

import foliage from '../assets/1-Foliage.png';
import road from '../assets/2-Road.png';
import yellowField from '../assets/3-Yellow-Field.png';
import mountain from '../assets/4-Mountain.png';
import darkHills from '../assets/5-Dark-Hills.png';
import greyHills from '../assets/6-Grey-Hills.png';
import lightGreyHills from '../assets/7-Light-Grey-Hills.png';
import pinkHill from '../assets/8-Pink-Hill.png';
import sun from '../assets/9-Sun.png';
import distanceTexture from '../assets/distance.png';

import targetImage from '../assets/example-tracking-image.zpt';

import './index.sass';

// The SDK is supported on many different browsers, but there are some that
// don't provide camera access. This function detects if the browser is supported
// For more information on support, check out the readme over at
// https://www.npmjs.com/package/@zappar/zappar-threejs
if (ZapparThree.browserIncompatible()) {
  // The browserIncompatibleUI() function shows a full-page dialog that informs the user
  // they're using an unsupported browser, and provides a button to 'copy' the current page
  // URL so they can 'paste' it into the address bar of a compatible alternative.
  ZapparThree.browserIncompatibleUI();

  // If the browser is not compatible, we can avoid setting up the rest of the page
  // so we throw an exception here.
  throw new Error('Unsupported browser');
}

// ZapparThree provides a LoadingManager that shows a progress bar while
// the assets are downloaded. You can use this if it's helpful, or use
// your own loading UI - it's up to you :-)
const manager = new ZapparThree.LoadingManager();

// Construct our ThreeJS renderer and scene as usual
const renderer = new THREE.WebGLRenderer(
  { antialias: true, alpha: true },
);
renderer.localClippingEnabled = true;
renderer.shadowMap.enabled = true;

const renderTargetParams = {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  stencilBuffer: true,
};
const renderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth, window.innerHeight, renderTargetParams,
);

const sceneCameraBackground = new THREE.Scene();
document.body.appendChild(renderer.domElement);

// As with a normal ThreeJS scene, resize the canvas if the window resizes
renderer.setSize(window.innerWidth, window.innerHeight);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Create a Zappar camera that we'll use instead of a ThreeJS camera
const camera = new ZapparThree.Camera();

// In order to use camera and motion data, we need to ask the users for permission
// The Zappar library comes with some UI to help with that, so let's use it
ZapparThree.permissionRequestUI().then((granted) => {
  // If the user granted us the permissions we need then we can start the camera
  // Otherwise let's them know that it's necessary with Zappar's permission denied UI
  if (granted) camera.start();
  else ZapparThree.permissionDeniedUI();
});

// The Zappar component needs to know our WebGL context, so set it like this:
ZapparThree.glContextSet(renderer.getContext());

// Set the background of our scene to be the camera background texture
// that's provided by the Zappar camera
sceneCameraBackground.background = camera.backgroundTexture;

// Set an error handler on the loader to help us check if there are issues loading content.
// eslint-disable-next-line no-console
manager.onError = (url) => console.log(`There was an error loading ${url}`);

// Create our portal and portal mask scenes
const scenePortal = new THREE.Scene();
const scenePortalMask = new THREE.Scene();

// Create a zappar image_tracker and wrap it in an image_tracker_group for us
// to put our ThreeJS content into
// Pass our loading manager in to ensure the progress bar works correctly
const imageTracker = new ZapparThree.ImageTrackerLoader(manager).load(targetImage);
const imageTrackerGroup = new ZapparThree.ImageAnchorGroup(camera, imageTracker);
const imageTrackerGroup2 = new ZapparThree.ImageAnchorGroup(camera, imageTracker);

// Add our image tracker group into the ThreeJS portal scene
scenePortal.add(imageTrackerGroup);

// Add our image tracker group into the ThreeJS portal mask scene
scenePortalMask.add(imageTrackerGroup2);

// Create portal group
const portal = new THREE.Group();
imageTrackerGroup.add(portal);
// Don't show portal immediately
portal.visible = false;

const ImageNames = [
  foliage,
  road,
  yellowField,
  mountain,
  darkHills,
  greyHills,
  lightGreyHills,
  pinkHill,
  sun,
];
const Positions : THREE.Vector3[] = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0, -0.1),
  new THREE.Vector3(0, -1, -0.5),
  new THREE.Vector3(-0.5, -0.7, -1),
  new THREE.Vector3(0, -0.8, -1.5),
  new THREE.Vector3(0, -1, -2),
  new THREE.Vector3(0, -0.5, -2.5),
  new THREE.Vector3(0, 0, -3),
  new THREE.Vector3(0, 1, -4.99),
];

Positions.forEach((position, i) => {
  const portalLayer = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshPhongMaterial(
      {
        map: (new THREE.TextureLoader()).load(ImageNames[i]), transparent: true, opacity: 1,
      },
    ),
  );
  portalLayer.position.copy(position);

  portalLayer.scale.set(4, 2, 2);
  portalLayer.castShadow = true;
  // Ensure layers are rendered in correct order
  portalLayer.renderOrder = Positions.length - i;
  portal.add(portalLayer);
});

// Set up our portal 'stage'/'room'
const top = new THREE.Mesh(
  new THREE.PlaneGeometry(5, 6),
  new THREE.MeshBasicMaterial({ color: 0xfaccb2, transparent: true, opacity: 1 }),
);
top.position.set(0, 2, -2.5);
top.rotation.set(Math.PI * 0.5, 0, 0);
portal.add(top);

const bottom = new THREE.Mesh(
  new THREE.PlaneGeometry(5, 6),
  new THREE.MeshBasicMaterial({ color: 0x645c0c, transparent: true, opacity: 1 }),
);
bottom.position.set(0, -1, -2.5);
bottom.rotation.set(-Math.PI * 0.5, 0, 0);
portal.add(bottom);

const left = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 6),
  new THREE.MeshBasicMaterial(
    {
      map: (new THREE.TextureLoader()).load(distanceTexture),
      transparent: true,
      opacity: 1,
    },
  ),
);
left.position.set(-1.5, 0, -2);
left.rotation.set(0, Math.PI * 0.5, 0);
portal.add(left);

const right = new THREE.Mesh(
  new THREE.PlaneGeometry(4, 6),
  new THREE.MeshBasicMaterial(
    {
      map: (new THREE.TextureLoader()).load(distanceTexture), transparent: true, opacity: 1,
    },
  ),
);
right.position.set(1.5, 0, -2);
right.rotation.set(0, -Math.PI * 0.5, 0);
portal.add(right);

const back = new THREE.Mesh(
  new THREE.PlaneGeometry(5, 6),
  new THREE.MeshBasicMaterial({ color: 0xfaccb2, transparent: true, opacity: 1 }),
);
back.position.set(0, 0, -5);
portal.add(back);

// Now create our portal mask
const portalMask = new THREE.Group();
imageTrackerGroup2.add(portalMask);
const mask = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(3, 2),
  new THREE.MeshBasicMaterial({ color: 0xffffff }),
);
// Making the mask fit the image
mask.scale.x = 1.04;
portalMask.add(mask);

// Set up our composer and passes
const composer = new EffectComposer(renderer, renderTarget);
const clearPass = new ClearPass();

const cameraBackgroundPass = new RenderPass(sceneCameraBackground, camera);
cameraBackgroundPass.clear = false;

const maskPortalPass = new MaskPass(scenePortalMask, camera);
maskPortalPass.inverse = false;

const portalPass = new RenderPass(scenePortal, camera);
portalPass.clear = false;

const clearMaskPass = new ClearMaskPass();
const outputPass = new ShaderPass(CopyShader);

outputPass.renderToScreen = true;
composer.addPass(clearPass);
composer.addPass(cameraBackgroundPass);
composer.addPass(maskPortalPass);
composer.addPass(portalPass);
composer.addPass(clearMaskPass);
composer.addPass(outputPass);

// Add some lighting to show off the depth
const directionalLight = new THREE.DirectionalLight(0xfaccb2, 1);
directionalLight.position.set(0, 0, 5);
portal.add(directionalLight);
portal.add(directionalLight.target);

// When we lose sight of the camera, hide the scene contents.
imageTracker.onVisible.bind(() => { portal.visible = true; });
imageTracker.onNotVisible.bind(() => { portal.visible = false; });

// Use a function to render our scene as usual
function render(): void {
  // The Zappar camera must have updateFrame called every frame
  camera.updateFrame(renderer);

  // Draw the ThreeJS scene in the usual way, but using the Zappar camera
  // Render first
  renderer.render(sceneCameraBackground, camera);
  // Render second
  renderer.render(scenePortalMask, camera);
  // Render third
  renderer.render(scenePortal, camera);

  renderer.clear();
  composer.render();

  // Call render() again next frame
  requestAnimationFrame(render);
}

// Start things off
render();
