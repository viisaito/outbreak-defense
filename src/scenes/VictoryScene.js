import { Scene } from 'phaser';
import { AchievementsScene } from './AchievementsScene.js';

export class VictoryScene extends Scene {
  constructor() { super('VictoryScene'); }

  create() {
    const danados = this.scene.settings.data?.danados ?? 0;

    this.add.rectangle(400, 225, 800, 450, 0x0a1a0a);

    this.add.text(400, 70, 'VOCÊ SOBREVIVEU!', {
      fontSize: '38px', color: '#3dff6e', fontStyle: 'bold', letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(400, 118, 'A base resistiu ao ataque dos infectados.', {
      fontSize: '14px', color: '#666688'
    }).setOrigin(0.5);

    this.add.rectangle(400, 140, 280, 1, 0x2a5a2a);

    const avTxt = danados === 0 ? 'DEFESA PERFEITA'
                : danados <= 2  ? 'BOM TRABALHO'
                :                 'SOBREVIVÊNCIA';
    const avCor = danados === 0 ? '#3dff6e' : danados <= 2 ? '#ffdd00' : '#ff9944';
    const avSub = danados === 0
      ? 'Nenhum infectado alcançou a base!'
      : danados + (danados === 1 ? ' infectado chegou' : ' infectados chegaram') + ' à base.';

    const tAvaliacao = this.add.text(400, 190, avTxt, {
      fontSize: '22px', color: avCor, letterSpacing: 5, fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);

    const tSub = this.add.text(400, 220, avSub, {
      fontSize: '13px', color: '#888899'
    }).setOrigin(0.5).setAlpha(0);

    this.time.delayedCall(400, () => {
      this.tweens.add({ targets: [tAvaliacao, tSub], alpha: 1, duration: 500, ease: 'Power2' });
    });

    // Botao: Jogar novamente
    const btnNovo = this.add.rectangle(285, 355, 210, 44, 0x1a4a2a)
      .setStrokeStyle(1, 0x3dff6e)
      .setInteractive({ useHandCursor: true });
    this.add.text(285, 355, 'JOGAR NOVAMENTE', {
      fontSize: '13px', color: '#3dff6e', letterSpacing: 2
    }).setOrigin(0.5);
    btnNovo.on('pointerover', () => btnNovo.setFillStyle(0x27ae60));
    btnNovo.on('pointerout',  () => btnNovo.setFillStyle(0x1a4a2a));
    btnNovo.on('pointerup',   () => this.scene.start('GameScene'));

    // Botao: Menu principal
    const btnMenu = this.add.rectangle(535, 355, 180, 44, 0x1a1a2e)
      .setStrokeStyle(1, 0x444466)
      .setInteractive({ useHandCursor: true });
    this.add.text(535, 355, 'MENU PRINCIPAL', {
      fontSize: '13px', color: '#aaaacc', letterSpacing: 2
    }).setOrigin(0.5);
    btnMenu.on('pointerover', () => btnMenu.setFillStyle(0x2a2a4a));
    btnMenu.on('pointerout',  () => btnMenu.setFillStyle(0x1a1a2e));
    btnMenu.on('pointerup',   () => this.scene.start('MenuScene'));

    this.add.text(400, 420, 'Sao Paulo City - Bioma 01', {
      fontSize: '11px', color: '#333355', letterSpacing: 3
    }).setOrigin(0.5);

    AchievementsScene.desbloquear('zerar_normal');
    if (danados === 0) AchievementsScene.desbloquear('sem_hit_normal');
  }
}
