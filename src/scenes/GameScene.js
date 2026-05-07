import { Scene, Math as PhaserMath } from 'phaser';

export class GameScene extends Scene {
  constructor() { super('GameScene'); }

  create() {
    this.baseMaxHP    = 120;
    this.baseHP       = this.baseMaxHP;
    this.ondaAtual    = 1;
    this.totalOndas   = 3;
    this.configOndas  = [
      { zumbis: 4, caes: 1 }, // Onda 1
      { zumbis: 3, caes: 2 }, // Onda 2
      { zumbis: 3, caes: 3 }  // Onda 3
    ];
    this.totalInimigosOnda = 0;
    this.spawnados    = 0;    // quantos já foram spawnados na onda atual
    this.eliminados   = 0;    // quantos foram removidos na onda atual
    this.gameOver     = false;
    this.sp           = 60;   // suprimentos disponíveis
    this.personagemSlot = null;
    this.preparacao   = true;
    this.tempoPreparacao = 15;
    this.ondaIniciada = false;
    this.ondaConcluida = false;
    this.attackRange = 200;
    this.attackDamage = 20;
    this.audioContext = null;

    // Base cobre altura total da tela para teste
    this.baseColor = 0x33cc33;
    this.base = this.add.rectangle(750, 225, 40, 450, this.baseColor);

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

      slot.personagem = null;  // null = vazio
      slot.rangeCircle = null;
      slot.aimIcon = null;
      slot.cooldown = 0;

      // Número do slot (para identificar visualmente)
      this.add.text(pos.x, pos.y, (i + 1).toString(), {
        fontSize: '16px', color: '#aaaacc'
      }).setOrigin(0.5);

      // Hover: ilumina ao passar o mouse
      slot.on('pointerover', () => {
        if (!slot.personagem && slot !== this.slotSelecionado) {
          slot.setFillStyle(0x666688);
        }
      });

      slot.on('pointerout', () => {
        if (slot !== this.slotSelecionado) {
          slot.setFillStyle(slot.personagem ? 0x223388 : 0x444466);
        }
      });

      // Clique: seleciona ou desseleciona o slot
      slot.on('pointerdown', () => {
        if (slot.personagem) return; // slot ocupado, ignora

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
    this.textoHP = this.add.text(16, 16, 'Base HP: ' + this.baseHP, {
      fontSize: '18px', color: '#ffffff'
    });
    this.textoOnda = this.add.text(16, 44, 'Onda: ' + this.ondaAtual + ' / ' + this.totalOndas, {
      fontSize: '18px', color: '#ffdd00'
    });
    this.textoSP = this.add.text(16, 72, 'SP: ' + this.sp, {
      fontSize: '18px', color: '#00ccff'
    });
    this.textoTempo = this.add.text(16, 100, 'Preparação: 15 s', {
      fontSize: '18px', color: '#ffffff'
    });
    this.textoSlot = this.add.text(16, 420, 'Clique num slot e depois no ícone para posicionar', {
      fontSize: '13px', color: '#aaaacc'
    });

    this.personagemIcon = this.add.rectangle(400, 400, 48, 48, 0x00ccff)
      .setInteractive();
    this.personagemIconTexto = this.add.text(400, 430, 'Personagem', {
      fontSize: '14px', color: '#ffffff'
    }).setOrigin(0.5, 0);
    this.personagemCustoTexto = this.add.text(400, 450, 'Custo: 20 SP', {
      fontSize: '12px', color: '#aaaaaa'
    }).setOrigin(0.5, 0);

    this.personagemIcon.on('pointerover', () => {
      this.personagemIcon.setFillStyle(0x44ddff);
    });

    this.personagemIcon.on('pointerout', () => {
      this.personagemIcon.setFillStyle(0x00ccff);
    });

    this.personagemIcon.on('pointerdown', () => {
      this.colocarPersonagemNoSlot();
    });

    this.inimigos = [];
    this.atualizarCorDaBase();

    this.timerPreparacaoEvent = this.time.addEvent({
      delay: 1000,
      callback: this.atualizarTimerPreparacao,
      callbackScope: this,
      repeat: this.tempoPreparacao - 1
    });
  }

  atualizarCorDaBase() {
    const ratio = PhaserMath.Clamp(this.baseHP / this.baseMaxHP, 0, 1);
    const r = Math.round(0x33 + (0xff - 0x33) * (1 - ratio));
    const g = Math.round(0xcc * ratio);
    const b = Math.round(0x33 * ratio);
    this.baseColor = (r << 16) | (g << 8) | b;
    this.base.setFillStyle(this.baseColor);

    if (ratio <= 0.25) {
      this.textoHP.setColor('#ff4444');
    } else if (ratio <= 0.5) {
      this.textoHP.setColor('#ffcc33');
    } else {
      this.textoHP.setColor('#ffffff');
    }
  }

  piscarBaseHit() {
    const corOriginal = this.baseColor;

    this.tweens.add({
      targets: this.base,
      alpha: 0.2,
      duration: 80,
      yoyo: true,
      onStart: () => this.base.setFillStyle(0xffffff),
      onComplete: () => {
        this.base.setFillStyle(corOriginal);
        this.base.setAlpha(1);
      }
    });
  }

  getAudioContext() {
    if (this.audioContext) {
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      return this.audioContext;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    this.audioContext = new AudioContext();
    return this.audioContext;
  }

  playTone(freq, duration = 0.08, type = 'square', volume = 0.18) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  playNoise(duration = 0.12, volume = 0.14) {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + duration);
  }

  tocarSomDisparo() {
    this.playTone(1200, 0.08, 'square', 0.16);
  }

  tocarSomInimigo(tipo = 'hit') {
    if (tipo === 'death') {
      this.playTone(260, 0.12, 'triangle', 0.18);
    } else {
      this.playNoise(0.1, 0.12);
    }
  }

  atualizarTimerPreparacao() {
    if (!this.preparacao) return;

    this.tempoPreparacao -= 1;
    this.textoTempo.setText('Preparação: ' + this.tempoPreparacao + ' s');

    if (this.tempoPreparacao <= 0 && !this.ondaIniciada) {
      this.iniciarOnda();
    }
  }

  iniciarOnda() {
    if (this.ondaIniciada) return;
    this.ondaIniciada = true;
    this.ondaConcluida = false;
    this.preparacao = false;
    if (this.timerPreparacaoEvent) {
      this.timerPreparacaoEvent.remove(false);
      this.timerPreparacaoEvent = null;
    }
    this.textoTempo.setText('Onda ' + this.ondaAtual + ' iniciada!');
    this.textoSlot.setText('A onda ' + this.ondaAtual + ' começou.');

    const config = this.configOndas[this.ondaAtual - 1];
    this.totalInimigosOnda = config.zumbis + config.caes;
    this.spawnados = 0;
    this.eliminados = 0;

    this.spawnZumbi();
    this.time.addEvent({
      delay: 2000,
      repeat: this.totalInimigosOnda - 1,
      callback: this.spawnZumbi,
      callbackScope: this
    });
  }

  atacarInimigos(delta) {
    for (const slot of this.slots) {
      if (!slot.personagem || !slot.rangeCircle) continue;

      slot.cooldown = Math.max(0, slot.cooldown - delta / 1000);
      if (slot.cooldown > 0) continue;

      for (const z of this.inimigos) {
        if (!z || !z.active) continue;
        const distancia = PhaserMath.Distance.Between(slot.x, slot.y, z.x, z.y);
        if (distancia <= this.attackRange) {
          z.hp -= this.attackDamage;
          slot.cooldown = 0.8;

          this.tocarSomDisparo();

          const shot = this.add.circle(slot.x, slot.y, 6, 0xffff00, 1);
          this.tweens.add({
            targets: shot,
            x: z.x,
            y: z.y,
            duration: 120,
            ease: 'Linear',
            onComplete: () => shot.destroy()
          });

          const flash = this.add.circle(slot.x, slot.y, 16, 0xffff00, 0.25);
          this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 1.8,
            duration: 120,
            onComplete: () => flash.destroy()
          });

          z.setFillStyle(0xffffff);
          this.time.delayedCall(100, () => {
            if (z && z.active) z.setFillStyle(z.tipo === 'zumbi' ? 0xff0000 : 0x880000);
          });

          this.tocarSomInimigo(z.hp <= 0 ? 'death' : 'hit');

          if (z.hp <= 0) {
            this.removerInimigo(z);
          }
          break;
        }
      }
    }
  }

  removerInimigo(z) {
    if (!z || !z.active) return;
    z.destroy();
    const index = this.inimigos.indexOf(z);
    if (index !== -1) this.inimigos.splice(index, 1);
    this.eliminados++;
    this.textoOnda.setText('Onda: ' + this.ondaAtual + ' - ' + this.eliminados + ' / ' + this.totalInimigosOnda);

    if (this.ondaConcluida) return;
    if (this.eliminados >= this.totalInimigosOnda) {
      if (this.ondaAtual === this.totalOndas) {
        this.ondaConcluida = true;
        this.gameOver = true;
        this.scene.start('VictoryScene');
      } else {
        this.iniciarProximaOnda();
      }
    }
  }

  iniciarProximaOnda() {
    if (this.ondaConcluida) return;
    this.ondaConcluida = true;

    this.ondaAtual++;
    this.ondaIniciada = false;
    this.preparacao = true;
    this.tempoPreparacao = 15;
    this.textoTempo.setText('Preparação: 15 s');
    this.textoSlot.setText('Prepare-se para a onda ' + this.ondaAtual + '. Posicione o personagem.');
    this.textoOnda.setText('Onda: ' + this.ondaAtual + ' / ' + this.totalOndas);

    this.timerPreparacaoEvent = this.time.addEvent({
      delay: 1000,
      callback: this.atualizarTimerPreparacao,
      callbackScope: this,
      repeat: this.tempoPreparacao - 1
    });
  }

  colocarPersonagemNoSlot() {
    if (!this.slotSelecionado) {
      this.textoSlot.setText('Selecione um slot antes de posicionar o personagem.');
      return;
    }

    const slot = this.slotSelecionado;
    if (slot.personagem) {
      this.textoSlot.setText('Esse slot já tem um personagem. Escolha outro.');
      return;
    }

    const custo = this.personagemSlot ? 20 : 0;
    if (custo > 0 && this.sp < custo) {
      this.textoSlot.setText('SP insuficiente para mover o personagem.');
      return;
    }

    if (this.personagemSlot) {
      if (this.personagemSlot.personagem) {
        this.personagemSlot.personagem.destroy();
        this.personagemSlot.personagem = null;
      }
      if (this.personagemSlot.rangeCircle) {
        this.personagemSlot.rangeCircle.destroy();
        this.personagemSlot.rangeCircle = null;
      }
      if (this.personagemSlot.aimIcon) {
        this.personagemSlot.aimIcon.destroy();
        this.personagemSlot.aimIcon = null;
      }
      this.personagemSlot.cooldown = 0;
      this.sp -= custo;
      this.textoSP.setText('SP: ' + this.sp);
    }

    const rangeCircle = this.add.circle(slot.x, slot.y, this.attackRange, 0x00ccff, 0.18);
    rangeCircle.setDepth(-1);

    const aimIcon = this.add.circle(slot.x, slot.y, 20, 0xffff00, 0.15)
      .setStrokeStyle(2, 0xffff00, 0.8);
    aimIcon.setDepth(1);

    const personagem = this.add.rectangle(slot.x, slot.y, 32, 32, 0x00ccff);
    slot.personagem = personagem;
    slot.rangeCircle = rangeCircle;
    slot.aimIcon = aimIcon;
    this.personagemSlot = slot;

    this.textoSlot.setText('Personagem posicionado no slot ' + (this.slots.indexOf(slot) + 1) + '.');
  }

  spawnZumbi() {
    const config = this.configOndas[this.ondaAtual - 1];
    const totalZumbis = config.zumbis;
    const totalCaes = config.caes;
    const totalInimigos = totalZumbis + totalCaes;

    // Decide o tipo baseado no que ainda precisa spawnar
    let tipo;
    if (this.spawnados < totalZumbis) {
      tipo = 'zumbi';
    } else {
      tipo = 'cao';
    }

    this.spawnados++;
    this.textoOnda.setText('Onda: ' + this.ondaAtual + ' - ' + this.eliminados + ' / ' + totalInimigos);

    let hp, velocidade, cor, largura, altura, dano;
    if (tipo === 'zumbi') {
      hp = 50;
      velocidade = 80;
      cor = 0xff0000;
      largura = 32;
      altura = 48;
      dano = 20;
    } else { // cao
      hp = 30;
      velocidade = 150;
      cor = 0x880000;
      largura = 24;
      altura = 24;
      dano = 10;
    }

    const z = this.add.rectangle(
      50,
      PhaserMath.Between(50, 400),
      largura, altura, cor
    );
    this.physics.add.existing(z);
    z.body.setVelocityX(velocidade);
    z.hp = hp;
    z.dano = dano;
    z.tipo = tipo;
    this.inimigos.push(z);
  }

  zumbiAtingeuBase(z) {
    z.destroy();
    this.inimigos.splice(this.inimigos.indexOf(z), 1);
    this.eliminados++;

    // Melhoria 1: tremida de tela
    this.cameras.main.shake(200, 0.01);

    this.baseHP -= z.dano;
    this.textoHP.setText('Base HP: ' + this.baseHP);
    this.atualizarCorDaBase();
    this.piscarBaseHit();
    this.textoOnda.setText('Onda: ' + this.ondaAtual + ' - ' + this.eliminados + ' / ' + this.totalInimigosOnda);

    if (this.baseHP <= 0) {
      this.gameOver = true;
      this.scene.start('GameOverScene');
      return;
    }

    if (this.ondaConcluida) return;
    if (this.eliminados >= this.totalInimigosOnda) {
      if (this.ondaAtual === this.totalOndas) {
        this.ondaConcluida = true;
        this.gameOver = true;
        this.scene.start('VictoryScene');
      } else {
        this.iniciarProximaOnda();
      }
    }
  }

  update(time, delta) {
    if (this.gameOver) return;

    // Atualiza dica de slot no HUD
    if (this.slotSelecionado) {
      const idx = this.slots.indexOf(this.slotSelecionado) + 1;
      this.textoSlot.setText(
        `Slot ${idx} selecionado — clique no ícone abaixo para posicionar o personagem`
      );
    } else if (this.preparacao) {
      this.textoSlot.setText('Clique num slot e depois no ícone do personagem para posicionar.');
    } else {
      this.textoSlot.setText('Selecione um slot e use o ícone para reposicionar por 20 SP.');
    }

    this.atacarInimigos(delta);

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