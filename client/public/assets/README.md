# Art & audio

Put pixel-art sprites, tilesets, fonts and sounds here. Files in this folder are served
at `/assets/...`, e.g. load them in a scene's `preload()`:

```js
this.load.spritesheet('robot', '/assets/robot.png', { frameWidth: 32, frameHeight: 32 });
```

The robot and classroom are currently drawn with shapes in `src/robot/Robot.js` and
`src/scenes/ClassroomScene.js`. Replace those with sprites when the art is ready.
