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
    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.slotAlvo  = this.scene.settings.data?.slot || null;
    this.modoJogo  = this.scene.settings.data?.modo || 'normal';
    this.selecao   = { genero: 'masc', cabelo: 0, roupa: 0 };
    this.nome      = '';
    this.nomeAtivo = false;

    // ── Fundo ──────────────────────────────────────────────────
    this.add.image(400, 225, 'menuBg').setDisplaySize(800, 450).setDepth(-2);
    this.add.rectangle(400, 225, 800, 450, 0x000000, 0.70);

    // ── Título ─────────────────────────────────────────────────
    this.add.text(400, 26, 'CRIE SEU PERSONAGEM', {
      fontSize: '19px', color: '#3dff6e', letterSpacing: 4
    }).setOrigin(0.5);

    // ── Step indicator: dois nós + linha ───────────────────────
    const stepG = this.add.graphics();
    stepG.lineStyle(1, 0x2a2a4a, 1);
    stepG.lineBetween(372, 50, 428, 50);
    // Nó 1 (ativo)
    stepG.fillStyle(0x3dff6e, 1);
    stepG.fillCircle(365, 50, 6);
    // Nó 2 (inativo)
    stepG.lineStyle(1.5, 0x444466, 1);
    stepG.strokeCircle(435, 50, 6);
    // Sem labels de texto — evita sobreposição com o painel de opções

    // ── Painel do preview com grid sutil ───────────────────────
    const panelG = this.add.graphics();
    panelG.fillStyle(0x0a0a1c, 0.75);
    panelG.fillRoundedRect(22, 70, 296, 266, 4);
    panelG.lineStyle(0.5, 0x1a1a2e, 0.5);
    for (let gx = 22; gx < 318; gx += 20) panelG.lineBetween(gx, 70, gx, 336);
    for (let gy = 70; gy < 337; gy += 20) panelG.lineBetween(22, gy, 318, gy);
    panelG.lineStyle(1, 0x2a2a4a, 0.6);
    panelG.strokeRoundedRect(22, 70, 296, 266, 4);

    // ── Prévia (esquerda) ──────────────────────────────────────
    this.add.text(175, 82, 'P  R  É  V  I  A', {
      fontSize: '9px', color: '#888899'
    }).setOrigin(0.5);

    this.previewGeneroTexto = this.add.text(175, 100, 'MASC', {
      fontSize: '11px', color: '#aaaacc', letterSpacing: 2
    }).setOrigin(0.5);

    this.previewCabeca  = this.add.circle(175, 140, 36, CABELOS[0].cor);
    this.previewCorpo   = this.add.rectangle(175, 228, 60, 110, ROUPAS[0].cor);
    this.previewBracoE  = this.add.rectangle(138, 218, 18, 70,  ROUPAS[0].cor);
    this.previewBracoD  = this.add.rectangle(212, 218, 18, 70,  ROUPAS[0].cor);
    this.previewPernaE  = this.add.rectangle(160, 302, 24, 50, 0x333355);
    this.previewPernaD  = this.add.rectangle(190, 302, 24, 50, 0x333355);

    // ── Idle animation: respiração no corpo, movimento independente na cabeça
    this.tweens.add({
      targets: [this.previewCorpo, this.previewBracoE, this.previewBracoD,
                this.previewPernaE, this.previewPernaD],
      y: '+=4',
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });
    this.tweens.add({
      targets: this.previewCabeca,
      y: '+=3',
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut'
    });

    this.textoNomePreview = this.add.text(175, 338, NOME_PADRAO, {
      fontSize: '12px', color: '#aaaacc'
    }).setOrigin(0.5);

    // ── Opções (direita) ───────────────────────────────────────
    const px  = 350;   // margem esquerda do painel
    const pw  = 420;   // largura útil do painel
    const pcx = px + pw / 2; // centro horizontal

    // Layout calculado por alturas reais (fonte 11px ≈ 13px de altura renderizada):
    //   label_bottom = label_y + 13
    //   criarBotaoOpcao(x, y) → topo do botão em y, fundo em y+28
    //   criarSwatchCor(x, y)  → círculo centrado em y, raio 16 → topo em y-16

    // ── Gênero ─────────────────────────────────────────────────
    //   label_y=66 → base=79 | btn_top=83 → gap=4px ✓ | btn_bottom=111
    this.add.text(px, 66, 'GÊNERO', { fontSize: '11px', color: '#888899', letterSpacing: 3 });
    this.btnMasc = this.criarBotaoOpcao(px,       83, 'MASCULINO', () => this.setGenero('masc'));
    this.btnFem  = this.criarBotaoOpcao(px + 150, 83, 'FEMININO',  () => this.setGenero('fem'));
    this.add.rectangle(pcx, 120, pw, 1, 0x222244);

    // ── Cabelo ─────────────────────────────────────────────────
    //   label_y=130 → base=143 | swatch_top=150 → gap=7px ✓ | swatch_label_bottom=198
    this.add.text(px, 130, 'COR DO CABELO', { fontSize: '11px', color: '#888899', letterSpacing: 3 });
    this.btnsCabelo = CABELOS.map((c, i) =>
      this.criarSwatchCor(px + 18 + i * 56, 166, c.cor, c.label, () => this.setCabelo(i))
    );
    this.add.rectangle(pcx, 205, pw, 1, 0x222244);

    // ── Roupa ──────────────────────────────────────────────────
    //   label_y=215 → base=228 | swatch_top=236 → gap=8px ✓ | swatch_label_bottom=283
    this.add.text(px, 215, 'COR DA ROUPA', { fontSize: '11px', color: '#888899', letterSpacing: 3 });
    this.btnsRoupa = ROUPAS.map((r, i) =>
      this.criarSwatchCor(px + 18 + i * 56, 252, r.cor, r.label, () => this.setRoupa(i))
    );
    this.add.rectangle(pcx, 290, pw, 1, 0x222244);

    // ── Nome ───────────────────────────────────────────────────
    //   label_y=299 → base=312 | input_top=311 → encostado (aceitável para campo de texto) ✓
    this.add.text(px, 299, 'NOME  (opcional)', { fontSize: '11px', color: '#888899', letterSpacing: 3 });

    this.caixaNomeBg = this.add.rectangle(px + pw / 2, 326, pw, 30, 0x1e1e3a)
      .setStrokeStyle(1, 0x333355)
      .setInteractive({ useHandCursor: true });

    this.textoNomeInput = this.add.text(px + 10, 326, NOME_PADRAO, {
      fontSize: '13px', color: '#555577'
    }).setOrigin(0, 0.5);

    this.textoCursor = this.add.text(0, 326, '|', {
      fontSize: '13px', color: '#3dff6e'
    }).setOrigin(0, 0.5).setVisible(false);

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
      fontSize: '13px', color: '#8888aa'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    voltar.on('pointerover', () => voltar.setStyle({ color: '#ffffff' }));
    voltar.on('pointerout',  () => voltar.setStyle({ color: '#8888aa' }));
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
    this.textoCursor.setPosition(this.textoNomeInput.x + this.textoNomeInput.width + 2, 326);
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
    this.add.text(x, y + 22, label, { fontSize: '9px', color: '#888899' }).setOrigin(0.5);
    c.on('pointerover', () => c.setScale(1.15));
    c.on('pointerout',  () => c.setScale(1));
    c.on('pointerup',   () => {
      // Pop de escala ao selecionar
      this.tweens.add({ targets: c, scaleX: 1.45, scaleY: 1.45, duration: 80,
        yoyo: true, ease: 'Back.Out' });
      callback();
    });
    c._borda = b;
    return c;
  }

  setGenero(g) { this.selecao.genero = g; this.atualizarSelecaoVisual(); }

  setCabelo(i) {
    this.selecao.cabelo = i;
    this.previewCabeca.setFillStyle(CABELOS[i].cor);
    this.atualizarSwatches(this.btnsCabelo, i);
    // Flash suave na cabeça
    this.tweens.add({ targets: this.previewCabeca, alpha: 0.3, duration: 60,
      yoyo: true, ease: 'Sine.InOut' });
  }

  setRoupa(i) {
    this.selecao.roupa = i;
    const cor = ROUPAS[i].cor;
    this.previewCorpo.setFillStyle(cor);
    this.previewBracoE.setFillStyle(cor);
    this.previewBracoD.setFillStyle(cor);
    this.atualizarSwatches(this.btnsRoupa, i);
    // Flash suave no corpo
    this.tweens.add({ targets: [this.previewCorpo, this.previewBracoE, this.previewBracoD],
      alpha: 0.3, duration: 60, yoyo: true, ease: 'Sine.InOut' });
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
