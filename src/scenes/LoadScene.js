import { Scene } from 'phaser';

const SAVE_KEYS = [
  'outbreak-defense-save-1',
  'outbreak-defense-save-2'
];

const CABELOS = [
  { label: 'Preto',    cor: 0x111111 },
  { label: 'Castanho', cor: 0x5c3317 },
  { label: 'Loiro',    cor: 0xf5d76e },
  { label: 'Ruivo',    cor: 0xc0392b },
  { label: 'Branco',   cor: 0xeeeeee }
];

const ROUPAS = [
  { label: 'Verde',    cor: 0x27ae60 },
  { label: 'Azul',     cor: 0x2980b9 },
  { label: 'Vermelho', cor: 0xc0392b },
  { label: 'Laranja',  cor: 0xe67e22 },
  { label: 'Roxo',     cor: 0x8e44ad }
];

export class LoadScene extends Scene {
  constructor() { super('LoadScene'); }

  create() {
    this.add.rectangle(400, 225, 800, 450, 0x12122a);

    this.add.text(400, 28, 'CARREGAR JOGO', {
      fontSize: '20px', color: '#3dff6e', letterSpacing: 4
    }).setOrigin(0.5);

    // Renderiza os dois slots
    const posY = [130, 280]; // y central de cada card
    SAVE_KEYS.forEach((key, i) => {
      const raw  = localStorage.getItem(key);
      const save = raw ? JSON.parse(raw) : null;
      this.criarSlot(i + 1, posY[i], save);
    });

    // Botão VOLTAR
    const voltar = this.add.text(60, 430, '← VOLTAR', {
      fontSize: '13px', color: '#555577'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    voltar.on('pointerover', () => voltar.setStyle({ color: '#aaaacc' }));
    voltar.on('pointerout',  () => voltar.setStyle({ color: '#555577' }));
    voltar.on('pointerup',   () => this.scene.start('MenuScene'));
  }

  criarSlot(numero, cy, save) {
    const x     = 400;
    const label = 'SAVE ' + numero;

    if (save) {
      this.criarSlotPreenchido(x, cy, numero, label, save);
    } else {
      this.criarSlotVazio(x, cy, numero, label);
    }
  }

  // ── Slot com personagem salvo ──────────────────────────────
  criarSlotPreenchido(x, cy, numero, label, save) {
    const cabelo = CABELOS[save.cabeloIndex] || CABELOS[0];
    const roupa  = ROUPAS[save.roupaIndex]   || ROUPAS[0];

    const card = this.add.rectangle(x, cy, 580, 108, 0x1e1e3a)
      .setStrokeStyle(1, 0x333355)
      .setInteractive({ useHandCursor: true });

    // Rótulo do slot
    this.add.text(x - 278, cy - 44, label, {
      fontSize: '10px', color: '#3dff6e', letterSpacing: 3
    });

    // Mini preview do personagem
    const px = x - 230;
    this.add.circle(px, cy - 10, 20, cabelo.cor);
    this.add.rectangle(px, cy + 26, save.genero === 'masc' ? 34 : 28, 56, roupa.cor);
    this.add.rectangle(px - 20, cy + 22, 10, 38, roupa.cor);
    this.add.rectangle(px + 20, cy + 22, 10, 38, roupa.cor);

    // Informações
    this.add.text(x - 196, cy - 30, save.nome, {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
    });

    this.add.text(x - 196, cy - 6, (save.genero === 'masc' ? 'Masculino' : 'Feminino') +
      '   Cabelo: ' + cabelo.label + '   Roupa: ' + roupa.label, {
      fontSize: '11px', color: '#666688'
    });

    this.add.text(x - 196, cy + 16, '💾  Salvo em ' + save.savedAt, {
      fontSize: '11px', color: '#555577'
    });

    // Hover e clique no card
    card.on('pointerover', () => card.setStrokeStyle(1, 0x3dff6e));
    card.on('pointerout',  () => card.setStrokeStyle(1, 0x333355));
    card.on('pointerup',   () => this.carregarSave(save));

    // Botão apagar (pequeno, canto direito)
    const apagar = this.add.text(x + 268, cy + 36, 'APAGAR', {
      fontSize: '10px', color: '#553333', letterSpacing: 1
    }).setOrigin(1).setInteractive({ useHandCursor: true });

    apagar.on('pointerover', () => apagar.setStyle({ color: '#ff4444' }));
    apagar.on('pointerout',  () => apagar.setStyle({ color: '#553333' }));
    apagar.on('pointerup',   () => this.confirmarApagar(numero, apagar));
  }

  // ── Slot vazio ─────────────────────────────────────────────
  criarSlotVazio(x, cy, numero, label) {
    const card = this.add.rectangle(x, cy, 580, 108, 0x16162a)
      .setStrokeStyle(1, 0x2a2a4a)
      .setInteractive({ useHandCursor: true });

    this.add.text(x - 278, cy - 44, label, {
      fontSize: '10px', color: '#444466', letterSpacing: 3
    });

    this.add.text(x, cy - 12, 'SLOT VAZIO', {
      fontSize: '16px', color: '#333355', letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(x, cy + 16, 'Clique para iniciar nova partida neste slot', {
      fontSize: '12px', color: '#2a2a44'
    }).setOrigin(0.5);

    card.on('pointerover', () => {
      card.setStrokeStyle(1, 0x3dff6e);
      card.setFillStyle(0x1a1a30);
    });
    card.on('pointerout', () => {
      card.setStrokeStyle(1, 0x2a2a4a);
      card.setFillStyle(0x16162a);
    });
    card.on('pointerup', () => {
      // Passa o slot para StoryScene → CharacterScene salva no slot certo
      this.scene.start('StoryScene', { slot: numero });
    });
  }

  // ── Carregar save existente ────────────────────────────────
  carregarSave(save) {
    this.registry.set('personagem', {
      nome:   save.nome,
      genero: save.genero,
      cabelo: CABELOS[save.cabeloIndex] || CABELOS[0],
      roupa:  ROUPAS[save.roupaIndex]   || ROUPAS[0]
    });

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(310, () => this.scene.start('GameScene'));
  }

  // ── Apagar save com confirmação dupla ──────────────────────
  confirmarApagar(numero, btnRef) {
    const key = '_confirmando' + numero;
    if (this[key]) {
      localStorage.removeItem(SAVE_KEYS[numero - 1]);
      this.scene.restart();
      return;
    }
    this[key] = true;
    btnRef.setText('CONFIRMAR?').setStyle({ color: '#ff4444' });
    // Cancela após 3s sem segundo clique
    this.time.delayedCall(3000, () => {
      this[key] = false;
      if (btnRef.active) btnRef.setText('APAGAR').setStyle({ color: '#553333' });
    });
  }
}
