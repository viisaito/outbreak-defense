import { Scene } from 'phaser';

const SAVE_KEYS = [
  'outbreak-defense-save-1',
  'outbreak-defense-save-2'
];

const PERSONAGENS_INFO = {
  vini:   { nome: 'Vini',   cor: 0x2980b9 },
  helena: { nome: 'Helena', cor: 0x8e44ad },
  daniel: { nome: 'Daniel', cor: 0xe67e22 }
};

export class LoadScene extends Scene {
  constructor() { super('LoadScene'); }

  create() {
    this.add.rectangle(400, 225, 800, 450, 0x12122a);

    this.add.text(400, 28, 'CARREGAR JOGO', {
      fontSize: '20px', color: '#3dff6e', letterSpacing: 4
    }).setOrigin(0.5);

    const posY = [138, 288];
    SAVE_KEYS.forEach((key, i) => {
      const raw  = localStorage.getItem(key);
      const save = raw ? JSON.parse(raw) : null;
      this.criarSlot(i + 1, posY[i], save);
    });

    // Botão VOLTAR
    const voltar = this.add.text(60, 432, '← VOLTAR', {
      fontSize: '13px', color: '#555577'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    voltar.on('pointerover', () => voltar.setStyle({ color: '#aaaacc' }));
    voltar.on('pointerout',  () => voltar.setStyle({ color: '#555577' }));
    voltar.on('pointerup',   () => this.scene.start('MenuScene'));
  }

  criarSlot(numero, cy, save) {
    if (save) {
      this.criarSlotPreenchido(numero, cy, save);
    } else {
      this.criarSlotVazio(numero, cy);
    }
  }

  // ── Slot com save ──────────────────────────────────────────
  criarSlotPreenchido(numero, cy, save) {
    const card = this.add.rectangle(400, cy, 680, 112, 0x1e1e3a)
      .setStrokeStyle(1, 0x333355)
      .setInteractive({ useHandCursor: true });

    // Rótulo
    this.add.text(68, cy - 40, 'SLOT ' + numero, {
      fontSize: '10px', color: '#3dff6e', letterSpacing: 3
    });

    // Mini retratos dos aliados
    const personagens = save.aliados || save.personagens || [];
    personagens.forEach((id, i) => {
      const info = PERSONAGENS_INFO[id];
      if (!info) return;
      const px = 88 + i * 52;
      this.add.circle(px, cy - 4, 18, info.cor);
      this.add.text(px, cy - 4, info.nome[0], {
        fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
      }).setOrigin(0.5);
    });

    // Nome do personagem customizado
    this.add.text(220, cy - 26, save.nome || 'Sobrevivente', {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold'
    });

    // Aliados
    const nomes = personagens
      .map(id => PERSONAGENS_INFO[id]?.nome || id)
      .join(', ');

    this.add.text(220, cy - 2, 'Aliados: ' + nomes, {
      fontSize: '12px', color: '#aaaacc'
    });

    // Data de save
    this.add.text(220, cy + 20, '💾  Salvo em ' + (save.savedAt || '—'), {
      fontSize: '11px', color: '#555577'
    });

    // Dificuldade (canto direito, alinhado verticalmente ao centro)
    const modo     = save.modo || 'normal';
    const corModo  = modo === 'dificil' ? '#ff6644' : '#3dff6e';
    const labelModo = modo === 'dificil' ? '⚠ DIFÍCIL' : 'NORMAL';

    this.add.rectangle(618, cy - 8, 96, 26, modo === 'dificil' ? 0x3a1a1a : 0x1a2e1a)
      .setStrokeStyle(1, modo === 'dificil' ? 0x5a2a2a : 0x2a5a2a);
    this.add.text(618, cy - 8, labelModo, {
      fontSize: '11px', color: corModo, letterSpacing: 1
    }).setOrigin(0.5);

    // Hover e clique
    card.on('pointerover', () => card.setStrokeStyle(1, 0x3dff6e));
    card.on('pointerout',  () => card.setStrokeStyle(1, 0x333355));
    card.on('pointerup',   () => this.carregarSave(save));

    // Botão apagar
    const apagar = this.add.text(716, cy + 40, 'APAGAR', {
      fontSize: '10px', color: '#553333', letterSpacing: 1
    }).setOrigin(1).setInteractive({ useHandCursor: true });

    apagar.on('pointerover', () => apagar.setStyle({ color: '#ff4444' }));
    apagar.on('pointerout',  () => apagar.setStyle({ color: '#553333' }));
    apagar.on('pointerup',   () => this.confirmarApagar(numero, apagar));
  }

  // ── Slot vazio ─────────────────────────────────────────────
  criarSlotVazio(numero, cy) {
    const card = this.add.rectangle(400, cy, 680, 112, 0x16162a)
      .setStrokeStyle(1, 0x2a2a4a)
      .setInteractive({ useHandCursor: true });

    this.add.text(68, cy - 40, 'SLOT ' + numero, {
      fontSize: '10px', color: '#444466', letterSpacing: 3
    });

    this.add.text(400, cy - 12, 'SLOT VAZIO', {
      fontSize: '16px', color: '#333355', letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(400, cy + 16, 'Clique para iniciar nova partida neste slot', {
      fontSize: '12px', color: '#2a2a44'
    }).setOrigin(0.5);

    card.on('pointerover', () => { card.setStrokeStyle(1, 0x3dff6e); card.setFillStyle(0x1a1a30); });
    card.on('pointerout',  () => { card.setStrokeStyle(1, 0x2a2a4a); card.setFillStyle(0x16162a); });
    card.on('pointerup',   () => this.scene.start('StoryScene', { slot: numero }));
  }

  // ── Carregar ───────────────────────────────────────────────
  carregarSave(save) {
    const aliados = save.aliados || save.personagens || [];
    this.registry.set('aliados',     aliados);
    this.registry.set('personagens', aliados);
    this.registry.set('modoJogo',    save.modo || 'normal');
    this.registry.set('personagem',  {
      nome:        save.nome        || 'Sobrevivente',
      genero:      save.genero      || 'masc',
      cabeloIndex: save.cabeloIndex ?? 0,
      roupaIndex:  save.roupaIndex  ?? 0
    });

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(310, () => this.scene.start('GameScene'));
  }

  // ── Apagar com confirmação dupla ───────────────────────────
  confirmarApagar(numero, btnRef) {
    const key = '_confirmando' + numero;
    if (this[key]) {
      localStorage.removeItem(SAVE_KEYS[numero - 1]);
      this.scene.restart();
      return;
    }
    this[key] = true;
    btnRef.setText('CONFIRMAR?').setStyle({ color: '#ff4444' });
    this.time.delayedCall(3000, () => {
      this[key] = false;
      if (btnRef.active) btnRef.setText('APAGAR').setStyle({ color: '#553333' });
    });
  }
}
