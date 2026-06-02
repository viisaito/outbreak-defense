import { Scene, Math as PhaserMath } from 'phaser';

const SAVE_KEYS = ['outbreak-defense-save-1', 'outbreak-defense-save-2'];

export class MenuScene extends Scene {
  constructor() { super('MenuScene'); }

  create() {
    const gw = this.scale.width;
    const gh = this.scale.height;
    const cx = gw / 2;
    const cy = gh / 2;

    this.gw = gw;
    this.gh = gh;
    this.cx = cx;
    this.cy = cy;

    this.overlay  = null;
    this.modoEscolhido = null;

    this.cameras.main.fadeIn(300, 0, 0, 0);

    // ── Fundo ──────────────────────────────────────────────────
    this.add.image(cx, cy, 'menuBg').setDisplaySize(gw, gh).setDepth(-2);
    this.add.rectangle(cx, cy, gw, gh, 0x000000, 0.40);

    // ── Título ─────────────────────────────────────────────────
    this.add.text(cx, 90, 'OUTBREAK', {
      fontSize: '56px', color: '#3dff6e', fontStyle: 'bold', letterSpacing: 8
    }).setOrigin(0.5);

    this.add.text(cx, 150, 'DEFENSE', {
      fontSize: '32px', color: '#ffffff', letterSpacing: 12
    }).setOrigin(0.5);

    this.add.text(cx, 188, 'São Paulo City — Bioma 01', {
      fontSize: '13px', color: '#9999bb'
    }).setOrigin(0.5);

    this.add.rectangle(cx, 215, 200, 1, 0x3dff6e);

    // ── Botões ─────────────────────────────────────────────────
    this.criarBotao(cx, 252, 'INICIAR',    () => this.clicarStart());
    this.criarBotao(cx, 292, 'CARREGAR',   () => this.fecharOverlay(() => this.scene.start('LoadScene')));
    this.criarBotao(cx, 332, 'CONQUISTAS', () => this.fecharOverlay(() => this.scene.start('AchievementsScene')));
    this.criarBotao(cx, 372, 'OPÇÕES',     () => this.avisoEmBreve('Opções'));

    // ── Scanlines + Vinheta ─────────────────────────────────────
    const fx = this.add.graphics().setDepth(5);
    for (let y = 0; y < gh; y += 3) { fx.fillStyle(0x000000, 0.07); fx.fillRect(0, y, gw, 1); }
    const vA = [0.04, 0.07, 0.11, 0.16, 0.20, 0.26];
    const vS = [0.04, 0.07, 0.10, 0.14, 0.17, 0.21];
    for (let i = 0; i < 6; i++) {
      fx.fillStyle(0x000000, vA[i]);
      fx.fillRect(0, 0, gw * vS[i], gh);
      fx.fillRect(gw * (1 - vS[i]), 0, gw * vS[i], gh);
    }
    const tbA = [0.04, 0.08, 0.13, 0.18];
    const tbS = [0.03, 0.06, 0.10, 0.14];
    for (let i = 0; i < 4; i++) {
      fx.fillStyle(0x000000, tbA[i]);
      fx.fillRect(0, 0, gw, gh * tbS[i]);
      fx.fillRect(0, gh * (1 - tbS[i]), gw, gh * tbS[i]);
    }

    this.add.text(gw - 12, gh - 10, 'v0.1 — São Paulo City', { fontSize: '11px', color: '#666688' }).setOrigin(1);

    // ── Scanline animada (linha TV descendo) ──────────────────
    this._scanY   = 0;
    this._scanObj = this.add.rectangle(gw / 2, 0, gw, 2, 0xffffff).setAlpha(0.07).setDepth(6);

    // ── Glitch periódico ──────────────────────────────────────
    this._agendarGlitch();
  }

  // ── PASSO 1: clicou START → escolha de modo ───────────────
  clicarStart() {
    if (this.overlay) { this.fecharOverlay(); return; }
    this.abrirOverlayModo();
  }

  abrirOverlayModo() {
    const itens = [];
    const cx = this.cx;
    const cy = this.cy;
    const gw = this.gw;
    const gh = this.gh;
    const bottomY = gh - 42;

    // Fundo
    itens.push(this.add.rectangle(cx, cy, gw, gh, 0x000000, 0.92).setDepth(20));

    itens.push(this.add.text(cx, cy - 107, 'MODO DE JOGO', {
      fontSize: '18px', color: '#ffffff', letterSpacing: 5
    }).setOrigin(0.5).setDepth(21));

    itens.push(this.add.text(cx, cy - 83, 'Escolha a dificuldade antes de começar:', {
      fontSize: '11px', color: '#aaaacc'
    }).setOrigin(0.5).setDepth(21));

    // Linha separadora abaixo do cabeçalho
    itens.push(this.add.rectangle(cx, cy - 66, 560, 1, 0x2a2a4a).setDepth(21));

    // ── Card NORMAL ──────────────────────────────────────────
    itens.push(...this.criarCardModo(
      cx - 190, cy + 35,
      'NORMAL',
      '#3dff6e',
      0x1a2e1a,
      0x2a5a2a,
      [
        'Velocidade dos zumbis padrão',
        'Dano reduzido na base',
        'Ondas progressivas crescentes'
      ],
      () => this.selecionarModo('normal')
    ));

    // ── Card DIFÍCIL ─────────────────────────────────────────
    itens.push(...this.criarCardModo(
      cx + 190, cy + 35,
      'DIFÍCIL',
      '#ff4444',
      0x2e1a1a,
      0x5a2a2a,
      [
        'Zumbis mais rápidos e resistentes',
        'Dano aumentado na base',
        'Mais ondas simultâneas'
      ],
      () => this.selecionarModo('dificil')
    ));

    // Cancelar
    const cancelarBg = this.add.rectangle(cx, bottomY, 160, 30, 0x0d0d1e).setStrokeStyle(1, 0x333355).setDepth(21).setInteractive({ useHandCursor: true });
    const cancelar   = this.add.text(cx, bottomY, 'CANCELAR', {
      fontSize: '13px', color: '#aaaacc', letterSpacing: 3
    }).setOrigin(0.5).setDepth(22).setInteractive({ useHandCursor: true });
    itens.push(cancelarBg);

    cancelarBg.on('pointerover', () => { cancelarBg.setFillStyle(0x1e1e38); cancelar.setStyle({ color: '#ffffff' }); });
    cancelarBg.on('pointerout',  () => { cancelarBg.setFillStyle(0x0d0d1e); cancelar.setStyle({ color: '#aaaacc' }); });
    cancelarBg.on('pointerup',   () => this.fecharOverlay());
    cancelar.on('pointerover',   () => { cancelarBg.setFillStyle(0x1e1e38); cancelar.setStyle({ color: '#ffffff' }); });
    cancelar.on('pointerout',    () => { cancelarBg.setFillStyle(0x0d0d1e); cancelar.setStyle({ color: '#aaaacc' }); });
    cancelar.on('pointerup',     () => this.fecharOverlay());
    cancelar.on('pointerup',   () => this.fecharOverlay());
    itens.push(cancelar);

    this.overlay = itens;
  }

  criarCardModo(cx, cy, label, cor, fundoNormal, fundoHover, bullets, callback) {
    const itens = [];

    const card = this.add.rectangle(cx, cy, 300, 210, fundoNormal)
      .setStrokeStyle(2, fundoHover)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });

    // Título do modo
    const titulo = this.add.text(cx, cy - 78, label, {
      fontSize: '22px', color: cor, letterSpacing: 4, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(22);

    // Linha divisória
    itens.push(this.add.rectangle(cx, cy - 56, 220, 1, fundoHover).setDepth(22));

    // Bullet points de características
    bullets.forEach((txt, i) => {
      itens.push(this.add.text(cx - 96, cy - 38 + i * 26, '▸  ' + txt, {
        fontSize: '11px', color: '#aaaacc'
      }).setDepth(22));
    });

    // Badge inferior
    const badge = this.add.rectangle(cx, cy + 72, 180, 28, fundoHover).setDepth(22);
    const badgeTxt = this.add.text(cx, cy + 72, 'SELECIONAR', {
      fontSize: '12px', color: cor, letterSpacing: 3
    }).setOrigin(0.5).setDepth(23);

    // Hover
    card.on('pointerover', () => {
      card.setFillStyle(fundoHover);
      card.setStrokeStyle(2, cor);
      badgeTxt.setStyle({ color: '#ffffff' });
    });
    card.on('pointerout', () => {
      card.setFillStyle(fundoNormal);
      card.setStrokeStyle(2, fundoHover);
      badgeTxt.setStyle({ color: cor });
    });
    card.on('pointerup', () => callback());

    itens.push(card, titulo, badge, badgeTxt);
    return itens;
  }

  // ── PASSO 2: modo escolhido → checa slots ─────────────────
  selecionarModo(modo) {
    this.modoEscolhido = modo;

    // Modo difícil ainda não implementado
    if (modo === 'dificil') {
      this.fecharOverlay();
      this.avisoEmBreve('Modo Difícil — em breve');
      return;
    }

    // Salva o modo no registro para GameScene usar
    this.registry.set('modoJogo', modo);

    const slot1 = localStorage.getItem(SAVE_KEYS[0]);
    const slot2 = localStorage.getItem(SAVE_KEYS[1]);

    if (slot1 && slot2) {
      // Fecha overlay de modo e abre overlay de slot
      this.fecharOverlay(() => this.abrirOverlaySobrescrita(JSON.parse(slot1), JSON.parse(slot2)));
    } else {
      this.fecharOverlay(() => this.scene.start('StoryScene', { modo }));
    }
  }

  // ── Overlay de sobrescrita de slot ────────────────────────
  abrirOverlaySobrescrita(save1, save2) {
    const itens = [];
    const cx = this.cx;
    const cy = this.cy;
    const gh = this.gh;
    const bottomY = gh - 52;

    itens.push(this.add.rectangle(cx, cy, this.gw, gh, 0x000000, 0.82).setDepth(20));
    itens.push(this.add.rectangle(cx, cy, 560, 360, 0x0a0f1c).setStrokeStyle(1, 0x2a2a4a).setDepth(20));

    itens.push(this.add.text(cx, cy - 135, 'AMBOS OS SLOTS ESTÃO OCUPADOS', {
      fontSize: '13px', color: '#ff9944', letterSpacing: 3
    }).setOrigin(0.5).setDepth(21));

    itens.push(this.add.text(cx, cy - 109, 'Escolha qual slot deseja sobrescrever:', {
      fontSize: '12px', color: '#555577'
    }).setOrigin(0.5).setDepth(21));

    itens.push(this.add.rectangle(cx, cy - 91, 480, 1, 0x1a1a3a).setDepth(21));

    [save1, save2].forEach((save, i) => {
      itens.push(...this.criarCardSlot(i + 1, cy - 25 + i * 106, save));
    });

    const cancelar = this.add.text(cx, bottomY, 'CANCELAR', {
      fontSize: '13px', color: '#8888aa', letterSpacing: 3
    }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

    cancelar.on('pointerover', () => cancelar.setStyle({ color: '#ffffff' }));
    cancelar.on('pointerout',  () => cancelar.setStyle({ color: '#8888aa' }));
    cancelar.on('pointerup',   () => this.fecharOverlay());
    itens.push(cancelar);

    this.overlay = itens;
  }

  criarCardSlot(numero, cy, save) {
    const itens = [];
    const cx = this.cx;
    // Card: 480px wide, centrado no meio do jogo
    const CARD_W = 480;
    const CARD_H = 88;
    const LEFT   = cx - CARD_W / 2 + 22;
    const RIGHT  = cx + CARD_W / 2 - 16;

    const card = this.add.rectangle(cx, cy, CARD_W, CARD_H, 0x111128)
      .setStrokeStyle(1, 0x252545).setDepth(21).setInteractive({ useHandCursor: true });

    // Tag SAVE N
    itens.push(this.add.text(LEFT, cy - 32, 'SAVE ' + numero, {
      fontSize: '9px', color: '#3dff6e', letterSpacing: 3
    }).setDepth(22));

    // Nome do sobrevivente
    itens.push(this.add.text(LEFT, cy - 16, save.nome || 'Sobrevivente', {
      fontSize: '15px', color: '#ffffff', fontStyle: 'bold'
    }).setDepth(22));

    // Aliados selecionados
    const aliados = (save.aliados || save.personagens || []).join(', ');
    if (aliados) {
      itens.push(this.add.text(LEFT, cy + 6, 'Aliados: ' + aliados, {
        fontSize: '10px', color: '#00ccff'
      }).setDepth(22));
    }

    // Data • Gênero • Onda
    const generoTxt  = save.genero === 'fem' ? 'Feminino' : 'Masculino';
    const ondaTxt    = save.ondaAtual ? '  •  Onda ' + save.ondaAtual : '';
    itens.push(this.add.text(LEFT, cy + 22, (save.savedAt || '') + '  •  ' + generoTxt + ondaTxt, {
      fontSize: '10px', color: '#444466'
    }).setDepth(22));

    // Aviso de sobrescrita (direita, centralizado verticalmente)
    const aviso = this.add.text(RIGHT, cy, '⚠  sobrescrever', {
      fontSize: '10px', color: '#7a3311'
    }).setOrigin(1, 0.5).setDepth(22);

    card.on('pointerover', () => {
      card.setStrokeStyle(1, 0xff6633);
      card.setFillStyle(0x1e0e08);
      aviso.setStyle({ color: '#ff6633' });
    });
    card.on('pointerout', () => {
      card.setStrokeStyle(1, 0x252545);
      card.setFillStyle(0x111128);
      aviso.setStyle({ color: '#7a3311' });
    });
    card.on('pointerup', () => {
      this.fecharOverlay(() => {
        this.scene.start('StoryScene', { slot: numero, modo: this.modoEscolhido });
      });
    });

    itens.push(card, aviso);
    return itens;
  }

  fecharOverlay(callback) {
    if (this.overlay) {
      this.overlay.forEach(o => o.destroy());
      this.overlay = null;
    }
    if (callback) callback();
  }

  // ── Helpers ────────────────────────────────────────────────
  criarBotao(x, y, label, callback) {
    const acento = this.add.rectangle(x - 117, y, 3, 22, 0x3dff6e).setAlpha(0).setDepth(1);
    const seta   = this.add.text(x + 123, y, '›', {
      fontSize: '18px', color: '#3dff6e'
    }).setOrigin(0.5).setAlpha(0).setDepth(1);

    const bg = this.add.rectangle(x, y, 240, 34, 0x000000, 0)
      .setInteractive({ useHandCursor: true }).setDepth(1);

    const texto = this.add.text(x, y, label, {
      fontSize: '22px', color: '#aaaacc', letterSpacing: 4
    }).setOrigin(0.5).setDepth(2);

    bg.on('pointerover', () => {
      texto.setStyle({ color: '#3dff6e' }); texto.setX(x + 6);
      acento.setAlpha(1); seta.setAlpha(1);
    });
    bg.on('pointerout', () => {
      texto.setStyle({ color: '#aaaacc' }); texto.setX(x);
      acento.setAlpha(0); seta.setAlpha(0);
    });
    bg.on('pointerdown', () => texto.setStyle({ color: '#ffffff' }));
    bg.on('pointerup',   () => { texto.setStyle({ color: '#3dff6e' }); callback(); });
  }

  avisoEmBreve(nome) {
    if (this.textoAviso) this.textoAviso.destroy();
    this.textoAviso = this.add.text(this.cx, this.gh - 32, nome + ' — em breve', {
      fontSize: '13px', color: '#ff9944'
    }).setOrigin(0.5);
    this.time.delayedCall(2000, () => { if (this.textoAviso) this.textoAviso.destroy(); });
  }

  // ── Loop: scanline desce quadro a quadro ──────────────────
  update() {
    if (!this._scanObj) return;
    this._scanY = (this._scanY + 0.8) % this.scale.height;
    this._scanObj.setY(this._scanY);
  }

  // ── Agenda próximo glitch com delay aleatório ─────────────
  _agendarGlitch() {
    this.time.delayedCall(PhaserMath.Between(2500, 6000), () => {
      if (!this.scene.isActive('MenuScene')) return;
      this._dispararGlitch();
      this._agendarGlitch();
    });
  }

  // ── Dispara 2–4 fatias horizontais com desvio lateral ─────
  _dispararGlitch() {
    const gw = this.scale.width;
    const slices = PhaserMath.Between(2, 4);
    for (let i = 0; i < slices; i++) {
      const y   = PhaserMath.Between(40, 220);
      const h   = PhaserMath.Between(2, 8);
      const dx  = PhaserMath.Between(-12, 12);
      const dur = PhaserMath.Between(60, 160);

      const r1 = this.add.rectangle(gw / 2 + dx, y, gw, h, 0x3dff6e).setAlpha(0).setDepth(7);
      const r2 = this.add.rectangle(gw / 2 - dx / 2, y + 1, gw, h, 0xff0044).setAlpha(0).setDepth(7);

      this.tweens.add({ targets: r1, alpha: PhaserMath.FloatBetween(0.05, 0.13),
        duration: 20, yoyo: true, hold: dur, onComplete: () => r1.destroy() });
      this.tweens.add({ targets: r2, alpha: PhaserMath.FloatBetween(0.03, 0.08),
        duration: 20, yoyo: true, hold: dur, onComplete: () => r2.destroy() });
    }
  }
}
