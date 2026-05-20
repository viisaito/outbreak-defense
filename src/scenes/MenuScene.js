import { Scene } from 'phaser';

const SAVE_KEYS = ['outbreak-defense-save-1', 'outbreak-defense-save-2'];

export class MenuScene extends Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = 400;
    const cy = 225;

    this.overlay  = null; // referência ao overlay ativo
    this.modoEscolhido = null; // guarda o modo antes de checar slots

    // ── Fundo ──────────────────────────────────────────────────
    this.add.rectangle(cx, cy, 800, 450, 0x1a1a2e);

    // ── Título ─────────────────────────────────────────────────
    this.add.text(cx, 90, 'OUTBREAK', {
      fontSize: '56px', color: '#3dff6e', fontStyle: 'bold', letterSpacing: 8
    }).setOrigin(0.5);

    this.add.text(cx, 150, 'DEFENSE', {
      fontSize: '32px', color: '#ffffff', letterSpacing: 12
    }).setOrigin(0.5);

    this.add.text(cx, 188, 'São Paulo City — Bioma 01', {
      fontSize: '13px', color: '#666688'
    }).setOrigin(0.5);

    this.add.rectangle(cx, 215, 200, 1, 0x3dff6e);

    // ── Botões ─────────────────────────────────────────────────
    this.criarBotao(cx, 252, 'INICIAR',    () => this.clicarStart());
    this.criarBotao(cx, 292, 'CARREGAR',   () => this.fecharOverlay(() => this.scene.start('LoadScene')));
    this.criarBotao(cx, 332, 'CONQUISTAS', () => this.fecharOverlay(() => this.scene.start('AchievementsScene')));
    this.criarBotao(cx, 372, 'OPÇÕES',     () => this.avisoEmBreve('Opções'));

    this.add.text(790, 440, 'v0.1', { fontSize: '11px', color: '#444466' }).setOrigin(1);
  }

  // ── PASSO 1: clicou START → escolha de modo ───────────────
  clicarStart() {
    if (this.overlay) { this.fecharOverlay(); return; }
    this.abrirOverlayModo();
  }

  abrirOverlayModo() {
    const itens = [];

    // Fundo
    itens.push(this.add.rectangle(400, 225, 800, 450, 0x000000, 0.8).setDepth(20));

    itens.push(this.add.text(400, 118, 'MODO DE JOGO', {
      fontSize: '18px', color: '#ffffff', letterSpacing: 5
    }).setOrigin(0.5).setDepth(21));

    itens.push(this.add.text(400, 148, 'Escolha a dificuldade antes de começar:', {
      fontSize: '12px', color: '#555577'
    }).setOrigin(0.5).setDepth(21));

    // ── Card NORMAL ──────────────────────────────────────────
    itens.push(...this.criarCardModo(
      210, 260,
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
      590, 260,
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
    const cancelar = this.add.text(400, 408, 'CANCELAR', {
      fontSize: '13px', color: '#555577', letterSpacing: 3
    }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

    cancelar.on('pointerover', () => cancelar.setStyle({ color: '#aaaacc' }));
    cancelar.on('pointerout',  () => cancelar.setStyle({ color: '#555577' }));
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

    itens.push(this.add.rectangle(400, 225, 800, 450, 0x000000, 0.82).setDepth(20));
    itens.push(this.add.rectangle(400, 225, 560, 360, 0x0a0f1c).setStrokeStyle(1, 0x2a2a4a).setDepth(20));

    itens.push(this.add.text(400, 90, 'AMBOS OS SLOTS ESTÃO OCUPADOS', {
      fontSize: '13px', color: '#ff9944', letterSpacing: 3
    }).setOrigin(0.5).setDepth(21));

    itens.push(this.add.text(400, 116, 'Escolha qual slot deseja sobrescrever:', {
      fontSize: '12px', color: '#555577'
    }).setOrigin(0.5).setDepth(21));

    itens.push(this.add.rectangle(400, 134, 480, 1, 0x1a1a3a).setDepth(21));

    [save1, save2].forEach((save, i) => {
      itens.push(...this.criarCardSlot(i + 1, 200 + i * 106, save));
    });

    const cancelar = this.add.text(400, 398, 'CANCELAR', {
      fontSize: '13px', color: '#444466', letterSpacing: 3
    }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

    cancelar.on('pointerover', () => cancelar.setStyle({ color: '#aaaacc' }));
    cancelar.on('pointerout',  () => cancelar.setStyle({ color: '#444466' }));
    cancelar.on('pointerup',   () => this.fecharOverlay());
    itens.push(cancelar);

    this.overlay = itens;
  }

  criarCardSlot(numero, cy, save) {
    const itens = [];
    // Card: 480px wide, centrado em x=400 → borda esquerda x=160, direita x=640
    const CARD_W = 480;
    const CARD_H = 88;
    const LEFT   = 400 - CARD_W / 2 + 22; // x=182 — margem interna esquerda
    const RIGHT  = 400 + CARD_W / 2 - 16; // x=624 — margem interna direita

    const card = this.add.rectangle(400, cy, CARD_W, CARD_H, 0x111128)
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
    const texto = this.add.text(x, y, label, {
      fontSize: '22px', color: '#aaaacc', letterSpacing: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    texto.on('pointerover',  () => texto.setStyle({ color: '#3dff6e' }));
    texto.on('pointerout',   () => texto.setStyle({ color: '#aaaacc' }));
    texto.on('pointerdown',  () => texto.setStyle({ color: '#ffffff' }));
    texto.on('pointerup',    () => { texto.setStyle({ color: '#3dff6e' }); callback(); });
  }

  avisoEmBreve(nome) {
    if (this.textoAviso) this.textoAviso.destroy();
    this.textoAviso = this.add.text(400, 418, nome + ' — em breve', {
      fontSize: '13px', color: '#ff9944'
    }).setOrigin(0.5);
    this.time.delayedCall(2000, () => { if (this.textoAviso) this.textoAviso.destroy(); });
  }
}
