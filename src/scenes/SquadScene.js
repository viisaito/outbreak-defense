import { Scene } from 'phaser';

const SAVE_KEYS = [
  'outbreak-defense-save-1',
  'outbreak-defense-save-2'
];

// ── Personagens do GDD v0.2 ────────────────────────────────────
// Bioma 01: Vini, Helena e Daniel desbloqueados por padrão
const PERSONAGENS = [
  {
    id: 'vini',
    nome: 'VINI CARVALHO',
    funcao: 'Policial S.P.D.',
    passiva: '+X% dano com\narmas de fogo',
    cor: 0x3399ff,
    bloqueado: false,
    bioma: 1
  },
  {
    id: 'helena',
    nome: 'HELENA MARIA',
    funcao: 'Garçonete',
    passiva: 'Cura aliados\nem raio',
    cor: 0xff66aa,
    bloqueado: false,
    bioma: 1
  },
  {
    id: 'daniel',
    nome: 'DANIEL FERNANDES',
    funcao: 'Encanador',
    passiva: 'Arremesso\nde chave de rosca',
    cor: 0xffaa33,
    bloqueado: false,
    bioma: 1
  },
  {
    id: 'filipa',
    nome: 'FILIPA SAITO',
    funcao: 'Univ. de TI',
    passiva: 'Habilita terminais\ne portas',
    cor: 0x9966ff,
    bloqueado: true,
    bioma: 2
  },
  {
    id: 'ana',
    nome: 'ANA SILVA',
    funcao: 'Jornalista',
    passiva: 'Itens extras\nem cômodos',
    cor: 0xffcc33,
    bloqueado: true,
    bioma: 2
  },
  {
    id: 'nadia',
    nome: 'DRA. NÁDIA',
    funcao: 'Cirurgiã',
    passiva: 'Cura à\ndistância',
    cor: 0x33ffcc,
    bloqueado: true,
    bioma: 3
  },
  {
    id: 'bruno',
    nome: 'BRUNO FREITAS',
    funcao: 'Metrô SP',
    passiva: '15% bônus\nde ataque',
    cor: 0x8899ff,
    bloqueado: true,
    bioma: 3
  },
  {
    id: 'marco',
    nome: 'MARCO VEIO',
    funcao: 'Ex-combatente',
    passiva: 'Redução de\ndano recebido',
    cor: 0xff6633,
    bloqueado: true,
    bioma: 4
  }
];

// Grid 4x2
const COLS = [105, 300, 500, 695];
const ROWS = [168, 308];

const MAX_SELECAO = 3;

// ── Slides narrativos ──────────────────────────────────────────
const NARRATIVA = [
  {
    tag:   'MISSÃO 01',
    texto: 'Você se refugiou num bar\nabandonado no centro de SP.\n\nOs infectados cercam\no quarteirão.'
  },
  {
    tag:   'REFORÇO',
    texto: 'Você transmite um sinal\nde socorro pelo rádio.\n\nSobreviventes respondem\nao chamado...'
  }
];

// ── Tooltips do tutorial ───────────────────────────────────────
const TOOLTIPS = [
  'Estes são os sobreviventes que podem\ndefender a posição com você.',
  'Os aliados bloqueados serão desbloqueados\nconforme você avança pelos biomas.',
  'Selecione até 3 aliados disponíveis\ne clique em COMEÇAR para entrar na fase.'
];

export class SquadScene extends Scene {
  constructor() { super('SquadScene'); }

  create() {
    // Dados recebidos da CharacterScene
    const d              = this.scene.settings.data || {};
    this.slotAlvo        = d.slot        || null;
    this.modoJogo        = d.modo        || 'normal';
    this.dadosPersonagem = {
      nome:        d.nome        || 'Sobrevivente',
      genero:      d.genero      || 'masc',
      cabeloIndex: d.cabeloIndex ?? 0,
      roupaIndex:  d.roupaIndex  ?? 0
    };

    // Seleção inicial: todos os desbloqueados pré-selecionados
    this.selecionados    = new Set(PERSONAGENS.filter(p => !p.bloqueado).map(p => p.id));
    this.fase            = 'narrativa';
    this.idxNarrativa    = 0;
    this.idxTooltip      = 0;
    this.bloqueandoInput = false;

    // Fundo
    this.add.rectangle(400, 225, 800, 450, 0x0d0d1a);

    // Constrói camadas
    this._criarGrid();
    this._criarNarrativa();
    this._criarTooltipUI();
    this._criarRodape();

    // Exibe primeiro slide
    this._mostrarNarrativa(0);

    // Clique global delegado por fase
    this.input.on('pointerdown', () => this._avancar());
  }

  // ═══════════════════════════════════════════════════════════
  //  NARRATIVA
  // ═══════════════════════════════════════════════════════════

  _criarNarrativa() {
    this._narrObjs = [];

    const ov = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.88).setDepth(5);
    this._narrObjs.push(ov);

    this._narrTag = this.add.text(400, 130, '', {
      fontSize: '11px', color: '#3dff6e', letterSpacing: 4
    }).setOrigin(0.5).setDepth(6);
    this._narrObjs.push(this._narrTag);

    this._narrTexto = this.add.text(400, 215, '', {
      fontSize: '17px', color: '#ccccdd', align: 'center', lineSpacing: 9
    }).setOrigin(0.5).setDepth(6);
    this._narrObjs.push(this._narrTexto);

    this._narrAvanco = this.add.text(400, 368, 'clique para continuar', {
      fontSize: '12px', color: '#555577'
    }).setOrigin(0.5).setDepth(6);
    this._narrObjs.push(this._narrAvanco);

    this.tweens.add({ targets: this._narrAvanco, alpha: 0.25, duration: 800, yoyo: true, repeat: -1 });
  }

  _mostrarNarrativa(i) {
    const slide  = NARRATIVA[i];
    const ultimo = (i === NARRATIVA.length - 1);
    this._narrTag.setText(slide.tag);
    this._narrTexto.setText(slide.texto);
    this._narrAvanco.setText(ultimo ? 'clique para ver os aliados' : 'clique para continuar');
  }

  _fecharNarrativa(callback) {
    this._narrObjs.forEach(o => this.tweens.add({ targets: o, alpha: 0, duration: 350 }));
    this.time.delayedCall(380, () => {
      this._narrObjs.forEach(o => o.setVisible(false));
      if (callback) callback();
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  GRID DE PERSONAGENS
  // ═══════════════════════════════════════════════════════════

  _criarGrid() {
    this._gridObjs  = [];
    this._cardRefs  = [];

    // Cabeçalho do grid
    this._gridTitulo = this.add.text(400, 22, 'ESCOLHA SEU ESQUADRÃO', {
      fontSize: '16px', color: '#3dff6e', letterSpacing: 3
    }).setOrigin(0.5).setDepth(2).setAlpha(0);

    this._gridSub = this.add.text(400, 42, 'BIOMA 01  —  ESTAÇÃO DE METRÔ', {
      fontSize: '10px', color: '#333344', letterSpacing: 2
    }).setOrigin(0.5).setDepth(2).setAlpha(0);

    this._gridContador = this.add.text(400, 58, '', {
      fontSize: '11px', color: '#555577'
    }).setOrigin(0.5).setDepth(2).setAlpha(0);

    this._gridObjs.push(this._gridTitulo, this._gridSub, this._gridContador);

    // Cards
    PERSONAGENS.forEach((p, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const cx  = COLS[col];
      const cy  = ROWS[row];
      this._criarCard(p, cx, cy);
    });

    this._atualizarContador();
  }

  _criarCard(p, cx, cy) {
    const bl       = p.bloqueado;
    const corFundo = bl ? 0x111118 : 0x101d30;
    const corBorda = bl ? 0x252530 : p.cor;

    // Fundo do card
    const card = this.add.rectangle(cx, cy, 170, 118, corFundo)
      .setStrokeStyle(bl ? 1 : 2, corBorda)
      .setDepth(2).setAlpha(0);
    this._gridObjs.push(card);

    // Avatar
    const avatar = this.add.circle(cx, cy - 26, 20, bl ? 0x222230 : p.cor)
      .setDepth(3).setAlpha(0);
    this._gridObjs.push(avatar);

    // Checkmark de seleção (só para desbloqueados)
    let check = null;
    if (!bl) {
      check = this.add.text(cx + 72, cy - 48, '✔', {
        fontSize: '11px', color: '#3dff6e'
      }).setOrigin(0.5).setDepth(4).setAlpha(0).setVisible(false);
      this._gridObjs.push(check);
    }

    // Cadeado ou tag DISPONÍVEL
    if (bl) {
      const lock = this.add.text(cx, cy - 26, '🔒', {
        fontSize: '13px', color: '#333344'
      }).setOrigin(0.5).setDepth(4).setAlpha(0);
      this._gridObjs.push(lock);
    } else {
      const tag = this.add.text(cx, cy - 46, 'DISPONÍVEL', {
        fontSize: '7px', color: '#3dff6e', letterSpacing: 1
      }).setOrigin(0.5).setDepth(4).setAlpha(0);
      this._gridObjs.push(tag);
    }

    // Nome (só primeiro)
    const primeiroNome = p.nome.split(' ')[0];
    const nomeObj = this.add.text(cx, cy + 4, primeiroNome, {
      fontSize: bl ? '11px' : '13px',
      color: bl ? '#2a2a3a' : '#ffffff',
      fontStyle: bl ? 'normal' : 'bold'
    }).setOrigin(0.5).setDepth(3).setAlpha(0);
    this._gridObjs.push(nomeObj);

    // Função
    const funcaoObj = this.add.text(cx, cy + 20, bl ? 'Bioma ' + p.bioma : p.funcao, {
      fontSize: '8px', color: bl ? '#222232' : '#7788aa'
    }).setOrigin(0.5).setDepth(3).setAlpha(0);
    this._gridObjs.push(funcaoObj);

    // Passiva
    const passivaObj = this.add.text(cx, cy + 42, p.passiva, {
      fontSize: '8px', color: bl ? '#1e1e2a' : '#555566',
      align: 'center', lineSpacing: 2
    }).setOrigin(0.5).setDepth(3).setAlpha(0);
    this._gridObjs.push(passivaObj);

    // Interação apenas para desbloqueados
    if (!bl) {
      card.setInteractive({ useHandCursor: true });
      card.on('pointerover', () => {
        if (this.fase !== 'livre') return;
        card.setFillStyle(0x1a2d4a);
      });
      card.on('pointerout', () => {
        if (this.fase !== 'livre') return;
        const ativo = this.selecionados.has(p.id);
        card.setFillStyle(ativo ? 0x0d1e30 : corFundo);
      });
      card.on('pointerdown', () => {
        if (this.fase !== 'livre') return;
        this._toggleSelecionado(p.id, card, check, avatar, p.cor);
      });
    }

    this._cardRefs.push({ card, avatar, check, p, corFundo });
  }

  _toggleSelecionado(id, card, check, avatar, cor) {
    if (this.selecionados.has(id)) {
      if (this.selecionados.size > 1) {
        this.selecionados.delete(id);
      }
    } else {
      if (this.selecionados.size < MAX_SELECAO) {
        this.selecionados.add(id);
      }
    }
    this._atualizarVisuaisCards();
    this._atualizarContador();
  }

  _atualizarVisuaisCards() {
    this._cardRefs.forEach(ref => {
      if (ref.p.bloqueado) return;
      const ativo = this.selecionados.has(ref.p.id);
      ref.card.setFillStyle(ativo ? 0x0d1e30 : ref.corFundo);
      ref.card.setStrokeStyle(ativo ? 2 : 1, ativo ? ref.p.cor : ref.p.cor);
      ref.avatar.setAlpha(ativo ? 1 : 0.3);
      if (ref.check) ref.check.setVisible(ativo);
    });
  }

  _atualizarContador() {
    const n   = this.selecionados.size;
    const cor = n === MAX_SELECAO ? '#3dff6e' : '#ffaa44';
    this._gridContador?.setText(n + ' / ' + MAX_SELECAO + ' aliados selecionados')
      .setStyle({ color: cor });
  }

  _revelarGrid() {
    this._gridObjs.forEach((o, i) => {
      this.tweens.add({ targets: o, alpha: 1, duration: 400, delay: i * 6 });
    });
    // Revela checkmarks dos selecionados após o fade
    this.time.delayedCall(600, () => this._atualizarVisuaisCards());
  }

  // ═══════════════════════════════════════════════════════════
  //  TOOLTIP TUTORIAL
  // ═══════════════════════════════════════════════════════════

  _criarTooltipUI() {
    this._tooltipObjs = [];

    this._ttOverlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.5)
      .setDepth(7).setAlpha(0).setVisible(false);
    this._tooltipObjs.push(this._ttOverlay);

    this._ttBg = this.add.rectangle(400, 398, 480, 72, 0x0a1520)
      .setStrokeStyle(2, 0x3dff6e)
      .setDepth(10).setAlpha(0).setVisible(false);
    this._tooltipObjs.push(this._ttBg);

    this._ttTexto = this.add.text(400, 394, '', {
      fontSize: '13px', color: '#ffffff', align: 'center', lineSpacing: 5
    }).setOrigin(0.5).setDepth(11).setAlpha(0).setVisible(false);
    this._tooltipObjs.push(this._ttTexto);

    this._ttAvanco = this.add.text(400, 430, 'clique para continuar', {
      fontSize: '10px', color: '#3dff6e'
    }).setOrigin(0.5).setDepth(11).setAlpha(0).setVisible(false);
    this._tooltipObjs.push(this._ttAvanco);

    this.tweens.add({ targets: this._ttAvanco, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });
  }

  _mostrarTooltip(i) {
    const ultimo = (i === TOOLTIPS.length - 1);
    this._ttTexto.setText(TOOLTIPS[i]);
    this._ttAvanco.setText(ultimo ? 'clique para selecionar os aliados' : 'clique para continuar');
  }

  _revelarTooltips() {
    this._tooltipObjs.forEach(o => o.setVisible(true));
    this._tooltipObjs.forEach(o => this.tweens.add({ targets: o, alpha: 1, duration: 350 }));
    this._mostrarTooltip(0);
  }

  _fecharTooltips(callback) {
    this._tooltipObjs.forEach(o => this.tweens.add({ targets: o, alpha: 0, duration: 250 }));
    this.time.delayedCall(280, () => {
      this._tooltipObjs.forEach(o => o.setVisible(false));
      if (callback) callback();
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  RODAPÉ COM BOTÃO COMEÇAR
  // ═══════════════════════════════════════════════════════════

  _criarRodape() {
    this._btnComecar = this.add.rectangle(560, 430, 200, 36, 0x1a4a2a)
      .setDepth(2).setAlpha(0).setInteractive({ useHandCursor: true });

    this._btnComecarTxt = this.add.text(560, 430, 'COMEÇAR', {
      fontSize: '15px', color: '#3dff6e', letterSpacing: 5
    }).setOrigin(0.5).setDepth(3).setAlpha(0);

    this._btnComecar.on('pointerover',  () => this._btnComecar.setFillStyle(0x27ae60));
    this._btnComecar.on('pointerout',   () => this._btnComecar.setFillStyle(0x1a4a2a));
    this._btnComecar.on('pointerdown',  () => this._btnComecar.setFillStyle(0x145a32));
    this._btnComecar.on('pointerup',    () => {
      if (this.fase === 'livre' && this.selecionados.size > 0) this._comecar();
    });

    const voltar = this.add.text(60, 430, '← VOLTAR', {
      fontSize: '12px', color: '#555577'
    }).setOrigin(0.5).setDepth(3).setAlpha(0).setInteractive({ useHandCursor: true });

    voltar.on('pointerover', () => voltar.setStyle({ color: '#aaaacc' }));
    voltar.on('pointerout',  () => voltar.setStyle({ color: '#555577' }));
    voltar.on('pointerup',   () => {
      if (this.fase === 'livre') {
        this.scene.start('CharacterScene', { slot: this.slotAlvo, modo: this.modoJogo });
      }
    });

    this._rodapeObjs = [this._btnComecar, this._btnComecarTxt, voltar];
  }

  _revelarRodape() {
    this._rodapeObjs.forEach(o => this.tweens.add({ targets: o, alpha: 1, duration: 400 }));
  }

  // ═══════════════════════════════════════════════════════════
  //  FLUXO PRINCIPAL
  // ═══════════════════════════════════════════════════════════

  _avancar() {
    if (this.bloqueandoInput) return;

    if (this.fase === 'narrativa') {
      this.idxNarrativa++;
      if (this.idxNarrativa >= NARRATIVA.length) {
        this.bloqueandoInput = true;
        this._fecharNarrativa(() => {
          this._revelarGrid();
          this.time.delayedCall(500, () => {
            this.fase = 'tutorial';
            this._revelarTooltips();
            this.bloqueandoInput = false;
          });
        });
      } else {
        this._mostrarNarrativa(this.idxNarrativa);
      }

    } else if (this.fase === 'tutorial') {
      this.idxTooltip++;
      if (this.idxTooltip >= TOOLTIPS.length) {
        this.bloqueandoInput = true;
        this._fecharTooltips(() => {
          this.fase = 'livre';
          this._revelarRodape();
          this.bloqueandoInput = false;
        });
      } else {
        this._mostrarTooltip(this.idxTooltip);
      }
    }
    // fase 'livre': interação feita pelos cards e pelo botão COMEÇAR
  }

  // ═══════════════════════════════════════════════════════════
  //  SALVAR E INICIAR
  // ═══════════════════════════════════════════════════════════

  _comecar() {
    this.bloqueandoInput = true;
    const aliados = Array.from(this.selecionados);

    let slot = this.slotAlvo;
    if (!slot) {
      slot = SAVE_KEYS.findIndex(k => !localStorage.getItem(k)) + 1;
      if (slot === 0) slot = 1;
    }

    localStorage.setItem(SAVE_KEYS[slot - 1], JSON.stringify({
      ...this.dadosPersonagem,
      aliados,
      modo:    this.modoJogo,
      savedAt: new Date().toLocaleDateString('pt-BR', {
                 day: '2-digit', month: '2-digit', year: 'numeric',
                 hour: '2-digit', minute: '2-digit'
               })
    }));

    this.registry.set('modoJogo',   this.modoJogo);
    this.registry.set('aliados',    aliados);
    this.registry.set('personagem', this.dadosPersonagem);

    // Overlay de confirmação
    this.add.rectangle(400, 225, 800, 450, 0x000000, 0.82).setDepth(50);
    this.add.text(400, 185, '✔', { fontSize: '36px', color: '#3dff6e' }).setOrigin(0.5).setDepth(51);
    this.add.text(400, 228, 'PROGRESSO SALVO', { fontSize: '21px', color: '#ffffff', letterSpacing: 4 }).setOrigin(0.5).setDepth(51);
    this.add.text(400, 258, this.dadosPersonagem.nome, { fontSize: '15px', color: '#3dff6e' }).setOrigin(0.5).setDepth(51);
    this.add.text(400, 284, 'Aliados: ' + aliados.map(id => {
      const p = PERSONAGENS.find(p => p.id === id);
      return p ? p.nome.split(' ')[0] : id;
    }).join(', '), { fontSize: '13px', color: '#aaaacc' }).setOrigin(0.5).setDepth(51);
    this.add.text(400, 308, 'Modo ' + (this.modoJogo === 'dificil' ? 'Difícil' : 'Normal'), {
      fontSize: '12px', color: '#888899'
    }).setOrigin(0.5).setDepth(51);

    this.time.delayedCall(2000, () => {
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(360, () => this.scene.start('GameScene'));
    });
  }
}
