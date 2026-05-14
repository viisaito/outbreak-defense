import { Scene, Math as PhaserMath } from 'phaser';

// ── Config de cada personagem jogável ────────────────────────────
const PERSONAGENS_CONFIG = {
  vini:   { nome: 'Vini',   cor: 0x3399ff, custo: 0,  dano: 26, hp: 80  }, // passiva: +30% dano
  helena: { nome: 'Helena', cor: 0xff66aa, custo: 20, dano: 15, hp: 100 }, // passiva: mais HP
  daniel: { nome: 'Daniel', cor: 0xffaa33, custo: 20, dano: 18, hp: 90  }  // passiva: dano médio
};

export class GameScene extends Scene {
  constructor() { super('GameScene'); }

  create() {
    // ── Estado da partida ──────────────────────────────────────
    this.baseMaxHP         = 120;
    this.baseHP            = this.baseMaxHP;
    this.ondaAtual         = 1;
    this.totalOndas        = 3;
    this.configOndas       = [
      { zumbis: 4, caes: 1 },
      { zumbis: 3, caes: 2 },
      { zumbis: 3, caes: 3 }
    ];
    this.totalInimigosOnda = 0;
    this.spawnados         = 0;
    this.eliminados        = 0;
    this.inimigosDanaram   = 0;   // para sistema de estrelas
    this.gameOver          = false;
    this.sp                = 60;
    this.preparacao        = true;
    this.tempoPreparacao   = 15;
    this.ondaIniciada      = false;
    this.ondaConcluida     = false;
    this.attackRange       = 120;
    this.audioContext      = null;

    // ── Aliados do esquadrão (vindos da SquadScene) ────────────
    this.aliados           = this.registry.get('aliados') || ['vini'];
    this.aliadoSelecionado = this.aliados[0];

    // ── Fundo ──────────────────────────────────────────────────
    this.add.rectangle(400, 225, 800, 450, 0x1a1a2e);

    // ── Base ───────────────────────────────────────────────────
    this.baseColor = 0x33cc33;
    this.base = this.add.rectangle(750, 225, 40, 450, this.baseColor);

    // ── Slots de torre ─────────────────────────────────────────
    this.slotSelecionado = null;
    this.slots = [];
    const posicoes = [
      { x: 180, y: 130 },
      { x: 360, y: 280 },
      { x: 530, y: 160 }
    ];
    posicoes.forEach((pos, i) => this._criarSlot(pos, i));

    // ── HUD ────────────────────────────────────────────────────
    this._criarHUD();

    // ── Ícones de aliados (rodapé) ──────────────────────────────
    this._criarIconesAliados();

    this.inimigos = [];
    this.atualizarCorDaBase();

    this.timerPreparacaoEvent = this.time.addEvent({
      delay: 1000,
      callback: this.atualizarTimerPreparacao,
      callbackScope: this,
      repeat: this.tempoPreparacao - 1
    });
  }

  // ════════════════════════════════════════════════════════════
  //  CRIAÇÃO DE SLOTS
  // ════════════════════════════════════════════════════════════

  _criarSlot(pos, i) {
    const slot = this.add.rectangle(pos.x, pos.y, 52, 52, 0x444466)
      .setInteractive()
      .setStrokeStyle(2, 0x8888aa);

    slot.personagem   = null;
    slot.rangeCircle  = null;
    slot.aimIcon      = null;
    slot.cooldown     = 0;
    slot.hp           = 0;
    slot.maxHp        = 0;
    slot.hpBarFundo   = null;
    slot.hpBar        = null;
    slot.personagemId = null;

    // Número do slot (acima de tudo)
    this.add.text(pos.x, pos.y, (i + 1).toString(), {
      fontSize: '16px', color: '#aaaacc'
    }).setOrigin(0.5).setDepth(5);

    slot.on('pointerover', () => {
      if (!slot.personagem && slot !== this.slotSelecionado)
        slot.setFillStyle(0x666688);
    });
    slot.on('pointerout', () => {
      if (slot !== this.slotSelecionado)
        slot.setFillStyle(slot.personagem ? 0x223388 : 0x444466);
    });
    slot.on('pointerdown', () => {
      if (slot.personagem) return;
      if (this.slotSelecionado === slot) {
        slot.setFillStyle(0x444466);
        this.slotSelecionado = null;
      } else {
        if (this.slotSelecionado) this.slotSelecionado.setFillStyle(0x444466);
        slot.setFillStyle(0x00cc66);
        this.slotSelecionado = slot;
        const cfg = PERSONAGENS_CONFIG[this.aliadoSelecionado];
        this.textoSlot.setText(
          'Slot ' + (this.slots.indexOf(slot) + 1) +
          ' selecionado — clique em ' + (cfg?.nome || 'aliado') + ' para posicionar'
        );
      }
    });

    this.slots.push(slot);
  }

  // ════════════════════════════════════════════════════════════
  //  HUD
  // ════════════════════════════════════════════════════════════

  _criarHUD() {
    // Barra de HP da base
    this.add.text(16, 20, 'Base', { fontSize: '13px', color: '#aaaacc' }).setDepth(10);
    this.barraHPFundo = this.add.rectangle(58, 20, 170, 13, 0x333344).setOrigin(0, 0.5).setDepth(10);
    this.barraHP      = this.add.rectangle(58, 20, 170, 13, 0x33cc33).setOrigin(0, 0.5).setDepth(10);
    this.textoHP      = this.add.text(236, 13, this.baseHP + '/' + this.baseMaxHP, {
      fontSize: '12px', color: '#ffffff'
    }).setDepth(10);

    this.textoOnda  = this.add.text(16, 38, 'Onda: ' + this.ondaAtual + ' / ' + this.totalOndas, {
      fontSize: '16px', color: '#ffdd00'
    }).setDepth(10);
    this.textoSP    = this.add.text(16, 60, 'SP: ' + this.sp, {
      fontSize: '16px', color: '#00ccff'
    }).setDepth(10);
    this.textoTempo = this.add.text(16, 82, 'Preparação: 15 s', {
      fontSize: '16px', color: '#ffffff'
    }).setDepth(10);
    this.textoSlot  = this.add.text(16, 432, 'Selecione um aliado e clique num slot para posicionar', {
      fontSize: '12px', color: '#aaaacc'
    }).setDepth(10);
  }

  // ════════════════════════════════════════════════════════════
  //  ÍCONES DE ALIADOS
  // ════════════════════════════════════════════════════════════

  _criarIconesAliados() {
    const total  = this.aliados.length;
    const startX = 400 - ((total - 1) * 120) / 2;
    this._iconeBgs = [];

    this.aliados.forEach((id, i) => {
      const cfg    = PERSONAGENS_CONFIG[id] || { nome: id, cor: 0x888888, custo: 20, dano: 20, hp: 80 };
      const cx     = startX + i * 120;
      const cy     = 405;
      const isSel  = this.aliadoSelecionado === id;

      const bg = this.add.rectangle(cx, cy, 102, 44, isSel ? 0x0d1e30 : 0x1a1a2e)
        .setStrokeStyle(isSel ? 2 : 1, isSel ? cfg.cor : 0x333355)
        .setInteractive({ useHandCursor: true })
        .setDepth(10);

      this.add.rectangle(cx - 33, cy, 28, 28, cfg.cor).setDepth(11);
      this.add.text(cx - 12, cy - 9, cfg.nome, {
        fontSize: '12px', color: '#ffffff', fontStyle: 'bold'
      }).setDepth(11);
      this.add.text(cx - 12, cy + 5, i === 0 ? 'Grátis' : cfg.custo + ' SP', {
        fontSize: '10px', color: '#aaaacc'
      }).setDepth(11);

      bg._aliadoId = id;
      bg._cfg      = cfg;

      bg.on('pointerover', () => {
        if (this.aliadoSelecionado !== id) bg.setFillStyle(0x2a2a4a);
      });
      bg.on('pointerout', () => {
        if (this.aliadoSelecionado !== id) bg.setFillStyle(0x1a1a2e);
      });
      bg.on('pointerdown', () => {
        this.aliadoSelecionado = id;
        this._atualizarBordasAliados();
        if (this.slotSelecionado) {
          this.colocarPersonagemNoSlot();
        } else {
          this.textoSlot.setText(cfg.nome + ' selecionado — clique num slot vazio para posicionar');
        }
      });

      this._iconeBgs.push(bg);
    });
  }

  _atualizarBordasAliados() {
    this._iconeBgs.forEach(bg => {
      const cfg = PERSONAGENS_CONFIG[bg._aliadoId] || { cor: 0x888888 };
      const sel = this.aliadoSelecionado === bg._aliadoId;
      bg.setStrokeStyle(sel ? 2 : 1, sel ? cfg.cor : 0x333355);
      bg.setFillStyle(sel ? 0x0d1e30 : 0x1a1a2e);
    });
  }

  // ════════════════════════════════════════════════════════════
  //  POSICIONAMENTO DE PERSONAGEM
  // ════════════════════════════════════════════════════════════

  colocarPersonagemNoSlot() {
    if (!this.slotSelecionado) {
      this.textoSlot.setText('Selecione um slot primeiro (clique num quadrado vazio).');
      return;
    }
    const slot = this.slotSelecionado;
    if (slot.personagem) {
      this.textoSlot.setText('Slot ocupado! Escolha outro slot.');
      return;
    }

    const id  = this.aliadoSelecionado;
    const cfg = PERSONAGENS_CONFIG[id] || { nome: id, cor: 0x888888, custo: 20, dano: 20, hp: 80 };

    // Já posicionado em outro slot? → reposicionamento (custa 20 SP)
    const slotAtual = this.slots.find(s => s.personagemId === id && s.personagem);
    if (slotAtual) {
      if (this.sp < 20) {
        this.textoSlot.setText('SP insuficiente! Precisa de 20 SP para mover ' + cfg.nome + '.');
        return;
      }
      this.sp -= 20;
      this.textoSP.setText('SP: ' + this.sp);
      this._removerPersonagemDoSlot(slotAtual);
    }

    this._posicionarNoSlot(slot, id, cfg);
    this.slotSelecionado = null;
  }

  _posicionarNoSlot(slot, id, cfg) {
    const rangeCircle = this.add.circle(slot.x, slot.y, this.attackRange, 0x00ccff, 0.10).setDepth(-1);
    const aimIcon     = this.add.circle(slot.x, slot.y, 20, 0xffff00, 0.15)
      .setStrokeStyle(2, 0xffff00, 0.8).setDepth(1);
    const personagem  = this.add.rectangle(slot.x, slot.y, 32, 32, cfg.cor).setDepth(2);

    // Barra de HP acima do slot
    const hpBarFundo = this.add.rectangle(slot.x, slot.y - 34, 44, 6, 0x222233).setDepth(3);
    const hpBar      = this.add.rectangle(slot.x - 22, slot.y - 34, 44, 6, cfg.cor)
      .setOrigin(0, 0.5).setDepth(3);

    slot.personagem   = personagem;
    slot.rangeCircle  = rangeCircle;
    slot.aimIcon      = aimIcon;
    slot.personagemId = id;
    slot.hp           = cfg.hp;
    slot.maxHp        = cfg.hp;
    slot.hpBarFundo   = hpBarFundo;
    slot.hpBar        = hpBar;
    slot.cooldown     = 0;
    slot.setFillStyle(0x223388);
    slot.setStrokeStyle(2, cfg.cor);

    this.textoSlot.setText(cfg.nome + ' posicionado no slot ' + (this.slots.indexOf(slot) + 1) + '!');
  }

  _removerPersonagemDoSlot(slot) {
    if (slot.personagem)  { slot.personagem.destroy();  slot.personagem  = null; }
    if (slot.rangeCircle) { slot.rangeCircle.destroy(); slot.rangeCircle = null; }
    if (slot.aimIcon)     { slot.aimIcon.destroy();     slot.aimIcon     = null; }
    if (slot.hpBarFundo)  { slot.hpBarFundo.destroy();  slot.hpBarFundo  = null; }
    if (slot.hpBar)       { slot.hpBar.destroy();       slot.hpBar       = null; }
    slot.hp           = 0;
    slot.maxHp        = 0;
    slot.personagemId = null;
    slot.cooldown     = 0;
    slot.setFillStyle(0x444466);
    slot.setStrokeStyle(2, 0x8888aa);
  }

  // ════════════════════════════════════════════════════════════
  //  HP DA BASE
  // ════════════════════════════════════════════════════════════

  atualizarCorDaBase() {
    const ratio = PhaserMath.Clamp(this.baseHP / this.baseMaxHP, 0, 1);
    const r = Math.round(0x33 + (0xff - 0x33) * (1 - ratio));
    const g = Math.round(0xcc * ratio);
    const b = Math.round(0x33 * ratio);
    this.baseColor = (r << 16) | (g << 8) | b;
    this.base.setFillStyle(this.baseColor);

    // Barra visual
    const largura = Math.max(0, 170 * ratio);
    this.barraHP.setSize(largura, 13);
    this.barraHP.setFillStyle(this.baseColor);
    this.textoHP.setText(Math.max(0, this.baseHP) + '/' + this.baseMaxHP);

    if (ratio <= 0.25)     this.textoHP.setColor('#ff4444');
    else if (ratio <= 0.5) this.textoHP.setColor('#ffcc33');
    else                   this.textoHP.setColor('#ffffff');
  }

  piscarBaseHit() {
    const corOriginal = this.baseColor;
    this.tweens.add({
      targets: this.base, alpha: 0.2, duration: 80, yoyo: true,
      onStart:    () => this.base.setFillStyle(0xffffff),
      onComplete: () => { this.base.setFillStyle(corOriginal); this.base.setAlpha(1); }
    });
  }

  // ════════════════════════════════════════════════════════════
  //  HP DAS TORRES — zumbi ataca ao se aproximar
  // ════════════════════════════════════════════════════════════

  _verificarAtaqueTorre(z, delta) {
    if (!z || !z.active) return false;

    for (const slot of this.slots) {
      if (!slot.personagem || slot.hp <= 0) continue;

      const dist = PhaserMath.Distance.Between(z.x, z.y, slot.x, slot.y);
      if (dist <= 36) {
        // Para o zumbi
        z.body.setVelocityX(0);
        z.meleeTimer = (z.meleeTimer || 0) + delta / 1000;

        if (z.meleeTimer >= 1.0) {
          z.meleeTimer = 0;
          slot.hp -= z.dano;

          // Flash na torre
          if (slot.personagem && slot.personagem.active) {
            const cfg = PERSONAGENS_CONFIG[slot.personagemId] || { cor: 0x888888 };
            slot.personagem.setFillStyle(0xffffff);
            this.time.delayedCall(80, () => {
              if (slot.personagem && slot.personagem.active)
                slot.personagem.setFillStyle(cfg.cor);
            });
          }

          this._atualizarHPTorre(slot);
          this.tocarSomTorreHit();

          if (slot.hp <= 0) {
            slot.hp = -999; // evita re-trigger durante animação
            this._destruirTorre(slot, z);
          }
        }
        return true; // zumbi ocupado atacando torre
      }
    }

    // Nenhuma torre próxima — retoma velocidade se estava parado
    if (z.body && z.body.velocity.x === 0) {
      z.body.setVelocityX(z._velocidade || 80);
    }
    return false;
  }

  _atualizarHPTorre(slot) {
    if (!slot.hpBar || slot.maxHp <= 0) return;
    const ratio   = Math.max(0, slot.hp / slot.maxHp);
    const largura = Math.round(44 * ratio);
    slot.hpBar.setSize(largura, 6);
    const cor = ratio > 0.5 ? 0x33cc33 : ratio > 0.25 ? 0xffcc33 : 0xff4444;
    slot.hpBar.setFillStyle(cor);
  }

  _destruirTorre(slot, z) {
    // Efeito visual de destruição
    if (slot.personagem) {
      this.tweens.add({
        targets: slot.personagem,
        alpha: 0, scaleX: 2, scaleY: 2,
        duration: 350
      });
    }
    const explosion = this.add.circle(slot.x, slot.y, 28, 0xff4444, 0.6).setDepth(10);
    this.tweens.add({
      targets: explosion, alpha: 0, scale: 2.5, duration: 450,
      onComplete: () => explosion.destroy()
    });

    this.cameras.main.shake(120, 0.007);
    const cfg = PERSONAGENS_CONFIG[slot.personagemId] || { nome: 'Aliado' };
    this.textoSlot.setText(cfg.nome + ' foi eliminado pelos infectados!');

    // Retoma o zumbi imediatamente
    if (z && z.body) z.body.setVelocityX(z._velocidade || 80);

    // Remove slot apos animacao
    this.time.delayedCall(380, () => this._removerPersonagemDoSlot(slot));
  }

  // ========================================================================
  //  ATAQUE AUTOMATICO DAS TORRES
  // ========================================================================

  atacarInimigos(delta) {
    for (const slot of this.slots) {
      if (!slot.personagem || !slot.rangeCircle || slot.hp <= 0) continue;

      slot.cooldown = Math.max(0, slot.cooldown - delta / 1000);
      if (slot.cooldown > 0) continue;

      const cfg  = PERSONAGENS_CONFIG[slot.personagemId] || { dano: 20 };

      for (const z of this.inimigos) {
        if (!z || !z.active) continue;
        const dist = PhaserMath.Distance.Between(slot.x, slot.y, z.x, z.y);
        if (dist <= this.attackRange) {
          z.hp -= cfg.dano;
          slot.cooldown = 0.8;
          this.tocarSomDisparo();
          this._criarProjetil(slot.x, slot.y, z.x, z.y, cfg);

          z.setFillStyle(0xffffff);
          this.time.delayedCall(100, () => {
            if (z && z.active) z.setFillStyle(z.tipo === 'zumbi' ? 0xff0000 : 0x880000);
          });

          this.tocarSomInimigo(z.hp <= 0 ? 'death' : 'hit');
          if (z.hp <= 0) this.removerInimigo(z);
          break;
        }
      }
    }
  }

  _criarProjetil(x1, y1, x2, y2, cfg) {
    const cor  = cfg && cfg.cor ? cfg.cor : 0xffff00;
    const shot = this.add.circle(x1, y1, 5, cor, 1).setDepth(8);
    this.tweens.add({
      targets: shot, x: x2, y: y2, duration: 110, ease: 'Linear',
      onComplete: () => shot.destroy()
    });
    const flash = this.add.circle(x1, y1, 14, cor, 0.2).setDepth(7);
    this.tweens.add({
      targets: flash, alpha: 0, scale: 1.8, duration: 110,
      onComplete: () => flash.destroy()
    });
  }

  // ========================================================================
  //  SPAWN E REMOCAO DE INIMIGOS
  // ========================================================================

  spawnZumbi() {
    const config      = this.configOndas[this.ondaAtual - 1];
    const tipo        = this.spawnados < config.zumbis ? 'zumbi' : 'cao';
    this.spawnados++;
    this.textoOnda.setText(
      'Onda: ' + this.ondaAtual + ' -- ' + this.eliminados + '/' + this.totalInimigosOnda
    );

    let hp, velocidade, cor, larg, alt, dano;
    if (tipo === 'zumbi') {
      hp = 150; velocidade = 80;  cor = 0xff0000; larg = 32; alt = 48; dano = 30;
    } else {
      hp = 80; velocidade = 150; cor = 0x880000; larg = 24; alt = 24; dano = 15;
    }

    const z = this.add.rectangle(50, PhaserMath.Between(50, 400), larg, alt, cor);
    this.physics.add.existing(z);
    z.body.setVelocityX(velocidade);
    z.hp          = hp;
    z.dano        = dano;
    z.tipo        = tipo;
    z._velocidade = velocidade;
    z.meleeTimer  = 0;
    this.inimigos.push(z);
  }

  removerInimigo(z) {
    if (!z || !z.active) return;

    // SP por kill: +5 zumbi / +3 cao
    const recompensa = z.tipo === 'zumbi' ? 5 : 3;
    this.sp += recompensa;
    this.textoSP.setText('SP: ' + this.sp);
    this._floatingText(z.x, z.y, '+' + recompensa + ' SP', '#00ccff');

    z.destroy();
    const idx = this.inimigos.indexOf(z);
    if (idx !== -1) this.inimigos.splice(idx, 1);
    this.eliminados++;
    this.textoOnda.setText(
      'Onda: ' + this.ondaAtual + ' -- ' + this.eliminados + '/' + this.totalInimigosOnda
    );

    if (this.ondaConcluida) return;
    if (this.eliminados >= this.totalInimigosOnda) this._verificarFimOnda();
  }

  zumbiAtingeuBase(z) {
    z.destroy();
    const idx = this.inimigos.indexOf(z);
    if (idx !== -1) this.inimigos.splice(idx, 1);
    this.eliminados++;
    this.inimigosDanaram++;

    this.cameras.main.shake(200, 0.01);
    this.baseHP -= z.dano;
    this.atualizarCorDaBase();
    this.piscarBaseHit();
    this.textoOnda.setText(
      'Onda: ' + this.ondaAtual + ' -- ' + this.eliminados + '/' + this.totalInimigosOnda
    );

    if (this.baseHP <= 0) {
      this.gameOver = true;
      this.scene.start('GameOverScene', {
        onda:       this.ondaAtual,
        eliminados: this.eliminados,
        hp:         0
      });
      return;
    }

    if (!this.ondaConcluida && this.eliminados >= this.totalInimigosOnda)
      this._verificarFimOnda();
  }

  // ========================================================================
  //  CONTROLE DE ONDAS
  // ========================================================================

  atualizarTimerPreparacao() {
    if (!this.preparacao) return;
    this.tempoPreparacao -= 1;
    this.textoTempo.setText('Preparacao: ' + this.tempoPreparacao + ' s');
    if (this.tempoPreparacao <= 0 && !this.ondaIniciada) this.iniciarOnda();
  }

  iniciarOnda() {
    if (this.ondaIniciada) return;
    this.ondaIniciada  = true;
    this.ondaConcluida = false;
    this.preparacao    = false;
    if (this.timerPreparacaoEvent) {
      this.timerPreparacaoEvent.remove(false);
      this.timerPreparacaoEvent = null;
    }
    this.textoTempo.setText('Onda ' + this.ondaAtual + ' em curso!');

    const config = this.configOndas[this.ondaAtual - 1];
    this.totalInimigosOnda = config.zumbis + config.caes;
    this.spawnados  = 0;
    this.eliminados = 0;

    this.spawnZumbi();
    this.time.addEvent({
      delay: 2000, repeat: this.totalInimigosOnda - 1,
      callback: this.spawnZumbi, callbackScope: this
    });
  }

  _verificarFimOnda() {
    if (this.ondaConcluida) return;
    this.ondaConcluida = true;

    if (this.ondaAtual === this.totalOndas) {
      this.gameOver = true;
      this.scene.start('VictoryScene', { danados: this.inimigosDanaram });
    } else {
      this.iniciarProximaOnda();
    }
  }

  iniciarProximaOnda() {
    this.ondaAtual++;
    this.ondaIniciada    = false;
    this.preparacao      = true;
    this.tempoPreparacao = 15;
    this.textoTempo.setText('Preparacao: 15 s');
    this.textoOnda.setText('Onda: ' + this.ondaAtual + ' / ' + this.totalOndas);
    this.textoSlot.setText('Prepare-se para a onda ' + this.ondaAtual + '! Reposicione seus aliados.');

    this.timerPreparacaoEvent = this.time.addEvent({
      delay: 1000, callback: this.atualizarTimerPreparacao,
      callbackScope: this, repeat: this.tempoPreparacao - 1
    });
  }

  // ========================================================================
  //  UTILITARIOS VISUAIS E AUDIO
  // ========================================================================

  _floatingText(x, y, msg, cor) {
    const t = this.add.text(x, y - 10, msg, {
      fontSize: '13px', color: cor, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(20);
    this.tweens.add({
      targets: t, y: t.y - 38, alpha: 0, duration: 700,
      onComplete: () => t.destroy()
    });
  }

  getAudioContext() {
    if (this.audioContext) {
      if (this.audioContext.state === 'suspended') this.audioContext.resume().catch(() => {});
      return this.audioContext;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    this.audioContext = new AC();
    return this.audioContext;
  }

  playTone(freq, duration, type, volume) {
    duration = duration || 0.08; type = type || 'square'; volume = volume || 0.18;
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

  playNoise(duration, volume) {
    duration = duration || 0.12; volume = volume || 0.14;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const buf  = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    const noise = ctx.createBufferSource();
    const gain  = ctx.createGain();
    noise.buffer = buf;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + duration);
  }

  tocarSomDisparo()     { this.playTone(1200, 0.08, 'square',   0.16); }
  tocarSomInimigo(tipo) {
    if (tipo === 'death') this.playTone(260, 0.12, 'triangle', 0.18);
    else this.playNoise(0.1, 0.12);
  }
  tocarSomTorreHit()    { this.playTone(300, 0.10, 'sawtooth',  0.12); }

  // ========================================================================
  //  LOOP PRINCIPAL
  // ========================================================================

  update(time, delta) {
    if (this.gameOver) return;

    this.atacarInimigos(delta);

    for (let i = this.inimigos.length - 1; i >= 0; i--) {
      const z = this.inimigos[i];
      if (!z || !z.active) { this.inimigos.splice(i, 1); continue; }

      const atacandoTorre = this._verificarAtaqueTorre(z, delta);

      if (!atacandoTorre && z.x >= 730) {
        this.zumbiAtingeuBase(z);
        if (this.gameOver) return;
      }
    }
  }
}
