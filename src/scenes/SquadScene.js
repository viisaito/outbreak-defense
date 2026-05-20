import { Scene } from 'phaser';

const SAVE_KEYS = [
  'outbreak-defense-save-1',
  'outbreak-defense-save-2'
];

// Mapeamento de cores de roupa (mesmo índice de CharacterScene)
const ROUPAS_CORES = [0x27ae60, 0x2980b9, 0xc0392b, 0xe67e22, 0x8e44ad];

// ── Personagens do GDD v0.2 ────────────────────────────────────
const PERSONAGENS = [
  {
    id: 'vini',   nome: 'VINI CARVALHO',   funcao: 'Policial S.P.D.',
    passiva: '+20% de dano com a\narma principal (.45)',
    cor: 0x3399ff, bloqueado: false, bioma: 1, hp: 100, dano: 8
  },
  {
    id: 'helena', nome: 'HELENA MARIA',    funcao: 'Garçonete',
    passiva: 'Cura aliados em raio\n(+15HP a cada 10s)',
    cor: 0xff66aa, bloqueado: false, bioma: 1, hp: 110,  dano: 4
  },
  {
    id: 'daniel', nome: 'DANIEL FERNANDES', funcao: 'Mecânico',
    passiva: 'Arremessa chave de rosca\n+ conserta armas e base',
    cor: 0xffaa33, bloqueado: true, bioma: 2, hp: 95,  dano: 7
  },
  {
    id: 'filipa', nome: 'FILIPA SAITO',    funcao: 'Hacker TI',
    passiva: 'Habilita terminais\ne portas eletrônicas',
    cor: 0x9966ff, bloqueado: true,  bioma: 2, hp: 85,  dano: 4
  },
  {
    id: 'ana',    nome: 'ANA SILVA',       funcao: 'Jornalista',
    passiva: 'Itens extras em\ncômodos bloqueados',
    cor: 0xffcc33, bloqueado: true,  bioma: 2, hp: 85,  dano: 3
  },
  {
    id: 'nadia',  nome: 'DRA. NÁDIA',      funcao: 'Cirurgiã',
    passiva: 'Cada inimigo morto\nrestaura 15% do HP',
    cor: 0x33ffcc, bloqueado: true,  bioma: 3, hp: 90,  dano: 5
  },
  {
    id: 'bruno',  nome: 'BRUNO FREITAS',   funcao: 'Ag. do Metrô SP',
    passiva: 'Finge de morto + Moeda:\n15% bônus de ataque crítico',
    cor: 0x8899ff, bloqueado: true,  bioma: 3, hp: 90,  dano: 6
  },
  {
    id: 'marco',  nome: 'MARCO VÉIO',      funcao: 'Ex-combatente',
    passiva: 'Redução de 15% do\ndano recebido (tank)',
    cor: 0xff6633, bloqueado: true,  bioma: 4, hp: 140, dano: 9
  }
];

// Grid 3×3 (posição 0 = player, 1-8 = NPCs)
const COLS   = [140, 400, 660];
const ROWS   = [118, 240, 362];
const CARD_W = 175;
const CARD_H = 92;
const AV_R   = 16; // raio do avatar

const MAX_SELECAO = 3; // max de NPCs selecionáveis (player é fixo)

// ── Slides narrativos ──────────────────────────────────────────
const NARRATIVA = [
  {
    tag:   'DIA 0 — O BAR',
    texto: 'Enquanto a cidade desmorona lá fora\ne as ruas se enchem de gritos,\nvocê encontra abrigo num bar no centro.\n\nVocê não estava sozinho.'
  },
  {
    tag:   'OS SOBREVIVENTES',
    texto: 'Cada um chegou por um motivo diferente.\nNenhum escolheu estar aqui.\n\nMas agora a escolha é sua, \nquem vai ao seu lado?'
  }
];

// ── Tooltips do tutorial ───────────────────────────────────────
const TOOLTIPS = [
  'Estes são os sobreviventes encontrados\nno bar, cada um com habilidades únicas.',
  'Os aliados bloqueados serão desbloqueados\nconforme você avança pelos biomas.',
  'Passe o mouse sobre os personagens para\nver os atributos. Selecione até 2 aliados \nno primeiro nível.'
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

    // Seleção inicial: todos os NPCs desbloqueados pré-selecionados
    this.selecionados    = new Set(PERSONAGENS.filter(p => !p.bloqueado).map(p => p.id));
    this.fase            = 'narrativa';
    this.idxNarrativa    = 0;
    this.idxTooltip      = 0;
    this.bloqueandoInput = false;

    // Fundo
    this.add.rectangle(400, 225, 800, 450, 0x0d0d1a);

    // Constrói camadas
    this._criarGrid();
    this._criarHoverTooltip();
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
  //  HOVER TOOLTIP (stats do personagem)
  // ═══════════════════════════════════════════════════════════

  _criarHoverTooltip() {
    const d = 20; // depth alto para ficar sobre tudo
    this._hvBg     = this.add.rectangle(0, 0, 178, 128, 0x060c14)
      .setStrokeStyle(1, 0x3dff6e).setDepth(d).setVisible(false);
    this._hvNome   = this.add.text(0, 0, '', {
      fontSize: '12px', color: '#3dff6e', fontStyle: 'bold', letterSpacing: 1
    }).setOrigin(0.5).setDepth(d + 1).setVisible(false);
    this._hvFuncao = this.add.text(0, 0, '', {
      fontSize: '10px', color: '#7788aa'
    }).setOrigin(0.5).setDepth(d + 1).setVisible(false);
    this._hvSep    = this.add.rectangle(0, 0, 150, 1, 0x1a2a3a)
      .setDepth(d + 1).setVisible(false);
    this._hvHp     = this.add.text(0, 0, '', {
      fontSize: '12px', color: '#ff6666'
    }).setOrigin(0.5).setDepth(d + 1).setVisible(false);
    this._hvDano   = this.add.text(0, 0, '', {
      fontSize: '12px', color: '#ffaa44'
    }).setOrigin(0.5).setDepth(d + 1).setVisible(false);
    this._hvPassiva = this.add.text(0, 0, '', {
      fontSize: '10px', color: '#aaaacc', align: 'center',
      lineSpacing: 4, wordWrap: { width: 158 }
    }).setOrigin(0.5).setDepth(d + 1).setVisible(false);

    this._hvObjs = [this._hvBg, this._hvNome, this._hvFuncao,
                    this._hvSep, this._hvHp, this._hvDano, this._hvPassiva];
  }

  _mostrarHoverTooltip(p, cx, cy) {
    const TW = 178, TH = 128;
    // Posiciona à direita do card; se não couber, vai à esquerda
    let tx = cx + CARD_W / 2 + 6 + TW / 2;
    if (tx + TW / 2 > 796) tx = cx - CARD_W / 2 - 6 - TW / 2;
    // Clamp vertical
    let ty = cy;
    if (ty - TH / 2 < 4)   ty = TH / 2 + 4;
    if (ty + TH / 2 > 446) ty = 446 - TH / 2;

    this._hvBg.setPosition(tx, ty);
    this._hvNome.setPosition(tx, ty - 48).setText(p.nome);
    this._hvFuncao.setPosition(tx, ty - 34).setText(p.funcao || '');
    this._hvSep.setPosition(tx, ty - 22);
    this._hvHp.setPosition(tx, ty - 10).setText('❤  HP: ' + (p.hp ?? '—'));
    this._hvDano.setPosition(tx, ty + 6).setText('⚔  Dano: ' + (p.dano ?? '—'));
    this._hvPassiva.setPosition(tx, ty + 34).setText(p.passiva || '');

    this._hvObjs.forEach(o => o.setVisible(true));
  }

  _esconderHoverTooltip() {
    this._hvObjs?.forEach(o => o.setVisible(false));
  }

  // ═══════════════════════════════════════════════════════════
  //  GRID DE PERSONAGENS
  // ═══════════════════════════════════════════════════════════

  _criarGrid() {
    this._gridObjs = [];
    this._cardRefs = [];

    // Cabeçalho
    this._gridTitulo = this.add.text(400, 22, 'ESCOLHA SEU ESQUADRÃO', {
      fontSize: '16px', color: '#3dff6e', letterSpacing: 3
    }).setOrigin(0.5).setDepth(2).setAlpha(0);

    this._gridSub = this.add.text(400, 42, 'BIOMA 01  —  BAR CENTRAL  —  SÃO PAULO', {
      fontSize: '10px', color: '#333344', letterSpacing: 2
    }).setOrigin(0.5).setDepth(2).setAlpha(0);

    this._gridContador = this.add.text(400, 58, '', {
      fontSize: '11px', color: '#555577'
    }).setOrigin(0.5).setDepth(2).setAlpha(0);

    this._gridObjs.push(this._gridTitulo, this._gridSub, this._gridContador);

    // Personagem criado pelo jogador (posição 0 do grid)
    const roupaCor = ROUPAS_CORES[this.dadosPersonagem.roupaIndex] ?? 0x3dff6e;
    const jogador = {
      id:       'player',
      nome:     this.dadosPersonagem.nome,
      funcao:   'Sobrevivente',
      passiva:  'Boost de dano em raio\npara aliados próximos.\nTem habilidade de equipar diversas armas.',
      cor:      roupaCor,
      bloqueado: false,
      bioma:    1,
      hp:       100,
      dano:     6,
      isPlayer: true
    };

    // Grid 3×3: slot 0 = jogador, slots 1-8 = NPCs
    const allChars = [jogador, ...PERSONAGENS];
    allChars.forEach((p, i) => {
      const cx = COLS[i % 3];
      const cy = ROWS[Math.floor(i / 3)];
      this._criarCard(p, cx, cy);
    });

    this._atualizarContador();
  }

  _criarCard(p, cx, cy) {
    const bl       = p.bloqueado;
    const isPlayer = !!p.isPlayer;

    const corFundo = isPlayer ? 0x0a1a0a : (bl ? 0x111118 : 0x101d30);
    const corBorda = isPlayer ? 0x3dff6e : (bl ? 0x252530 : p.cor);
    const bordaW   = (isPlayer || !bl) ? 2 : 1;

    // Fundo do card
    const card = this.add.rectangle(cx, cy, CARD_W, CARD_H, corFundo)
      .setStrokeStyle(bordaW, corBorda)
      .setDepth(2).setAlpha(0);
    this._gridObjs.push(card);

    // Avatar
    const avatar = this.add.circle(cx, cy - 20, AV_R, bl ? 0x222230 : p.cor)
      .setDepth(3).setAlpha(0);
    this._gridObjs.push(avatar);

    // Tag superior
    if (isPlayer) {
      const youTag = this.add.text(cx, cy - 39, 'VOCÊ', {
        fontSize: '7px', color: '#3dff6e', letterSpacing: 3
      }).setOrigin(0.5).setDepth(4).setAlpha(0);
      this._gridObjs.push(youTag);
    } else if (bl) {
      const lock = this.add.text(cx, cy - 20, '🔒', {
        fontSize: '12px', color: '#333344'
      }).setOrigin(0.5).setDepth(4).setAlpha(0);
      this._gridObjs.push(lock);
    } else {
      const tag = this.add.text(cx, cy - 39, 'DISPONÍVEL', {
        fontSize: '7px', color: '#3dff6e', letterSpacing: 1
      }).setOrigin(0.5).setDepth(4).setAlpha(0);
      this._gridObjs.push(tag);
    }

    // Checkmark (NPCs desbloqueados)
    let check = null;
    if (!bl && !isPlayer) {
      check = this.add.text(cx + CARD_W / 2 - 10, cy - CARD_H / 2 + 8, '✔', {
        fontSize: '11px', color: '#3dff6e'
      }).setOrigin(0.5).setDepth(4).setAlpha(0).setVisible(false);
      this._gridObjs.push(check);
    }

    // Nome
    const primeiroNome = p.nome.split(' ')[0];
    const nomeObj = this.add.text(cx, cy + 4, primeiroNome, {
      fontSize: '13px',
      color:    bl ? '#2a2a3a' : '#ffffff',
      fontStyle: bl ? 'normal' : 'bold'
    }).setOrigin(0.5).setDepth(3).setAlpha(0);
    this._gridObjs.push(nomeObj);

    // Função
    const funcaoObj = this.add.text(cx, cy + 20, bl ? 'Bioma ' + p.bioma : p.funcao, {
      fontSize: '8px',
      color:    bl ? '#222232' : (isPlayer ? '#3dff6e' : '#7788aa')
    }).setOrigin(0.5).setDepth(3).setAlpha(0);
    this._gridObjs.push(funcaoObj);

    // Interação — hover tooltip para todos; click só para NPCs desbloqueados
    card.setInteractive({ useHandCursor: !bl && !isPlayer });

    card.on('pointerover', () => {
      if (this.fase !== 'livre') return;
      if (!bl && !isPlayer) card.setFillStyle(0x1a2d4a);
      this._mostrarHoverTooltip(p, cx, cy);
    });
    card.on('pointerout', () => {
      if (this.fase !== 'livre') return;
      if (!bl && !isPlayer) {
        const ativo = this.selecionados.has(p.id);
        card.setFillStyle(ativo ? 0x0d1e30 : corFundo);
      }
      this._esconderHoverTooltip();
    });

    if (!bl && !isPlayer) {
      card.on('pointerdown', () => {
        if (this.fase !== 'livre') return;
        this._toggleSelecionado(p.id, card, check, avatar, p.cor);
      });
    }

    this._cardRefs.push({ card, avatar, check, p, corFundo, isPlayer });
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
      if (ref.p.bloqueado || ref.isPlayer) return;
      const ativo = this.selecionados.has(ref.p.id);
      ref.card.setFillStyle(ativo ? 0x0d1e30 : ref.corFundo);
      ref.card.setStrokeStyle(ativo ? 2 : 1, ref.p.cor);
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