import { Game, AUTO } from 'phaser';
import { BootScene }     from './scenes/BootScene.js';
import { GameScene }     from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { VictoryScene }  from './scenes/VictoryScene.js';

const config = {
  type: AUTO,
  width: 800,
  height: 450,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [BootScene, GameScene, GameOverScene, VictoryScene]
};

new Game(config);