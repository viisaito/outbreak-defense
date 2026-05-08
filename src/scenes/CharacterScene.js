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

const NOME_PADRAO   = 'Sobrevivente';
const LIMITE_NOME   = 16;
const SAVE_KEYS = [
  'outbreak-defense-save-1',
  'outbreak-defense-save-2'
];

export class CharacterScene extends Scene {
  constructor() { super('CharacterScene'); }

  create() {
    this.selecao = { genero: 'masc', cabelo: 0, roupa: 0 };
    this.nome        = '';
    this.nomeAtivo   = false;

    // Slot e modo passados pela StoryScene / LoadScene
    this.slotAlvo      = this.scene.settings.data?.slot || null;
    this.modoJogo      = this.scene.settings.data?.modo || 'normal';

    // ── Fundo ──────────────────────────────────────────────────
    this.add.rectangle(400, 225, 800, 450, 0x12122a);

    // ── Título ─────────────────────────────────────────────────
    this.add.text(400, 28, 'CRIE SEU PERSONAGEM', {
      fontSize: '20px', color: '#3dff6e', letterSpacing: 4
    }).setOrigin(0.5);

    // ── Preview (esquerda) ─────────────────────────────────────
    this.add.text(175, 60, 'PRÉVIA', {
      fontSize: '11px', color: '#555577', letterSpacing: 3
    }).setOrigin(0.5);

    this.previewGeneroTexto = this.add.text(175, 100, 'MASC', {
      fontSize: '11px', color: '#aaaacc', letterSpacing: 2
    }).setOrigin(0.5);

    this.previewCabeca  = this.add.circle(175, 140, 36, CABELOS[0].cor);
    this.previewCorpo   = this.add.rectangle(175, 230, 60, 110, ROUPAS[0].cor);
    this.previewBracoE  = this.add.rectangle(138, 220, 18, 70, ROUPAS[0].cor);
    this.previewBracoD  = this.add.rectangle(212, 220, 18, 70, ROUPAS[0].cor);
    this.add.rectangle(160, 305, 24, 50, 0x333355);
    this.add.rectangle(190, 305, 24, 50, 0x333355);

    // Nome do personagem abaixo da prévia
    this.textoNomePreview = this.add.text(175, 340, NOME_PADRAO, {
      fontSize: '12px', color: '#aaaacc'
    }).setOrigin(0.5);

    // ── Painel de opções (direita) ─────────────────────────────
    const px = 470;

    // Gênero
    this.add.text(px, 58, 'GÊNERO', { fontSize: '12px', color: '#888899', letterSpacing: 3 });
    this.btnMasc = this.criarBotaoOpcao(px + 10,  88, 'MASCULINO', () => this.setGenero('masc'));
    this.btnFem  = this.criarBotaoOpcao(px + 165, 88, 'FEMININO',  () => this.setGenero('fem'));

    // Cabelo
    this.add.text(px, 128, 'COR DO CABELO', { fontSize: '12px', color: '#888899', letterSpacing: 3 });
    this.btnsCabelo = CABELOS.map((c, i) =>
      this.criarSwatchCor(px + 10 + i * 56, 162, c.cor, c.label, () => this.setCabelo(i))
    );

    // Roupa
    this.add.text(px, 200, 'COR DA ROUPA', { fontSize: '12px', color: '#888899', letterSpacing: 3 });
    this.btnRoupa = ROUPAS.map((r, i) =>
      this.criarSwatchCor(px + 10 + i * 56, 234, r.cor, r.label, () => this.setRoupa(i))
    );

    // ── Campo de nome digitável ────────────────────────────────
    this.add.text(px, 268, 'NOME  (opcional)', {
      fontSize: '12px', color: '#888899', letterSpacing: 3
    });

    // Caixa clicável
    this.caixaNomeBg = this.add.rectangle(px + 125, 298, 250, 30, 0x1e1e3a)
      .setStrokeStyle(1, 0x333355)
      .setInteractive({ useHandCursor: true });

    // Texto digitado
    this.textoNomeInput = this.add.text(px + 8, 286, NOME_PADRAO, {
      fontSize: '14px', color: '#555577'
    });

    // Cursor piscante
    this.textoCursor = this.add.text(0, 286, '|', {
      fontSize: '14px', color: '#3dff6e'
    }).setVisible(false);

    this.tweens.add({
      targets: this.textoCursor,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Ativa o campo ao clicar
    this.caixaNomeBg.on('pointerup', () => this.ativarCampoNome());
    this.caixaNomeBg.on('pointerover', () => {
      if (!this.nomeAtivo) this.caixaNomeBg.setStrokeStyle(1, 0x3dff6e);
    });
    this.caixaNomeBg.on('pointerout', () => {
      if (!this.nomeAtivo) this.caixaNomeBg.setStrokeStyle(1, 0x333355);
    });

    // Desativa campo ao clicar fora (em qualquer outro lugar da cena)
    this.input.on('pointerdown', (pointer, objects) => {
      if (this.nomeAtivo && !objects.includes(this.caixaNomeBg)) {
        this.desativarCampoNome();
      }
    });

    // Listener de teclado (sempre escuta, filtra por nomeAtivo)
    this.input.keyboard.on('keydown', (e) => this.onTecla(e));

    // ── Separador ──────────────────────────────────────────────
    this.add.rectangle(400, 338, 680, 1, 0x333355);

    // ── Botão COMEÇAR ──────────────────────────────────────────
    const btnBg = this.add.rectangle(400, 390, 220, 44, 0x1a4a2a)
      .setInteractive({ useHandCursor: true });
    this.add.text(400, 390, 'COMEÇAR', {
      fontSize: '20px', color: '#3dff6e', letterSpacing: 6
    }).setOrigin(0.5);

    btnBg.on('pointerover',  () => btnBg.setFillStyle(0x27ae60));
    btnBg.on('pointerout',   () => btnBg.setFillStyle(0x1a4a2a));
    btnBg.on('pointerdown',  () => btnBg.setFillStyle(0x145a32));
    btnBg.on('pointerup',    () => this.comecar());

    // ── Botão VOLTAR ───────────────────────────────────────────
    const voltar = this.add.text(60, 430, '← VOLTAR', {
      fontSize: '13px', color: '#555577'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    voltar.on('pointerover', () => voltar.setStyle({ color: '#aaaacc' }));
    voltar.on('pointerout',  () => voltar.setStyle({ color: '#555577' }));
    voltar.on('pointerup',   () => this.scene.start('StoryScene'));

    this.atualizarSelecaoVisual();
    this.atualizarSwatches(this.btnsCabelo, 0);
    this.atualizarSwatches(this.btnRoupa,   0);
  }

  // ── Campo de nome ──────────────────────────────────────────
  ativarCampoNome() {
    this.nomeAtivo = true;
    this.caixaNomeBg.setStrokeStyle(1, 0x3dff6e);
    // Se ainda estava no placeholder, limpa para digitar
    if (this.nome === '') {
      this.textoNomeInput.setText('');
    }
    this.textoCursor.setVisible(true);
    this.atualizarCursor();
  }

  desativarCampoNome() {
    this.nomeAtivo = false;
    this.caixaNomeBg.setStrokeStyle(1, 0x333355);
    this.textoCursor.setVisible(false);
    // Se ficou vazio, volta ao placeholder
    if (this.nome.trim() === '') {
      this.textoNomeInput.setText(NOME_PADRAO).setStyle({ color: '#555577' });
    }
  }

  onTecla(e) {
    if (!this.nomeAtivo) return;

    if (e.key === 'Backspace') {
      this.nome = this.nome.slice(0, -1);
    } else if (e.key === 'Enter' || e.key === 'Escape') {
      this.desativarCampoNome();
      return;
    } else if (e.key.length === 1 && this.nome.length < LIMITE_NOME) {
      this.nome += e.key;
    }

    // Atualiza texto e preview
    const exibir = this.nome || '';
    this.textoNomeInput.setText(exibir).setStyle({ color: '#ffffff' });
    this.textoNomePreview.setText(this.nome || NOME_PADRAO);
    this.atualizarCursor();
  }

  atualizarCursor() {
    // Posiciona cursor logo após o texto digitado
    const larguraTexto = this.textoNomeInput.width;
    this.textoCursor.setX(this.textoNomeInput.x + larguraTexto + 2);
  }

  // ── Seleção visual ──────────────────────────────────────────
  criarBotaoOpcao(x, y, label, callback) {
    const bg = this.add.rectangle(x + 60, y + 14, 114, 28, 0x1e1e3a)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(x + 60, y + 14, label, {
      fontSize: '13px', color: '#aaaacc', letterSpacing: 2
    }).setOrigin(0.5);

    bg.on('pointerover', () => { if (!bg._selecionado) bg.setFillStyle(0x2a2a4a); });
    bg.on('pointerout',  () => { if (!bg._selecionado) bg.setFillStyle(0x1e1e3a); });
    bg.on('pointerup',   () => callback());
    bg._txt = txt;
    bg._selecionado = false;
    return bg;
  }

  criarSwatchCor(x, y, cor, label, callback) {
    const circulo = this.add.circle(x, y, 16, cor).setInteractive({ useHandCursor: true });
    const borda   = this.add.circle(x, y, 20).setStrokeStyle(2, 0x3dff6e).setFillStyle();
    borda.setVisible(false);
    this.add.text(x, y + 28, label, { fontSize: '9px', color: '#666688' }).setOrigin(0.5);

    circulo.on('pointerover', () => circulo.setScale(1.15));
    circulo.on('pointerout',  () => circulo.setScale(1));
    circulo.on('pointerup',   () => callback());
    circulo._borda = borda;
    return circulo;
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
    this.atualizarSwatches(this.btnRoupa, i);
  }

  atualizarSwatches(lista, sel) {
    lista.forEach((s, i) => s._borda.setVisible(i === sel));
  }

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

  // ── Salvar e iniciar ───────────────────────────────────────
  comecar() {
    const nomeDefinitivo = this.nome.trim() || NOME_PADRAO;

    const saveData = {
      nome:        nomeDefinitivo,
      genero:      this.selecao.genero,
      cabeloIndex: this.selecao.cabelo,
      roupaIndex:  this.selecao.roupa,
      savedAt:     new Date().toLocaleDateString('pt-BR', {
                     day: '2-digit', month: '2-digit', year: 'numeric',
                     hour: '2-digit', minute: '2-digit'
                   })
    };

    // Determina o slot: usa o alvo definido, ou o primeiro vazio, ou slot 1
    let slot = this.slotAlvo;
    if (!slot) {
      slot = SAVE_KEYS.findIndex(k => !localStorage.getItem(k)) + 1;
      if (slot === 0) slot = 1; // ambos ocupados → sobrescreve slot 1
    }
    localStorage.setItem(SAVE_KEYS[slot - 1], JSON.stringify(saveData));

    // Salva modo de jogo no registry para GameScene usar
    this.registry.set('modoJogo', this.modoJogo);

    // Salva no registry para outras cenas usarem durante a sessão
    this.registry.set('personagem', {
      nome:   nomeDefinitivo,
      genero: this.selecao.genero,
      cabelo: CABELOS[this.selecao.cabelo],
      roupa:  ROUPAS[this.selecao.roupa]
    });

    this.mostrarAutosave(nomeDefinitivo);
  }

  mostrarAutosave(nome) {
    // Overlay escuro semitransparente
    const overlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.7).setDepth(10);

    // Ícone de check + mensagem
    this.add.text(400, 190, '✔', {
      fontSize: '36px', color: '#3dff6e'
    }).setOrigin(0.5).setDepth(11);

    this.add.text(400, 238, 'AUTOSAVE COMPLETE', {
      fontSize: '22px', color: '#ffffff', letterSpacing: 4
    }).setOrigin(0.5).setDepth(11);

    this.add.text(400, 272, nome, {
      fontSize: '15px', color: '#3dff6e'
    }).setOrigin(0.5).setDepth(11);

    this.add.text(400, 300, 'seu progresso foi salvo automaticamente', {
      fontSize: '12px', color: '#888899'
    }).setOrigin(0.5).setDepth(11);

    // Após 2s faz fade e vai para o jogo
    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, () => {
        this.scene.start('GameScene');
      });
    });
  }
}
