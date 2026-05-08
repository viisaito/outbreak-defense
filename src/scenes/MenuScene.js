import { Scene } from 'phaser';

const SAVE_KEYS = ['outbreak-defense-save-1', 'outbreak-defense-save-2'];

export class MenuScene extends Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = 400;
    const cy = 225;

    this.overlay = null; // referência ao modal de sobrescrita

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
    this.criarBotao(cx, 268, 'START',   () => this.clicarStart());
    this.criarBotao(cx, 318, 'LOAD',    () => this.fecharOverlay(() => this.scene.start('LoadScene')));
    this.criarBotao(cx, 368, 'OPTIONS', () => this.avisoEmBreve('OPTIONS'));

    this.add.text(790, 440, 'v0.1', { fontSize: '11px', color: '#444466' }).setOrigin(1);
  }

  // ── Lógica do START ────────────────────────────────────────
  clicarStart() {
    // Se o overlay já está aberto, fecha
    if (this.overlay) { this.fecharOverlay(); return; }

    const slot1 = localStorage.getItem(SAVE_KEYS[0]);
    const slot2 = localStorage.getItem(SAVE_KEYS[1]);

    if (slot1 && slot2) {
      // Ambos ocupados → pergunta qual sobrescrever
      this.abrirOverlaySobrescrita(
        JSON.parse(slot1),
        JSON.parse(slot2)
      );
    } else {
      // Pelo menos um slot livre → vai direto, CharacterScene escolhe o slot
      this.scene.start('StoryScene');
    }
  }

  // ── Modal de escolha de slot ───────────────────────────────
  abrirOverlaySobrescrita(save1, save2) {
    const itens = []; // guarda todos os objetos do overlay para destruir depois

    // Fundo semitransparente
    const bg = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.75).setDepth(20);
    itens.push(bg);

    // Título
    itens.push(this.add.text(400, 105, 'AMBOS OS SLOTS ESTÃO OCUPADOS', {
      fontSize: '15px', color: '#ff9944', letterSpacing: 3
    }).setOrigin(0.5).setDepth(21));

    itens.push(this.add.text(400, 132, 'Escolha qual slot deseja sobrescrever:', {
      fontSize: '13px', color: '#aaaacc'
    }).setOrigin(0.5).setDepth(21));

    // Cards dos dois slots
    [save1, save2].forEach((save, i) => {
      const cy = 220 + i * 90;
      itens.push(...this.criarCardSlot(i + 1, cy, save));
    });

    // Botão cancelar
    const cancelar = this.add.text(400, 400, 'CANCELAR', {
      fontSize: '14px', color: '#555577', letterSpacing: 3
    }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

    cancelar.on('pointerover', () => cancelar.setStyle({ color: '#aaaacc' }));
    cancelar.on('pointerout',  () => cancelar.setStyle({ color: '#555577' }));
    cancelar.on('pointerup',   () => this.fecharOverlay());
    itens.push(cancelar);

    // Guarda referência para destruir depois
    this.overlay = itens;
  }

  criarCardSlot(numero, cy, save) {
    const itens = [];

    const card = this.add.rectangle(400, cy, 500, 72, 0x1e1e3a)
      .setStrokeStyle(1, 0x333355)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });

    const rotulo = this.add.text(148, cy - 28, 'SAVE ' + numero, {
      fontSize: '10px', color: '#3dff6e', letterSpacing: 2
    }).setDepth(22);

    const nome = this.add.text(148, cy - 10, save.nome, {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
    }).setDepth(22);

    const detalhe = this.add.text(148, cy + 14, save.savedAt + '   •   ' +
      (save.genero === 'masc' ? 'Masculino' : 'Feminino'), {
      fontSize: '11px', color: '#666688'
    }).setDepth(22);

    const aviso = this.add.text(634, cy, '⚠ sobrescrever', {
      fontSize: '11px', color: '#aa4422'
    }).setOrigin(1, 0.5).setDepth(22);

    card.on('pointerover', () => {
      card.setStrokeStyle(1, 0xff6633);
      card.setFillStyle(0x2a1a1a);
      aviso.setStyle({ color: '#ff6633' });
    });
    card.on('pointerout', () => {
      card.setStrokeStyle(1, 0x333355);
      card.setFillStyle(0x1e1e3a);
      aviso.setStyle({ color: '#aa4422' });
    });
    card.on('pointerup', () => {
      this.fecharOverlay(() => {
        this.scene.start('StoryScene', { slot: numero });
      });
    });

    itens.push(card, rotulo, nome, detalhe, aviso);
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
