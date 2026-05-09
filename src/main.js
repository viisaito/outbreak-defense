import { Game, AUTO } from 'phaser';
import { BootScene }       from './scenes/BootScene.js';
import { MenuScene }       from './scenes/MenuScene.js';
import { StoryScene }      from './scenes/StoryScene.js';
import { CharacterScene }  from './scenes/CharacterScene.js';
import { LoadScene }           from './scenes/LoadScene.js';
import { AchievementsScene }   from './scenes/AchievementsScene.js';
import { SquadScene }          from './scenes/SquadScene.js';
import { GameScene }           from './scenes/GameScene.js';
import { GameOverScene }   from './scenes/GameOverScene.js';
import { VictoryScene }    from './scenes/VictoryScene.js';

const config = {
  type: AUTO,
  width: 800,
  height: 450,
  backgroundColor: '#1a1a2e',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: [BootScene, MenuScene, StoryScene, CharacterScene, LoadScene, AchievementsScene, SquadScene, GameScene, GameOverScene, VictoryScene]
};

new Game(config);