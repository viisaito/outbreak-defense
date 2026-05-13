import { Scene } from 'phaser';

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

const NOME_PADRAO = 'Sobrevivente';
const LIMITE_NOME = 16;

export class CharacterScene extends Scene {
  constructor() { super('CharacterScene'); }

  create() {
    this.slotAlvo  = this.scene.settings.data?.slot || null;
    this.modoJogo  = this.scene.settings.data?.modo || 'normal';
    this.selecao   = { genero: 'masc', cabelo: 0, roupa: 0 };
    this.nome      = '';
    this.nomeAtivo = false;

    // ── Fundo ──────────────────────────────────────────────────
    this.add.rectangle(400, 225, 800, 450, 0x12122a);

    // ── Título ─────────────────────────────────────────────────
    this.add.text(400, 28, 'CRIE SEU PERSONAGEM', {
      fontSize: '19px', color: '#3dff6e', letterSpacing: 4
    }).setOrigin(0.5);

    this.add.text(400, 52, 'Etapa 1 de 2', {
      fontSize: '11px', color: '#444466'
    }).setOrigin(0.5);

    // ── Prévia (esquerda) ──────────────────────────────────────
    this.add.text(175, 75, 'PRÉVIA', {
      fontSize: '11px', color: '#555577', letterSpacing: 3
    }).setOrigin(0.5);

    this.previewGeneroTexto = this.add.text(175, 100, 'MASC', {
      fontSize: '11px', color: '#aaaacc', letterSpacing: 2
    }).setOrigin(0.5);

    this.previewCabeca  = this.add.circle(175, 140, 36, CABELOS[0].cor);
    this.previewCorpo   = this.add.rectangle(175, 228, 60, 110, ROUPAS[0].cor);
    this.previewBracoE  = this.add.rectangle(138, 218, 18, 70,  ROUPAS[0].cor);
    this.previewBracoD  = this.add.rectangle(212, 218, 18, 70,  ROUPAS[0].cor);
    this.add.rectangle(160, 302, 24, 50, 0x333355);
    this.add.rectangle(190, 302, 24, 50, 0x333355);

    this.textoNomePreview = this.add.text(175, 338, NOME_PADRAO, {
      fontSize: '12px', color: '#aaaacc'
    }).setOrigin(0.5);

    // ── Opções (direita) ───────────────────────────────────────
    const px = 470;

    // Gênero
    this.add.text(px, 72, 'GÊNERO', { fontSize: '12px', color: '#888899', letterSpacing: 3 });
    this.btnMasc = this.criarBotaoOpcao(px + 10,  100, 'MASCULINO', () => this.setGenero('masc'));
    this.btnFem  = this.criarBotaoOpcao(px + 165, 100, 'FEMININO',  () => this.setGenero('fem'));

    // Cabelo
    this.add.text(px, 140, 'COR DO CABELO', { fontSize: '12px', color: '#888899', letterSpacing: 3 });
    this.btnsCabelo = CABELOS.map((c, i) =>
      this.criarSwatchCor(px + 10 + i * 56, 174, c.cor, c.label, () => this.setCabelo(i))
    );

    // Roupa
    this.add.text(px, 210, 'COR DA ROUPA', { fontSize: '12px', color: '#888899', letterSpacing: 3 });
    this.btnsRoupa = ROUPAS.map((r, i) =>
      this.criarSwatchCor(px + 10 + i * 56, 244, r.cor, r.label, () => this.setRoupa(i))
    );

    // Nome
    this.add.text(px, 278, 'NOME  (opcional)', { fontSize: '12px', color: '#888899', letterSpacing: 3 });

    this.caixaNomeBg = this.add.rectangle(px + 125, 306, 250, 30, 0x1e1e3a)
      .setStrokeStyle(1, 0x333355)
      .setInteractive({ useHandCursor: true });

    this.textoNomeInput = this.add.text(px + 8, 294, NOME_PADRAO, {
      fontSize: '14px', color: '#555577'
    });

    this.textoCursor = this.add.text(0, 294, '|', {
      fontSize: '14px', color: '#3dff6e'
    }).setVisible(false);

    this.tweens.add({ targets: this.textoCursor, alpha: 0, duration: 500, yoyo: true, repeat: -1 });

    this.caixaNomeBg.on('pointerup',   () => this.ativarCampoNome());
    this.caixaNomeBg.on('pointerover', () => { if (!this.nomeAtivo) this.caixaNomeBg.setStrokeStyle(1, 0x3dff6e); });
    this.caixaNomeBg.on('pointerout',  () => { if (!this.nomeAtivo) this.caixaNomeBg.setStrokeStyle(1, 0x333355); });

    this.input.on('pointerdown', (pointer, objects) => {
      if (this.nomeAtivo && !objects.includes(this.caixaNomeBg)) this.desativarCampoNome();
    });

    this.input.keyboard.on('keydown', (e) => this.onTecla(e));

    // ── Separador ──────────────────────────────────────────────
    this.add.rectangle(400, 348, 680, 1, 0x333355);

    // ── Botão PRÓXIMO ──────────────────────────────────────────
    const btnProx = this.add.rectangle(400, 396, 220, 44, 0x1a4a2a)
      .setInteractive({ useHandCursor: true });
    this.add.text(400, 396, 'PRÓXIMO →', {
      fontSize: '18px', color: '#3dff6e', letterSpacing: 4
    }).setOrigin(0.5);

    btnProx.on('pointerover',  () => btnProx.setFillStyle(0x27ae60));
    btnProx.on('pointerout',   () => btnProx.setFillStyle(0x1a4a2a));
    btnProx.on('pointerdown',  () => btnProx.setFillStyle(0x145a32));
    btnProx.on('pointerup',    () => this.irParaEsquadrao());

    // ── Botão VOLTAR ───────────────────────────────────────────
    const voltar = this.add.text(60, 432, '← VOLTAR', {
      fontSize: '13px', color: '#555577'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    voltar.on('pointerover', () => voltar.setStyle({ color: '#aaaacc' }));
    voltar.on('pointerout',  () => voltar.setStyle({ color: '#555577' }));
    voltar.on('pointerup',   () => this.scene.start('StoryScene'));

    this.atualizarSelecaoVisual();
    this.atualizarSwatches(this.btnsCabelo, 0);
    this.atualizarSwatches(this.btnsRoupa,  0);
  }

  irParaEsquadrao() {
    this.desativarCampoNome();
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.time.delayedCall(260, () => {
      this.scene.start('SquadScene', {
        slot:        this.slotAlvo,
        modo:        this.modoJogo,
        nome:        this.nome.trim() || NOME_PADRAO,
        genero:      this.selecao.genero,
        cabeloIndex: this.selecao.cabelo,
        roupaIndex:  this.selecao.roupa
      });
    });
  }

  // ── Campo de nome ──────────────────────────────────────────
  ativarCampoNome() {
    this.nomeAtivo = true;
    this.caixaNomeBg.setStrokeStyle(1, 0x3dff6e);
    if (this.nome === '') this.textoNomeInput.setText('');
    this.textoCursor.setVisible(true);
    this.atualizarCursor();
  }

  desativarCampoNome() {
    this.nomeAtivo = false;
    this.caixaNomeBg.setStrokeStyle(1, 0x333355);
    this.textoCursor.setVisible(false);
    if (this.nome.trim() === '') {
      this.textoNomeInput.setText(NOME_PADRAO).setStyle({ color: '#555577' });
    }
  }

  onTecla(e) {
    if (!this.nomeAtivo) return;
    if (e.key === 'Backspace') {
      this.nome = this.nome.slice(0, -1);
    } else if (e.key === 'Enter' || e.key === 'Escape') {
      this.desativarCampoNome(); return;
    } else if (e.key.length === 1 && this.nome.length < LIMITE_NOME) {
      this.nome += e.key;
    }
    this.textoNomeInput.setText(this.nome || '').setStyle({ color: '#ffffff' });
    this.textoNomePreview.setText(this.nome || NOME_PADRAO);
    this.atualizarCursor();
  }

  atualizarCursor() {
    this.textoCursor.setX(this.textoNomeInput.x + this.textoNomeInput.width + 2);
  }

  // ── Helpers ────────────────────────────────────────────────
  criarBotaoOpcao(x, y, label, callback) {
    const bg  = this.add.rectangle(x + 60, y + 14, 114, 28, 0x1e1e3a).setInteractive({ useHandCursor: true });
    const txt = this.add.text(x + 60, y + 14, label, { fontSize: '13px', color: '#aaaacc', letterSpacing: 2 }).setOrigin(0.5);
    bg.on('pointerover', () => { if (!bg._selecionado) bg.setFillStyle(0x2a2a4a); });
    bg.on('pointerout',  () => { if (!bg._selecionado) bg.setFillStyle(0x1e1e3a); });
    bg.on('pointerup',   () => callback());
    bg._txt = txt; bg._selecionado = false;
    return bg;
  }

  criarSwatchCor(x, y, cor, label, callback) {
    const c = this.add.circle(x, y, 16, cor).setInteractive({ useHandCursor: true });
    const b = this.add.circle(x, y, 20).setStrokeStyle(2, 0x3dff6e).setFillStyle();
    b.setVisible(false);
    this.add.text(x, y + 28, label, { fontSize: '9px', color: '#666688' }).setOrigin(0.5);
    c.on('pointerover', () => c.setScale(1.15));
    c.on('pointerout',  () => c.setScale(1));
    c.on('pointerup',   () => callback());
    c._borda = b;
    return c;
  }

  setGenero(g) { this.selecao.genero = g; this.atualizarSelecaoVisual(); }

  setCabelo(i) {
    this.selecao.cabelo = i;
    this.previewCabeca.setFillStyle(CABELOS[i].cor);
    this.atualizarSwatches(this.btnsCabelo, i);
  }

  setRoupa(i) {
    this.selecao.roupa = i;
    const cor = ROUPAS[i].cor;
    this.previewCorpo.setFillStyle(cor);
    this.previewBracoE.setFillStyle(cor);
    this.previewBracoD.setFillStyle(cor);
    this.atualizarSwatches(this.btnsRoupa, i);
  }

  atualizarSwatches(lista, sel) { lista.forEach((s, i) => s._borda.setVisible(i === sel)); }

  atualizarSelecaoVisual() {
    const isMasc = this.selecao.genero === 'masc';
    [this.btnMasc, this.btnFem].forEach((b, i) => {
      const ativo = (i === 0) === isMasc;
      b._selecionado = ativo;
      b.setFillStyle(ativo ? 0x1a4a2a : 0x1e1e3a);
      b._txt.setStyle({ color: ativo ? '#3dff6e' : '#aaaacc' });
    });
    this.previewGeneroTexto.setText(isMasc ? 'MASC' : 'FEM');
    this.previewCorpo.setSize(isMasc ? 60 : 52, 110);
  }
}
