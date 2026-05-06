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

    // ── SLOTS DE TORRE ──────────────────────────────────────────
    this.slotSelecionado = null;  // qual slot está selecionado agora
    this.slots = [];

    const posicoes = [
      { x: 180, y: 130 },
      { x: 360, y: 280 },
      { x: 530, y: 160 },
    ];

    posicoes.forEach((pos, i) => {
      // Fundo do slot
      const slot = this.add.rectangle(pos.x, pos.y, 52, 52, 0x444466)
        .setInteractive()
        .setStrokeStyle(2, 0x8888aa);

      slot.torre = null;  // null = vazio

      // Número do slot (para identificar visualmente)
      this.add.text(pos.x, pos.y, (i + 1).toString(), {
        fontSize: '16px', color: '#aaaacc'
      }).setOrigin(0.5);

      // Hover: ilumina ao passar o mouse
      slot.on('pointerover', () => {
        if (!slot.torre && slot !== this.slotSelecionado) {
          slot.setFillStyle(0x666688);
        }
      });

      slot.on('pointerout', () => {
        if (slot !== this.slotSelecionado) {
          slot.setFillStyle(slot.torre ? 0x223388 : 0x444466);
        }
      });

      // Clique: seleciona ou desseleciona o slot
      slot.on('pointerdown', () => {
        if (slot.torre) return; // slot ocupado, ignora

        if (this.slotSelecionado === slot) {
          // Clicou no mesmo → desseleciona
          slot.setFillStyle(0x444466);
          this.slotSelecionado = null;
        } else {
          // Desseleciona o anterior, se houver
          if (this.slotSelecionado) {
            this.slotSelecionado.setFillStyle(0x444466);
          }
          // Seleciona este
          slot.setFillStyle(0x00cc66);
          this.slotSelecionado = slot;
        }
      });

      this.slots.push(slot);
    });
    // ────────────────────────────────────────────────────────────

    // HUD
    this.textoHP = this.add.text(16, 16, 'Base HP: 200', {
      fontSize: '18px', color: '#ffffff'
    });
    this.textoOnda = this.add.text(16, 44, 'Onda: 0 / 5', {
      fontSize: '18px', color: '#ffdd00'
    });
    this.textoSlot = this.add.text(16, 420, 'Clique num slot para selecionar', {
      fontSize: '13px', color: '#aaaacc'
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

    // Atualiza dica de slot no HUD
    if (this.slotSelecionado) {
      const idx = this.slots.indexOf(this.slotSelecionado) + 1;
      this.textoSlot.setText(`Slot ${idx} selecionado — [futuro: pressione tecla para colocar torre]`);
    } else {
      this.textoSlot.setText('Clique num slot para selecionar');
    }

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