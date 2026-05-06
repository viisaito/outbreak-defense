import { Scene } from 'phaser';

export class VictoryScene extends Scene {
  constructor() { super('VictoryScene'); }

  create() {
    this.add.text(400, 160, 'VOCÊ SOBREVIVEU!', {
      fontSize: '40px', color: '#3dff6e'
    }).setOrigin(0.5);

    this.add.text(400, 240, 'A base resistiu ao ataque.', {
      fontSize: '20px', color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(400, 310, 'Clique para jogar novamente', {
      fontSize: '18px', color: '#aaaaaa'
    }).setOrigin(0.5);

    this.input.once('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}
