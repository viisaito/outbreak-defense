import { Scene } from 'phaser';

export class MenuScene extends Scene {
  constructor() { super('MenuScene'); }

  create() {
    const cx = 400; // centro horizontal da tela
    const cy = 225; // centro vertical da tela

    // ── Fundo ──────────────────────────────────────────────────
    this.add.rectangle(cx, cy, 800, 450, 0x1a1a2e); // mesma cor do config

    // ── Título ─────────────────────────────────────────────────
    this.add.text(cx, 90, 'OUTBREAK', {
      fontSize: '56px',
      color: '#3dff6e',
      fontStyle: 'bold',
      letterSpacing: 8
    }).setOrigin(0.5);

    this.add.text(cx, 150, 'DEFENSE', {
      fontSize: '32px',
      color: '#ffffff',
      letterSpacing: 12
    }).setOrigin(0.5);

    this.add.text(cx, 188, 'São Paulo City — Bioma 01', {
      fontSize: '13px',
      color: '#666688'
    }).setOrigin(0.5);

    // ── Linha separadora ───────────────────────────────────────
    this.add.rectangle(cx, 215, 200, 1, 0x3dff6e);

    // ── Botões ─────────────────────────────────────────────────
    this.criarBotao(cx, 268, 'START',   () => this.scene.start('GameScene'));
    this.criarBotao(cx, 318, 'LOAD',    () => this.avisoEmBreve('LOAD'));
    this.criarBotao(cx, 368, 'OPTIONS', () => this.avisoEmBreve('OPTIONS'));

    // ── Versão ─────────────────────────────────────────────────
    this.add.text(790, 440, 'v0.1', {
      fontSize: '11px',
      color: '#444466'
    }).setOrigin(1);
  }

  // ── Cria um botão interativo com hover ──────────────────────
  criarBotao(x, y, label, callback) {
    const corNormal  = '#aaaacc';
    const corHover   = '#3dff6e';
    const corClique  = '#ffffff';

    const texto = this.add.text(x, y, label, {
      fontSize: '22px',
      color: corNormal,
      letterSpacing: 4
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Hover: ilumina ao passar o mouse
    texto.on('pointerover',  () => texto.setStyle({ color: corHover }));
    texto.on('pointerout',   () => texto.setStyle({ color: corNormal }));
    texto.on('pointerdown',  () => texto.setStyle({ color: corClique }));
    texto.on('pointerup',    () => {
      texto.setStyle({ color: corHover });
      callback();
    });
  }

  // ── Aviso temporário para funcionalidades ainda não prontas ─
  avisoEmBreve(nome) {
    // Remove aviso anterior se existir
    if (this.textoAviso) this.textoAviso.destroy();

    this.textoAviso = this.add.text(400, 418, nome + ' — em breve', {
      fontSize: '13px',
      color: '#ff9944'
    }).setOrigin(0.5);

    // Some após 2 segundos
    this.time.delayedCall(2000, () => {
      if (this.textoAviso) this.textoAviso.destroy();
    });
  }
}
