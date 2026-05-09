import { Scene } from 'phaser';

// ── Dados dos 8 personagens do GDD v0.2 ──────────────────────────────────────
const PERSONAGENS = [
  {
    id: 'vini',
    nome: 'VINI CARVALHO',
    funcao: 'Policial S.P.D.',
    passiva: '+X% dano com\narmas de fogo',
    cor: 0x3399ff,
    bloqueado: false,
    stats: { dano: 35, cooldown: 0.8, custo: 20 }
  },
  {
    id: 'helena',
    nome: 'HELENA MARIA',
    funcao: 'Garçonete',
    passiva: 'Cura aliados\nem raio',
    cor: 0xff66aa,
    bloqueado: true
  },
  {
    id: 'filipa',
    nome: 'FILIPA SAITO',
    funcao: 'Univ. de TI',
    passiva: 'Habilita terminais\ne portas',
    cor: 0x9966ff,
    bloqueado: true
  },
  {
    id: 'ana',
    nome: 'ANA SILVA',
    funcao: 'Jornalista',
    passiva: 'Itens extras\nem comodos',
    cor: 0xffcc33,
    bloqueado: true
  },
  {
    id: 'daniel',
    nome: 'DANIEL FERNANDES',
    funcao: 'Encanador',
    passiva: 'Arremesso\nde chave de rosca',
    cor: 0xffaa33,
    bloqueado: true
  },
  {
    id: 'nadia',
    nome: 'DRA. NADIA',
    funcao: 'Cirurgia',
    passiva: 'Cura a\ndistancia',
    cor: 0x33ffcc,
    bloqueado: true
  },
  {
    id: 'bruno',
    nome: 'BRUNO FREITAS',
    funcao: 'Metro SP',
    passiva: '15% bonus\nde ataque',
    cor: 0x8899ff,
    bloqueado: true
  },
  {
    id: 'marco',
    nome: 'MARCO VEIO',
    funcao: 'Ex-combatente',
    passiva: 'Reducao de\ndano recebido',
    cor: 0xff6633,
    bloqueado: true
  },
];

// Grid 4x2: centros de cada coluna e linha
const COLS = [105, 300, 500, 695];
const ROWS = [158, 310];

// ── Slides narrativos antes de exibir o grid ─────────────────────────────────
const NARRATIVA = [
  {
    tag: 'MISSAO 01',
    texto: 'Voce esta encurralado na\nEstacao Consolacao.\n\nOs infectados avancam\npela plataforma sul.'
  },
  {
    tag: 'REFORCO',
    texto: 'Voce transmite um sinal\nde socorro.\n\nUm sobrevivente responde\nao chamado...'
  }
];

// ── Tooltips sobre o grid (aparecem um a um, clique para avançar) ─────────────
const TOOLTIPS = [
  'Estes sao os sobreviventes que podem\ndefender a posicao com voce.',
  'Os outros aliados estao bloqueados por ora.\nVoce os desbloqueara conforme\navanca nos biomas.',
  'Vini Carvalho, Policial S.P.D.,\ne o unico disponivel agora.\n\nClique no card dele para comecar.'
];

export class SquadScene extends Scene {
  constructor() { super('SquadScene'); }

  create() {
    this.fase           = 'narrativa'; // 'narrativa' | 'tutorial' | 'livre'
    this.idxNarrativa   = 0;
    this.idxTooltip     = 0;
    this.bloqueandoInput = false;

    // Fundo permanente
    this.add.rectangle(400, 225, 800, 450, 0x0d0d1a);

    // Cria as três camadas (na ordem certa de depth)
    this._criarGrid();          // depth 1 — inicia oculto
    this._criarNarrativa();     // depth 5 — inicia visível
    this._criarTooltipUI();     // depth 9 — inicia oculto

    // Exibe primeiro slide narrativo
    this._mostrarNarrativa(0);

    // Clique global (delegado por fase)
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

    this._narrTexto = this.add.text(400, 210, '', {
      fontSize: '17px', color: '#ccccdd', align: 'center', lineSpacing: 9
    }).setOrigin(0.5).setDepth(6);
    this._narrObjs.push(this._narrTexto);

    this._narrAvanco = this.add.text(400, 370, 'clique para continuar', {
      fontSize: '12px', color: '#555577'
    }).setOrigin(0.5).setDepth(6);
    this._narrObjs.push(this._narrAvanco);

    this.tweens.add({
      targets: this._narrAvanco,
      alpha: 0.25,
      duration: 800,
      yoyo: true,
      repeat: -1
    });
  }

  _mostrarNarrativa(i) {
    const slide = NARRATIVA[i];
    this._narrTag.setText(slide.tag);
    this._narrTexto.setText(slide.texto);

    const ultimo = (i === NARRATIVA.length - 1);
    this._narrAvanco.setText(ultimo ? 'clique para ver os aliados' : 'clique para continuar');
  }

  _fecharNarrativa(callback) {
    this._narrObjs.forEach(o => {
      this.tweens.add({ targets: o, alpha: 0, duration: 350 });
    });
    this.time.delayedCall(380, () => {
      this._narrObjs.forEach(o => o.setVisible(false));
      if (callback) callback();
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  GRID DE PERSONAGENS
  // ═══════════════════════════════════════════════════════════

  _criarGrid() {
    this._gridObjs = [];

    // Cabeçalho
    const titulo = this.add.text(400, 22, 'ESCOLHA SEU ALIADO', {
      fontSize: '16px', color: '#3dff6e', letterSpacing: 3
    }).setOrigin(0.5).setDepth(2).setAlpha(0);

    const sub = this.add.text(400, 42, 'BIOMA 01  —  ESTACAO DE METRO', {
      fontSize: '10px', color: '#333344', letterSpacing: 2
    }).setOrigin(0.5).setDepth(2).setAlpha(0);

    this._gridObjs.push(titulo, sub);

    // Cards
    PERSONAGENS.forEach((p, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const cx  = COLS[col];
      const cy  = ROWS[row];
      this._criarCard(p, cx, cy);
    });
  }

  _criarCard(p, cx, cy) {
    const bl       = p.bloqueado;
    const corFundo = bl ? 0x111118 : 0x101d30;
    const corBorda = bl ? 0x252530 : p.cor;
    const alpha    = bl ? 0.55 : 1;

    // Glow atrás do card desbloqueado
    if (!bl) {
      const glow = this.add.rectangle(cx, cy, 180, 138, p.cor, 0.07)
        .setDepth(1).setAlpha(0);
      this._gridObjs.push(glow);
    }

    // Fundo do card
    const card = this.add.rectangle(cx, cy, 170, 128, corFundo)
      .setStrokeStyle(bl ? 1 : 2, corBorda)
      .setDepth(2).setAlpha(0);
    this._gridObjs.push(card);

    // Avatar (círculo)
    const avatar = this.add.circle(cx, cy - 34, 22, bl ? 0x222230 : p.cor)
      .setDepth(3).setAlpha(0);
    this._gridObjs.push(avatar);

    // Cadeado ou tag "DISPONIVEL"
    if (bl) {
      const lock = this.add.text(cx, cy - 34, '[X]', {
        fontSize: '14px', color: '#333344'
      }).setOrigin(0.5).setDepth(4).setAlpha(0);
      this._gridObjs.push(lock);
    } else {
      const tag = this.add.text(cx, cy - 56, 'DISPONIVEL', {
        fontSize: '8px', color: '#3dff6e', letterSpacing: 2
      }).setOrigin(0.5).setDepth(4).setAlpha(0);
      this._gridObjs.push(tag);
    }

    // Primeiro nome
    const primeiroNome = p.nome.split(' ')[0];
    const nomeObj = this.add.text(cx, cy - 8, primeiroNome, {
      fontSize: bl ? '11px' : '13px',
      color: bl ? '#2a2a3a' : '#ffffff',
      fontStyle: bl ? 'normal' : 'bold'
    }).setOrigin(0.5).setDepth(3).setAlpha(0);
    this._gridObjs.push(nomeObj);

    // Função
    const funcaoObj = this.add.text(cx, cy + 12, p.funcao, {
      fontSize: '9px', color: bl ? '#222232' : '#7788aa'
    }).setOrigin(0.5).setDepth(3).setAlpha(0);
    this._gridObjs.push(funcaoObj);

    // Passiva
    const passivaObj = this.add.text(cx, cy + 38, p.passiva, {
      fontSize: '8px', color: bl ? '#1e1e2a' : '#555566',
      align: 'center', lineSpacing: 2
    }).setOrigin(0.5).setDepth(3).setAlpha(0);
    this._gridObjs.push(passivaObj);

    // Interacao apenas para o personagem desbloqueado
    if (!bl) {
      card.setInteractive({ useHandCursor: true });
      card.on('pointerover', () => {
        if (this.fase !== 'livre') return;
        card.setFillStyle(0x1a2d4a);
        card.setStrokeStyle(2, p.cor);
        avatar.setScale(1.1);
      });
      card.on('pointerout', () => {
        card.setFillStyle(corFundo);
        card.setStrokeStyle(2, p.cor);
        avatar.setScale(1);
      });
      card.on('pointerdown', () => {
        if (this.fase !== 'livre') return;
        this._selecionarPersonagem(p);
      });
    }
  }

  _revelarGrid() {
    this._gridObjs.forEach((o, i) => {
      this.tweens.add({
        targets: o,
        alpha: 1,
        duration: 400,
        delay: i * 8   // stagger leve
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  TOOLTIP TUTORIAL
  // ═══════════════════════════════════════════════════════════

  _criarTooltipUI() {
    this._tooltipObjs = [];

    // Overlay semi-escuro sobre o grid durante o tutorial
    this._ttOverlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.52)
      .setDepth(7).setAlpha(0).setVisible(false);
    this._tooltipObjs.push(this._ttOverlay);

    // Balao de texto
    this._ttBg = this.add.rectangle(400, 398, 450, 76, 0x0a1520)
      .setStrokeStyle(2, 0x3dff6e)
      .setDepth(10).setAlpha(0).setVisible(false);
    this._tooltipObjs.push(this._ttBg);

    this._ttTexto = this.add.text(400, 395, '', {
      fontSize: '13px', color: '#ffffff', align: 'center', lineSpacing: 5
    }).setOrigin(0.5).setDepth(11).setAlpha(0).setVisible(false);
    this._tooltipObjs.push(this._ttTexto);

    this._ttAvanco = this.add.text(400, 432, 'clique para continuar', {
      fontSize: '10px', color: '#3dff6e'
    }).setOrigin(0.5).setDepth(11).setAlpha(0).setVisible(false);
    this._tooltipObjs.push(this._ttAvanco);

    this.tweens.add({
      targets: this._ttAvanco,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1
    });
  }

  _mostrarTooltip(i) {
    const txt = TOOLTIPS[i];
    this._ttTexto.setText(txt);

    const ultimo = (i === TOOLTIPS.length - 1);
    this._ttAvanco.setText(ultimo ? 'clique em Vini para comecar' : 'clique para continuar');
  }

  _revelarTooltips() {
    this._tooltipObjs.forEach(o => o.setVisible(true));
    this._tooltipObjs.forEach(o => {
      this.tweens.add({ targets: o, alpha: 1, duration: 350 });
    });
    this._mostrarTooltip(0);
  }

  _fecharTooltips(callback) {
    this._tooltipObjs.forEach(o => {
      this.tweens.add({ targets: o, alpha: 0, duration: 250 });
    });
    this.time.delayedCall(280, () => {
      this._tooltipObjs.forEach(o => o.setVisible(false));
      if (callback) callback();
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  FLUXO PRINCIPAL
  // ═══════════════════════════════════════════════════════════

  _avancar() {
    if (this.bloqueandoInput) return;

    if (this.fase === 'narrativa') {
      this.idxNarrativa++;
      if (this.idxNarrativa >= NARRATIVA.length) {
        // Transicao: narrativa → grid + tutorial
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
        // Ultimo tooltip: libera interacao
        this.bloqueandoInput = true;
        this._fecharTooltips(() => {
          this.fase = 'livre';
          this.bloqueandoInput = false;
        });
      } else {
        this._mostrarTooltip(this.idxTooltip);
      }
    }
    // fase 'livre': input tratado pelo card do Vini diretamente
  }

  _selecionarPersonagem(p) {
    this.bloqueandoInput = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(320, () => {
      this.scene.start('GameScene', { personagem: p });
    });
  }
}
