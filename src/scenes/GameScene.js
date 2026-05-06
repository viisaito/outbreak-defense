import { Scene, Math as PhaserMath } from 'phaser';

export class GameScene extends Scene {
  constructor() { super('GameScene'); }

  create() {
    this.baseHP       = 200;  // HP alto para testes — aguenta mais hits
    this.totalZumbis  = 5;    // total da onda
    this.spawnados    = 0;    // quantos já foram spawnados
    this.eliminados   = 0;    // quantos chegaram na base
    this.gameOver     = false;

    // Base cobre altura total da tela para teste
    this.base = this.add.rectangle(750, 225, 40, 450, 0xff4400);

    // HUD
    this.textoHP = this.add.text(16, 16, 'Base HP: 200', {
      fontSize: '18px', color: '#ffffff'
    });
    this.textoOnda = this.add.text(16, 44, 'Onda: 0 / 5', {
      fontSize: '18px', color: '#ffdd00'
    });

    this.inimigos = [];

    this.time.addEvent({
      delay: 2000,
      repeat: this.totalZumbis - 1,
      callback: this.spawnZumbi,
      callbackScope: this
    });
  }

  spawnZumbi() {
    this.spawnados++;
    this.textoOnda.setText('Onda: ' + this.eliminados + ' / ' + this.totalZumbis);

    const z = this.add.rectangle(
      50,
      PhaserMath.Between(50, 400),
      32, 48, 0xff0000
    );
    this.physics.add.existing(z);
    z.body.setVelocityX(120);
    this.inimigos.push(z);
  }

  zumbiAtingeuBase(z) {
    z.destroy();
    this.inimigos.splice(this.inimigos.indexOf(z), 1);
    this.eliminados++;

    // Melhoria 1: tremida de tela
    this.cameras.main.shake(200, 0.01);

    // Melhoria 2: base pisca ao levar hit
    this.tweens.add({
      targets: this.base,
      alpha: 0.2,
      duration: 80,
      yoyo: true,
      onComplete: () => this.base.setAlpha(1)
    });

    this.baseHP -= 20;
    this.textoHP.setText('Base HP: ' + this.baseHP);
    this.textoOnda.setText('Onda: ' + this.eliminados + ' / ' + this.totalZumbis);

    if (this.baseHP <= 0) {
      this.gameOver = true;
      this.scene.start('GameOverScene');
      return;
    }

    // Melhoria 5: vitória quando todos os zumbis da onda foram eliminados
    if (this.eliminados >= this.totalZumbis) {
      this.gameOver = true;
      this.scene.start('VictoryScene');
    }
  }

  update() {
    if (this.gameOver) return;

    for (let i = this.inimigos.length - 1; i >= 0; i--) {
      const z = this.inimigos[i];
      if (!z || !z.active) { this.inimigos.splice(i, 1); continue; }

      if (z.x >= 730) {
        this.zumbiAtingeuBase(z);
        if (this.gameOver) return;
      }
    }
  }
}