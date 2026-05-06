import { Scene } from 'phaser';

export class GameOverScene extends Scene {
  constructor() { super('GameOverScene'); }

  create() {
    this.add.text(400, 180, 'GAME OVER', {
      fontSize: '48px', color: '#ff0000'
    }).setOrigin(0.5);

    this.add.text(400, 260, 'Clique para tentar novamente', {
      fontSize: '20px', color: '#ffffff'
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}