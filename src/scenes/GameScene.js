import { Scene, Math as PhaserMath } from 'phaser';

// ── Config base de cada personagem ──────────────────────────────
const PERSONAGENS_CONFIG = {
  vini:   { nome: 'Vini',   cor: 0x3399ff, custo: 20, dano: 26, hp: 110 },
  helena: { nome: 'Helena', cor: 0xff66aa, custo: 20, dano: 15, hp: 80  },
  daniel: { nome: 'Daniel', cor: 0xffaa33, custo: 20, dano: 20, hp: 95  }
};

const CORES_ROUPAS = [0x27ae60, 0x2980b9, 0xc0392b, 0xe67e22, 0x8e44ad];

// ── Itens da loja com upgrades progressivos ──────────────────────
const LOJA_ITENS = [
  {
    id: 'danoGlobal', label: '+5 Dano Global',
    descricao: 'Todas as torres causam +5 de dano.',
    custos: [20], maxNivel: 1
  },
  {
    id: 'cooldownMult', label: 'Cadência +25%',
    descricao: 'Todas as torres atiram 25% mais rápido.',
    custos: [35], maxNivel: 1
  },
  {
    id: 'baseReforco', label: 'Reforço da Base',
    descricao: '+20 HP máximo na base.',
    custos: [25], maxNivel: 1
  },
  {
    id: 'viniDano', label: 'Vini — Precisão',
    descricao: 'Nível 1: +10% dano\nNível 2: +20% dano\nNível 3: +30% dano',
    custos: [30, 50, 80], maxNivel: 3
  },
  {
    id: 'helenaCura', label: 'Helena — Alcance',
    descricao: 'Nível 1: raio de cura 400→500px\nNível 2: raio 500→600px',
    custos: [30, 50], maxNivel: 2
  },
  {
    id: 'danielKnockback', label: 'Daniel — Chave de Rosca',
    descricao: '10% de chance de knockback por ataque.\nNível 2: 20% | Nível 3: 30%',
    custos: [25, 40, 65], maxNivel: 3
  },
  {
    id: 'avatarHP', label: 'Colete Balístico',
    descricao: '+20 HP máximo no seu avatar.',
    custos: [20], maxNivel: 1
  }
];

// ── Textos do tutorial pré-onda ──────────────────────────────────
const TUTORIAL_PASSOS = [
  { titulo: 'BEM-VINDO AO BAR', texto: 'Esta é a sua base. O lado direito (verde)\né o ponto que você deve defender.\nSe os infectados chegarem lá, você perde HP.' },
  { titulo: 'POSICIONAMENTO', texto: 'Clique num aliado na barra inferior para selecioná-lo.\nDepois clique num slot colorido no mapa para posicioná-lo.\nReposicionar custa SP.' },
  { titulo: 'LOJA E SP', texto: 'SP são Suprimentos — sua moeda do jogo.\nAbra a LOJA para comprar upgrades antes de cada onda.\nVocê ganha SP ao eliminar inimigos.' },
  { titulo: 'BOA SORTE!', texto: 'Você tem 15 segundos para se preparar antes da 1ª onda.\nInimigos virão da esquerda em direção à base.\nMonte seu esquadrão e bora defender São Paulo!' }
];

export class GameScene extends Scene {
  constructor() { super('GameScene'); }

  create() {
    // ── Estado da partida ──────────────────────────────────────
    this.baseMaxHP         = 120;
    this.baseHP            = this.baseMaxHP;
    this.ondaAtual         = 1;
    this.totalOndas        = 3;
    this.configOndas       = [
      { zumbis: 4, caes: 1 },
      { zumbis: 3, caes: 2 },
      { zumbis: 3, caes: 2, boss: true }
    ];
    this.totalInimigosOnda = 0;
    this.spawnados         = 0;
    this.eliminados        = 0;
    this.inimigosDanaram   = 0;
    this.gameOver          = false;
    this.pausado           = false;
    this.sp                = 60;
    this.preparacao        = true;
    this.tempoPreparacao   = 15;
    this.ondaIniciada      = false;
    this.ondaConcluida     = false;
    this.attackRange       = 140;
    this.lojaAberta        = false;
    this.tutorialAtivo     = false;
    this.idxTutorial       = 0;

    // ── Upgrades progressivos ──────────────────────────────────
    this.upgrades = {
      danoGlobal:      0,   // +5 dano fixo (1 nível)
      cooldownMult:    1.0, // multiplicador cooldown
      baseReforco:     0,   // nível 0-1
      viniDano:        0,   // nível 0-3 (0/10/20/30% dano)
      helenaCura:      0,   // nível 0-2
      danielKnockback: 0,   // nível 0-3 (0/10/20/30% chance)
      avatarHP:        0    // nível 0-1
    };

    // ── Aliados ────────────────────────────────────────────────
    this.aliados           = this.registry.get('aliados') || ['vini'];
    this.aliadoSelecionado = this.aliados[0];
    this.personagem        = this.registry.get('personagem') || { nome: 'Sobrevivente', genero: 'masc', cabeloIndex: 0, roupaIndex: 0 };
    this.aliadosMortos     = new Set();

    // ── Fundo ──────────────────────────────────────────────────
    this.add.rectangle(400, 225, 800, 450, 0x1a1a2e);

    // ── Base ───────────────────────────────────────────────────
    this.baseColor = 0x33cc33;
    this.base = this.add.rectangle(750, 225, 40, 450, this.baseColor);

    // ── Slots ──────────────────────────────────────────────────
    this.slotSelecionado = null;
    this.slots = [];
    const posicoes = [
      { x: 750, y: 90,  base: true },
      { x: 190, y: 140 },
      { x: 360, y: 310 },
      { x: 530, y: 180 }
    ];
    posicoes.forEach((pos, i) => this._criarSlot(pos, i));

    this._criarHUD();
    this._criarIconesAliados();
    this._posicionarAvatarInicial();

    this.inimigos = [];
    this.atualizarCorDaBase();

    this.graficoCooldown = this.add.graphics().setDepth(6);

    this.timerPreparacaoEvent = this.time.addEvent({
      delay: 1000,
      callback: this.atualizarTimerPreparacao,
      callbackScope: this,
      repeat: this.tempoPreparacao - 1
    });

    this.timerHabilidades = this.time.addEvent({
      delay: 20000,
      callback: this._habilidadesPassivas,
      callbackScope: this,
      loop: true
    });

    // Tutorial apenas na 1ª onda (sem flag no localStorage)
    if (!localStorage.getItem('outbreak-tutorial-game')) {
      this.time.delayedCall(800, () => this._mostrarTutorial(0));
    }
  }

  // ════════════════════════════════════════════════════════════
  //  TUTORIAL PRÉ-ONDA
  // ════════════════════════════════════════════════════════════

  _mostrarTutorial(idx) {
    if (idx >= TUTORIAL_PASSOS.length) {
      this.tutorialAtivo = false;
      localStorage.setItem('outbreak-tutorial-game', '1');
      return;
    }
    this.tutorialAtivo = true;
    const passo = TUTORIAL_PASSOS[idx];
    const ultimo = idx === TUTORIAL_PASSOS.length - 1;

    const objs = [];
    const overlay = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.72).setDepth(60);
    objs.push(overlay);

    const painel = this.add.rectangle(400, 240, 500, 170, 0x0a1520)
      .setStrokeStyle(2, 0x3dff6e).setDepth(61);
    objs.push(painel);

    const tit = this.add.text(400, 172, passo.titulo, {
      fontSize: '16px', color: '#3dff6e', letterSpacing: 3, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(62);
    objs.push(tit);

    const corpo = this.add.text(400, 232, passo.texto, {
      fontSize: '13px', color: '#ccccdd', align: 'center', lineSpacing: 6
    }).setOrigin(0.5).setDepth(62);
    objs.push(corpo);

    const step = this.add.text(400, 300, (idx + 1) + ' / ' + TUTORIAL_PASSOS.length, {
      fontSize: '10px', color: '#555577'
    }).setOrigin(0.5).setDepth(62);
    objs.push(step);

    const btnLabel = ultimo ? 'COMEÇAR!' : 'PRÓXIMO →';
    const btnBg = this.add.rectangle(400, 320, 160, 30, 0x1a4a2a)
      .setStrokeStyle(1, 0x3dff6e).setDepth(62).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(400, 320, btnLabel, {
      fontSize: '13px', color: '#3dff6e', letterSpacing: 2
    }).setOrigin(0.5).setDepth(63);
    objs.push(btnBg, btnTxt);

    const destruir = () => {
      objs.forEach(o => o.destroy());
      this.idxTutorial = idx + 1;
      this._mostrarTutorial(this.idxTutorial);
    };

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x27ae60));
    btnBg.on('pointerout',  () => btnBg.setFillStyle(0x1a4a2a));
    btnBg.on('pointerup',   destruir);
  }

  // ════════════════════════════════════════════════════════════
  //  SLOTS
  // ════════════════════════════════════════════════════════════

  _criarSlot(pos, i) {
    const slot = this.add.rectangle(pos.x, pos.y, 52, 52, 0x444466)
      .setInteractive()
      .setStrokeStyle(2, 0x8888aa)
      .setDepth(1);

    slot.personagem   = null;
    slot.rangeCircle  = null;
    slot.aimIcon      = null;
    slot.cooldown     = 0;
    slot.hp           = 0;
    slot.maxHp        = 0;
    slot.hpBarFundo   = null;
    slot.hpBar        = null;
    slot.personagemId = null;
    slot.isBaseSlot    = !!pos.base;

    this.add.text(pos.x, pos.y, slot.isBaseSlot ? 'B' : (i + 1).toString(), {
      fontSize: '16px', color: '#aaaacc'
    }).setOrigin(0.5).setDepth(5);

    slot.on('pointerover', () => {
      if (!slot.personagem && slot !== this.slotSelecionado) slot.setFillStyle(0x666688);
    });
    slot.on('pointerout', () => {
      if (slot !== this.slotSelecionado) slot.setFillStyle(slot.personagem ? 0x223388 : 0x444466);
    });
    slot.on('pointerdown', () => {
      if (this.lojaAberta || this.tutorialAtivo || this.pausado) return;
      if (this.slotSelecionado === slot) {
        slot.setFillStyle(slot.personagem ? 0x223388 : 0x444466);
        this.slotSelecionado = null;
        this.textoSlot.setText('Seleção cancelada.');
        return;
      }
      if (slot.personagem && this.aliadoSelecionado === slot.personagemId) {
        this._removerPersonagemDoSlot(slot);
        this.slotSelecionado = null;
        this.textoSlot.setText('Personagem removido do slot.');
        return;
      }
      if (this.slotSelecionado)
        this.slotSelecionado.setFillStyle(this.slotSelecionado.personagem ? 0x223388 : 0x444466);
      this.slotSelecionado = slot;
      slot.setFillStyle(0x00cc66);
      if (slot.personagem) {
        this.aliadoSelecionado = slot.personagemId;
        this._atualizarBordasAliados();
        const nm = slot.personagemId === 'avatar' ? this.personagem.nome : (PERSONAGENS_CONFIG[slot.personagemId]?.nome || 'Aliado');
        this.textoSlot.setText('Slot selecionado — clique em outro slot para mover ' + nm);
      } else {
        const cfg = this.aliadoSelecionado === 'avatar'
          ? { nome: this.personagem.nome }
          : PERSONAGENS_CONFIG[this.aliadoSelecionado];
        this.textoSlot.setText('Slot selecionado — ' + (cfg ? cfg.nome + ' pronto para posicionar' : 'selecione um aliado'));
      }
    });

    this.slots.push(slot);
  }

  // ════════════════════════════════════════════════════════════
  //  HUD
  // ════════════════════════════════════════════════════════════

  _criarHUD() {
    this.add.text(16, 20, 'Base', { fontSize: '13px', color: '#aaaacc' }).setDepth(10);
    this.barraHPFundo = this.add.rectangle(58, 20, 170, 13, 0x333344).setOrigin(0, 0.5).setDepth(10);
    this.barraHP      = this.add.rectangle(58, 20, 170, 13, 0x33cc33).setOrigin(0, 0.5).setDepth(10);
    this.textoHP      = this.add.text(236, 13, this.baseHP + '/' + this.baseMaxHP, { fontSize: '12px', color: '#ffffff' }).setDepth(10);

    this.textoOnda  = this.add.text(16, 38, 'Onda: ' + this.ondaAtual + ' / ' + this.totalOndas, { fontSize: '16px', color: '#ffdd00' }).setDepth(10);
    this.textoSP    = this.add.text(16, 60, 'SP: ' + this.sp, { fontSize: '16px', color: '#00ccff' }).setDepth(10);
    this.textoTempo = this.add.text(16, 82, 'Preparação: 15 s', { fontSize: '16px', color: '#ffffff' }).setDepth(10);
    this.textoSlot  = this.add.text(16, 432, 'Selecione um aliado e clique num slot para posicionar', { fontSize: '12px', color: '#aaaacc' }).setDepth(10);

    // ── Botão LOJA ─────────────────────────────────────────────
    this.btnLoja = this.add.rectangle(640, 20, 96, 28, 0x1a3a1a)
      .setStrokeStyle(1, 0x3dff6e).setDepth(10).setInteractive({ useHandCursor: true });
    this.btnLojaTxt = this.add.text(640, 20, '🛒 LOJA', { fontSize: '12px', color: '#3dff6e', letterSpacing: 2 }).setOrigin(0.5).setDepth(11);
    this.btnLoja.on('pointerover', () => this.btnLoja.setFillStyle(0x27ae60));
    this.btnLoja.on('pointerout',  () => this.btnLoja.setFillStyle(0x1a3a1a));
    this.btnLoja.on('pointerup',   () => { if (this.preparacao && !this.pausado) this._abrirLoja(); });

    // ── Botão PAUSA ────────────────────────────────────────────
    const btnPausa = this.add.rectangle(756, 20, 64, 28, 0x1a1a3a)
      .setStrokeStyle(1, 0x555577).setDepth(10).setInteractive({ useHandCursor: true });
    this.add.text(756, 20, '⏸ MENU', { fontSize: '11px', color: '#aaaacc', letterSpacing: 1 }).setOrigin(0.5).setDepth(11);
    btnPausa.on('pointerover', () => btnPausa.setFillStyle(0x2a2a5a));
    btnPausa.on('pointerout',  () => btnPausa.setFillStyle(0x1a1a3a));
    btnPausa.on('pointerup',   () => this._abrirPausa());
  }

  // ════════════════════════════════════════════════════════════
  //  PAUSE MENU
  // ════════════════════════════════════════════════════════════

  _abrirPausa() {
    if (this.pausado) return;
    this.pausado = true;
    this.physics.pause();
    if (this.timerPreparacaoEvent) this.timerPreparacaoEvent.paused = true;
    this.timerHabilidades.paused = true;

    const objs = [];
    const ov = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.80).setDepth(80);
    objs.push(ov);

    objs.push(this.add.text(400, 110, '⏸  PAUSADO', { fontSize: '22px', color: '#ffffff', letterSpacing: 5 }).setOrigin(0.5).setDepth(81));
    objs.push(this.add.rectangle(400, 225, 260, 270, 0x0a1520).setStrokeStyle(2, 0x333355).setDepth(81));

    const opcoes = [
      { label: '💾  SALVAR',           acao: () => this._salvarJogo() },
      { label: '🔊  OPÇÕES (em breve)', acao: null },
      { label: '🗺  VOLTAR AO MAPA',   acao: null },
      { label: '🏠  MENU PRINCIPAL',   acao: () => { this._fecharPausa(objs); this.scene.start('MenuScene'); } },
      { label: '▶   RETOMAR',          acao: () => this._fecharPausa(objs) }
    ];

    opcoes.forEach((op, i) => {
      const cy = 158 + i * 48;
      const bg = this.add.rectangle(400, cy, 220, 36, 0x111128)
        .setStrokeStyle(1, 0x2a2a4a).setDepth(82)
        .setInteractive({ useHandCursor: !!op.acao });
      const txt = this.add.text(400, cy, op.label, { fontSize: '13px', color: op.acao ? '#ffffff' : '#444466', letterSpacing: 1 }).setOrigin(0.5).setDepth(83);
      objs.push(bg, txt);

      if (op.acao) {
        bg.on('pointerover', () => { bg.setFillStyle(0x1e2240); txt.setStyle({ color: '#3dff6e' }); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x111128); txt.setStyle({ color: '#ffffff' }); });
        bg.on('pointerup',   () => op.acao());
      }
    });

    this._pausaObjs = objs;
  }

  _fecharPausa(objs) {
    (objs || this._pausaObjs || []).forEach(o => o.destroy());
    this._pausaObjs = null;
    this.pausado = false;
    this.physics.resume();
    if (this.timerPreparacaoEvent) this.timerPreparacaoEvent.paused = false;
    this.timerHabilidades.paused = false;
  }

  _salvarJogo() {
    const slot = this.registry.get('slotAtual') || 1;
    const key  = 'outbreak-defense-save-' + slot;
    const raw  = localStorage.getItem(key);
    const save = raw ? JSON.parse(raw) : {};
    save.ondaAtual  = this.ondaAtual;
    save.sp         = this.sp;
    save.baseHP     = this.baseHP;
    save.savedAt    = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    localStorage.setItem(key, JSON.stringify(save));
    this._floatingText(400, 220, '💾 Salvo!', '#3dff6e');
  }

  // ════════════════════════════════════════════════════════════
  //  ÍCONES DE ALIADOS
  // ════════════════════════════════════════════════════════════

  _criarIconesAliados() {
    const total  = this.aliados.length;
    const startX = 400 - ((total - 1) * 120) / 2;
    this._iconeBgs = [];

    this.aliados.forEach((id, i) => {
      const cfg = PERSONAGENS_CONFIG[id] || { nome: id, cor: 0x888888, custo: 20, dano: 20, hp: 80 };
      const cx  = startX + i * 120;
      const cy  = 405;
      const isSel = this.aliadoSelecionado === id;

      const bg = this.add.rectangle(cx, cy, 102, 44, isSel ? 0x0d1e30 : 0x1a1a2e)
        .setStrokeStyle(isSel ? 2 : 1, isSel ? cfg.cor : 0x333355)
        .setInteractive({ useHandCursor: true }).setDepth(10);

      this.add.rectangle(cx - 33, cy, 28, 28, cfg.cor).setDepth(11);
      this.add.text(cx - 12, cy - 9, cfg.nome, { fontSize: '12px', color: '#ffffff', fontStyle: 'bold' }).setDepth(11);
      this.add.text(cx - 12, cy + 5, cfg.custo + ' SP', { fontSize: '10px', color: '#aaaacc' }).setDepth(11);

      bg._aliadoId = id;
      bg._cfg      = cfg;

      bg.on('pointerover', () => { if (this.aliadoSelecionado !== id) bg.setFillStyle(0x2a2a4a); });
      bg.on('pointerout',  () => { if (this.aliadoSelecionado !== id) bg.setFillStyle(0x1a1a2e); });
      bg.on('pointerdown', () => {
        if (this.lojaAberta || this.tutorialAtivo || this.pausado) return;
        if (this.aliadoSelecionado === id) {
          this.aliadoSelecionado = null;
          this._atualizarBordasAliados();
          if (this.slotSelecionado) { this.slotSelecionado.setFillStyle(0x444466); this.slotSelecionado = null; }
          this.textoSlot.setText('Seleção cancelada.');
          return;
        }
        this.aliadoSelecionado = id;
        this._atualizarBordasAliados();
        if (this.slotSelecionado) this.colocarPersonagemNoSlot();
        else this.textoSlot.setText(cfg.nome + ' selecionado — clique num slot para posicionar');
      });

      this._iconeBgs.push(bg);
    });
  }

  _atualizarBordasAliados() {
    this._iconeBgs.forEach(bg => {
      const cfg = PERSONAGENS_CONFIG[bg._aliadoId] || { cor: 0x888888 };
      const sel = this.aliadoSelecionado === bg._aliadoId;
      bg.setStrokeStyle(sel ? 2 : 1, sel ? cfg.cor : 0x333355);
      bg.setFillStyle(sel ? 0x0d1e30 : 0x1a1a2e);
    });
  }

  _posicionarAvatarInicial() {
    if (!this.personagem || this.slots.length === 0) return;
    const cfg = { nome: this.personagem.nome, cor: CORES_ROUPAS[this.personagem.roupaIndex] || 0x888888, custo: 20, dano: 22, hp: 100 };
    const targetSlot = this.slots[0];
    if (targetSlot.personagem) return;
    this._posicionarNoSlot(targetSlot, 'avatar', cfg);
    this.textoSlot.setText(cfg.nome + ' posicionado no slot B para a 1ª onda.');
  }

  // ════════════════════════════════════════════════════════════
  //  POSICIONAMENTO
  // ════════════════════════════════════════════════════════════

  colocarPersonagemNoSlot() {
    if (!this.slotSelecionado) { this.textoSlot.setText('Selecione um slot primeiro.'); return; }
    const slot = this.slotSelecionado;
    if (slot.personagem) { this.textoSlot.setText('Slot ocupado! Escolha outro.'); return; }

    const id = this.aliadoSelecionado;
    if (this.aliadosMortos.has(id)) {
      if (this.sp < 20) { this.textoSlot.setText('SP insuficiente para ressuscitar!'); return; }
      this.sp -= 20; this.textoSP.setText('SP: ' + this.sp);
      this.aliadosMortos.delete(id);
    }

    let cfg;
    if (id === 'avatar') {
      cfg = { nome: this.personagem.nome, cor: CORES_ROUPAS[this.personagem.roupaIndex] || 0x888888, custo: 20, dano: 22, hp: 100 + this.upgrades.avatarHP * 20 };
    } else {
      cfg = { ...(PERSONAGENS_CONFIG[id] || { nome: id, cor: 0x888888, custo: 20, dano: 22, hp: 100 }) };
    }

    const slotAtual = this.slots.find(s => s.personagemId === id && s.personagem);
    if (slotAtual === slot) { this.textoSlot.setText(cfg.nome + ' já está neste slot.'); return; }
    if (slotAtual) {
      if (this.sp < 20) { this.textoSlot.setText('SP insuficiente para mover!'); return; }
      this.sp -= 20; this.textoSP.setText('SP: ' + this.sp);
      this._removerPersonagemDoSlot(slotAtual);
    }

    this._posicionarNoSlot(slot, id, cfg);
    this.slotSelecionado = null;
  }

  _posicionarNoSlot(slot, id, cfg) {
    const rangeCircle = this.add.circle(slot.x, slot.y, this.attackRange, 0x00ccff, 0.10).setDepth(-1);
    const aimIcon     = this.add.circle(slot.x, slot.y, 20, 0xffff00, 0.15).setStrokeStyle(2, 0xffff00, 0.8).setDepth(1);
    const personagem  = this.add.rectangle(slot.x, slot.y, 32, 32, cfg.cor).setDepth(2);
    const hpBarFundo  = this.add.rectangle(slot.x, slot.y - 34, 44, 6, 0x222233).setDepth(3);
    const hpBar       = this.add.rectangle(slot.x - 22, slot.y - 34, 44, 6, cfg.cor).setOrigin(0, 0.5).setDepth(3);

    let healCircle = null;
    if (id === 'helena') {
      const raio = 260 + this.upgrades.helenaCura * 70;
      healCircle = this.add.circle(slot.x, slot.y, raio, 0x00ff88, 0.04).setStrokeStyle(2, 0x00ff88, 0.4).setDepth(0.5);
    }

    slot.personagem   = personagem;
    slot.rangeCircle  = rangeCircle;
    slot.aimIcon      = aimIcon;
    slot.healCircle   = healCircle;
    slot.personagemId = id;
    slot.hp           = cfg.hp;
    slot.maxHp        = cfg.hp;
    slot.hpBarFundo   = hpBarFundo;
    slot.hpBar        = hpBar;
    slot.cooldown     = 0;
    slot.cfg          = cfg;
    slot.setFillStyle(0x223388);
    slot.setStrokeStyle(2, cfg.cor);
    this.textoSlot.setText(cfg.nome + ' posicionado no slot ' + (this.slots.indexOf(slot) + 1) + '!');
  }

  _removerPersonagemDoSlot(slot) {
    if (slot.personagem)  { slot.personagem.destroy();  slot.personagem  = null; }
    if (slot.rangeCircle) { slot.rangeCircle.destroy(); slot.rangeCircle = null; }
    if (slot.aimIcon)     { slot.aimIcon.destroy();     slot.aimIcon     = null; }
    if (slot.healCircle)  { slot.healCircle.destroy();  slot.healCircle  = null; }
    if (slot.hpBarFundo)  { slot.hpBarFundo.destroy();  slot.hpBarFundo  = null; }
    if (slot.hpBar)       { slot.hpBar.destroy();       slot.hpBar       = null; }
    slot.hp = 0; slot.maxHp = 0; slot.personagemId = null; slot.cooldown = 10;
    slot.setFillStyle(0x444466); slot.setStrokeStyle(2, 0x8888aa);
  }

  // ════════════════════════════════════════════════════════════
  //  HP DA BASE
  // ════════════════════════════════════════════════════════════

  atualizarCorDaBase() {
    const ratio = PhaserMath.Clamp(this.baseHP / this.baseMaxHP, 0, 1);
    const r = Math.round(0x33 + (0xff - 0x33) * (1 - ratio));
    const g = Math.round(0xcc * ratio);
    const b = Math.round(0x33 * ratio);
    this.baseColor = (r << 16) | (g << 8) | b;
    this.base.setFillStyle(this.baseColor);
    this.barraHP.setSize(Math.max(0, 170 * ratio), 13);
    this.barraHP.setFillStyle(this.baseColor);
    this.textoHP.setText(Math.max(0, this.baseHP) + '/' + this.baseMaxHP);
    if (ratio <= 0.25) this.textoHP.setColor('#ff4444');
    else if (ratio <= 0.5) this.textoHP.setColor('#ffcc33');
    else this.textoHP.setColor('#ffffff');
  }

  piscarBaseHit() {
    const corOriginal = this.baseColor;
    this.tweens.add({
      targets: this.base, alpha: 0.2, duration: 80, yoyo: true,
      onStart:    () => this.base.setFillStyle(0xffffff),
      onComplete: () => { this.base.setFillStyle(corOriginal); this.base.setAlpha(1); }
    });
  }

  // ════════════════════════════════════════════════════════════
  //  ATAQUE DE ZUMBIS À TORRE
  // ════════════════════════════════════════════════════════════

  _verificarAtaqueTorre(z, delta) {
    if (!z || !z.active) return false;
    for (const slot of this.slots) {
      if (!slot.personagem || slot.hp <= 0) continue;
      const dist = PhaserMath.Distance.Between(z.x, z.y, slot.x, slot.y);
      if (dist <= 36) {
        z.body.setVelocityX(0);
        z.meleeTimer = (z.meleeTimer || 0) + delta / 1000;
        if (z.meleeTimer >= 1.0) {
          z.meleeTimer = 0;
          slot.hp -= z.dano;
          if (slot.personagem?.active) {
            const cfg = slot.cfg || PERSONAGENS_CONFIG[slot.personagemId] || { cor: 0x888888 };
            slot.personagem.setFillStyle(0xffffff);
            this.time.delayedCall(80, () => { if (slot.personagem?.active) slot.personagem.setFillStyle(cfg.cor); });
          }
          this._atualizarHPTorre(slot);
          this.tocarSomTorreHit();
          if (slot.hp <= 0) { slot.hp = -999; this._destruirTorre(slot, z); }
        }
        return true;
      }
    }
    if (z.body && z.body.velocity.x === 0) z.body.setVelocityX(z._velocidade || 80);
    return false;
  }

  _atualizarHPTorre(slot) {
    if (!slot.hpBar || slot.maxHp <= 0) return;
    const ratio = Math.max(0, slot.hp / slot.maxHp);
    slot.hpBar.setSize(Math.round(44 * ratio), 6);
    slot.hpBar.setFillStyle(ratio > 0.5 ? 0x33cc33 : ratio > 0.25 ? 0xffcc33 : 0xff4444);
  }

  _destruirTorre(slot, z) {
    if (slot.personagem) this.tweens.add({ targets: slot.personagem, alpha: 0, scaleX: 2, scaleY: 2, duration: 350 });
    const ex = this.add.circle(slot.x, slot.y, 28, 0xff4444, 0.6).setDepth(10);
    this.tweens.add({ targets: ex, alpha: 0, scale: 2.5, duration: 450, onComplete: () => ex.destroy() });
    this.cameras.main.shake(120, 0.007);
    const cfg = slot.cfg || PERSONAGENS_CONFIG[slot.personagemId] || { nome: 'Aliado' };
    this.textoSlot.setText(cfg.nome + ' foi eliminado pelos infectados!');
    this.aliadosMortos.add(slot.personagemId);
    if (z?.body) z.body.setVelocityX(z._velocidade || 80);
    this.time.delayedCall(380, () => this._removerPersonagemDoSlot(slot));
  }

  // ════════════════════════════════════════════════════════════
  //  ATAQUE AUTOMÁTICO DAS TORRES
  // ════════════════════════════════════════════════════════════

  atacarInimigos(delta) {
    for (const slot of this.slots) {
      if (!slot.personagem || !slot.rangeCircle || slot.hp <= 0) continue;
      slot.cooldown = Math.max(0, slot.cooldown - delta / 1000);
      if (slot.cooldown > 0) continue;

      const cfg = slot.cfg || PERSONAGENS_CONFIG[slot.personagemId] || { dano: 20 };
      let danoFinal = cfg.dano + (this.upgrades.danoGlobal ? 5 : 0);

      // Vini: bônus de dano progressivo
      if (slot.personagemId === 'vini' && this.upgrades.viniDano > 0)
        danoFinal = Math.round(danoFinal * (1 + this.upgrades.viniDano * 0.1));

      const cdBase = 0.8 * (this.upgrades.cooldownMult ?? 1.0);

      for (const z of this.inimigos) {
        if (!z || !z.active) continue;
        const dist = PhaserMath.Distance.Between(slot.x, slot.y, z.x, z.y);
        if (dist <= this.attackRange) {
          z.hp -= danoFinal;
          slot.cooldown = cdBase;
          this.tocarSomDisparo();
          this._criarProjetil(slot.x, slot.y, z.x, z.y, cfg);

          // Daniel: knockback com chance progressiva
          if (slot.personagemId === 'daniel' && this.upgrades.danielKnockback > 0 && z.body) {
            const chance = this.upgrades.danielKnockback * 0.10; // 10/20/30%
            if (Math.random() < chance) {
              z.body.setVelocityX(-120);
              this.time.delayedCall(500, () => { if (z?.active) z.body.setVelocityX(z._velocidade); });
              this._floatingText(z.x, z.y - 10, '🔧', '#ffaa33');
            }
          }

          z.setFillStyle(0xffffff);
          this.time.delayedCall(100, () => {
            if (z?.active) {
              if      (z.tipo === 'boss')  z.setFillStyle(0x880044);
              else if (z.tipo === 'zumbi') z.setFillStyle(0xff0000);
              else                         z.setFillStyle(0x880000);
            }
          });

          if (z._hpBar && z.maxHp) {
            const ratio = Math.max(0, z.hp / z.maxHp);
            z._hpBar.setSize(Math.round(70 * ratio), 8);
            z._hpBar.setFillStyle(ratio > 0.5 ? 0xff4400 : ratio > 0.25 ? 0xff8800 : 0xff0000);
          }

          this.tocarSomInimigo(z.hp <= 0 ? 'death' : 'hit');
          if (z.hp <= 0) this.removerInimigo(z);
          break;
        }
      }
    }
  }

  _criarProjetil(x1, y1, x2, y2, cfg) {
    const cor  = cfg?.cor || 0xffff00;
    const shot = this.add.circle(x1, y1, 5, cor, 1).setDepth(8);
    this.tweens.add({ targets: shot, x: x2, y: y2, duration: 110, ease: 'Linear', onComplete: () => shot.destroy() });
    const flash = this.add.circle(x1, y1, 14, cor, 0.2).setDepth(7);
    this.tweens.add({ targets: flash, alpha: 0, scale: 1.8, duration: 110, onComplete: () => flash.destroy() });
  }

  // ════════════════════════════════════════════════════════════
  //  ARCOS DE COOLDOWN
  // ════════════════════════════════════════════════════════════

  _desenharArcosCooldown() {
    this.graficoCooldown.clear();
    for (const slot of this.slots) {
      if (!slot.personagem || slot.hp <= 0 || slot.cooldown <= 0) continue;
      const ratio   = slot.cooldown / 0.8;
      const angFim  = PhaserMath.DegToRad(-90 + ratio * 360);
      this.graficoCooldown.lineStyle(3, 0xffffff, 0.5);
      this.graficoCooldown.beginPath();
      this.graficoCooldown.arc(slot.x, slot.y, 28, PhaserMath.DegToRad(-90), angFim, false);
      this.graficoCooldown.strokePath();
    }
  }

  // ════════════════════════════════════════════════════════════
  //  SPAWN E REMOÇÃO DE INIMIGOS
  // ════════════════════════════════════════════════════════════

  spawnZumbi() {
    const config = this.configOndas[this.ondaAtual - 1];
    const tipo   = this.spawnados < config.zumbis ? 'zumbi' : 'cao';
    this.spawnados++;
    this.textoOnda.setText('Onda: ' + this.ondaAtual + ' -- ' + this.eliminados + '/' + this.totalInimigosOnda);

    let hp, velocidade, cor, larg, alt, dano;
    if (tipo === 'zumbi') { hp = 100; velocidade = 80;  cor = 0xff0000; larg = 32; alt = 48; dano = 30; }
    else                  { hp = 60;  velocidade = 150; cor = 0x880000; larg = 24; alt = 24; dano = 15; }

    const z = this.add.rectangle(30, PhaserMath.Between(50, 400), larg, alt, cor);
    this.physics.add.existing(z);
    z.body.setVelocityX(velocidade);
    z.hp = hp; z.dano = dano; z.tipo = tipo; z._velocidade = velocidade; z.meleeTimer = 0;
    this.inimigos.push(z);
  }

  spawnBoss() {
    if (this.gameOver) return;
    this.cameras.main.flash(400, 180, 0, 0);
    this.cameras.main.shake(250, 0.012);
    this.tocarSomBoss();

    const aviso = this.add.text(400, 200, '⚠  ZUMBI CHEFE  ⚠', { fontSize: '22px', color: '#ff2200', fontStyle: 'bold', letterSpacing: 4 }).setOrigin(0.5).setDepth(30).setAlpha(0);
    this.tweens.add({ targets: aviso, alpha: 1, duration: 200, yoyo: true, hold: 1200, onComplete: () => aviso.destroy() });
    this.textoSlot.setText('⚠ ZUMBI CHEFE apareceu! Concentre o fogo!');

    const z = this.add.rectangle(30, 225, 64, 96, 0x880044).setDepth(3);
    this.physics.add.existing(z);
    z.body.setVelocityX(45);
    z.hp = 400; z.maxHp = 400; z.dano = 50; z.tipo = 'boss'; z._velocidade = 45; z.meleeTimer = 0;

    z._hpFundo = this.add.rectangle(30, 225 - 64, 70, 8, 0x222233).setDepth(4);
    z._hpBar   = this.add.rectangle(30 - 35, 225 - 64, 70, 8, 0xff4400).setOrigin(0, 0.5).setDepth(4);
    z._label   = this.add.text(30, 225 - 76, 'CHEFE', { fontSize: '10px', color: '#ff4444', fontStyle: 'bold', letterSpacing: 2 }).setOrigin(0.5).setDepth(5);
    this.inimigos.push(z);
  }

  removerInimigo(z) {
    if (!z || !z.active) return;

    const recompensa = z.tipo === 'boss' ? 30 : z.tipo === 'zumbi' ? 5 : 3;
    this.sp += recompensa;
    this.textoSP.setText('SP: ' + this.sp);
    this._floatingText(z.x, z.y, '+' + recompensa + ' SP', '#00ccff');

    if (z.tipo === 'boss') {
      this.cameras.main.shake(500, 0.022);
      this.cameras.main.flash(300, 255, 80, 0);
      this._floatingText(z.x, z.y - 30, 'CHEFE ELIMINADO!', '#ff4444');
      this.tocarSomBoss();
    }

    if (z._hpFundo) { z._hpFundo.destroy(); z._hpFundo = null; }
    if (z._hpBar)   { z._hpBar.destroy();   z._hpBar   = null; }
    if (z._label)   { z._label.destroy();   z._label   = null; }

    z.destroy();
    const idx = this.inimigos.indexOf(z);
    if (idx !== -1) this.inimigos.splice(idx, 1);
    this.eliminados++;
    this.textoOnda.setText('Onda: ' + this.ondaAtual + ' -- ' + this.eliminados + '/' + this.totalInimigosOnda);

    if (this.ondaConcluida) return;
    // Só verifica fim de onda quando TODOS os inimigos morreram (sem nenhum vivo)
    if (this.eliminados >= this.totalInimigosOnda && this.inimigos.length === 0)
      this._verificarFimOnda();
  }

  zumbiAtingeuBase(z) {
    if (z._hpFundo) { z._hpFundo.destroy(); z._hpFundo = null; }
    if (z._hpBar)   { z._hpBar.destroy();   z._hpBar   = null; }
    if (z._label)   { z._label.destroy();   z._label   = null; }

    z.destroy();
    const idx = this.inimigos.indexOf(z);
    if (idx !== -1) this.inimigos.splice(idx, 1);
    this.eliminados++;
    this.inimigosDanaram++;
    this.cameras.main.shake(200, 0.01);
    this.baseHP -= z.dano;
    this.atualizarCorDaBase();
    this.piscarBaseHit();
    this.textoOnda.setText('Onda: ' + this.ondaAtual + ' -- ' + this.eliminados + '/' + this.totalInimigosOnda);

    if (this.baseHP <= 0) {
      this.gameOver = true;
      this.scene.start('GameOverScene', { onda: this.ondaAtual, eliminados: this.eliminados, hp: 0 });
      return;
    }

    if (!this.ondaConcluida && this.eliminados >= this.totalInimigosOnda && this.inimigos.length === 0)
      this._verificarFimOnda();
  }

  // ════════════════════════════════════════════════════════════
  //  CONTROLE DE ONDAS
  // ════════════════════════════════════════════════════════════

  atualizarTimerPreparacao() {
    if (!this.preparacao || this.pausado) return;
    this.tempoPreparacao -= 1;
    this.textoTempo.setText('Preparação: ' + this.tempoPreparacao + ' s');
    if (this.tempoPreparacao <= 0 && !this.ondaIniciada) this.iniciarOnda();
  }

  iniciarOnda() {
    if (this.ondaIniciada) return;
    this.ondaIniciada  = true;
    this.ondaConcluida = false;
    this.preparacao    = false;
    if (this.timerPreparacaoEvent) { this.timerPreparacaoEvent.remove(false); this.timerPreparacaoEvent = null; }
    this._fecharLoja();
    this.btnLoja.setVisible(false);
    this.btnLojaTxt.setVisible(false);
    this.textoTempo.setText('Onda ' + this.ondaAtual + ' em curso!');

    const config = this.configOndas[this.ondaAtual - 1];
    const totalNormais = config.zumbis + config.caes;
    this.totalInimigosOnda = totalNormais + (config.boss ? 1 : 0);
    this.spawnados  = 0;
    this.eliminados = 0;

    this.spawnZumbi();
    this.time.addEvent({ delay: 2000, repeat: totalNormais - 1, callback: this.spawnZumbi, callbackScope: this });

    if (config.boss) this.time.delayedCall(totalNormais * 2000 + 2500, this.spawnBoss, [], this);
  }

  _verificarFimOnda() {
    if (this.ondaConcluida) return;
    this.ondaConcluida = true;

    if (this.ondaAtual === this.totalOndas) {
      // Vitória
      const estrelas = this.inimigosDanaram === 0 ? 3 : this.inimigosDanaram <= 2 ? 2 : 1;
      this.time.delayedCall(1500, () => {
        this.scene.start('VictoryScene', { onda: this.ondaAtual, estrelas, sp: this.sp });
      });
    } else {
      // Painel de próxima onda (com delay para o último inimigo morrer visualmente)
      this.time.delayedCall(1200, () => this._painelProximaOnda());
    }
  }

  _painelProximaOnda() {
    const objs = [];
    const ov   = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.65).setDepth(40);
    objs.push(ov);

    const estrelas = this.inimigosDanaram === 0 ? '★★★' : this.inimigosDanaram <= 2 ? '★★☆' : '★☆☆';
    objs.push(this.add.text(400, 160, 'ONDA ' + this.ondaAtual + ' CONCLUÍDA', { fontSize: '20px', color: '#3dff6e', letterSpacing: 4, fontStyle: 'bold' }).setOrigin(0.5).setDepth(41));
    objs.push(this.add.text(400, 195, estrelas, { fontSize: '28px', color: '#ffdd00' }).setOrigin(0.5).setDepth(41));
    objs.push(this.add.text(400, 228, 'Inimigos passaram: ' + this.inimigosDanaram, { fontSize: '13px', color: '#aaaacc' }).setOrigin(0.5).setDepth(41));
    objs.push(this.add.text(400, 250, 'SP acumulado: ' + this.sp, { fontSize: '13px', color: '#00ccff' }).setOrigin(0.5).setDepth(41));

    const btn = this.add.rectangle(400, 300, 200, 38, 0x1a4a2a).setStrokeStyle(2, 0x3dff6e).setDepth(41).setInteractive({ useHandCursor: true });
    const btnTxt = this.add.text(400, 300, 'PRÓXIMA ONDA →', { fontSize: '14px', color: '#3dff6e', letterSpacing: 3 }).setOrigin(0.5).setDepth(42);
    btn.on('pointerover', () => btn.setFillStyle(0x27ae60));
    btn.on('pointerout',  () => btn.setFillStyle(0x1a4a2a));
    btn.on('pointerup',   () => {
      objs.forEach(o => o.destroy());
      this._iniciarProximaOnda();
    });
    objs.push(btn, btnTxt);
  }

  _iniciarProximaOnda() {
    this.ondaAtual++;
    this.ondaIniciada      = false;
    this.ondaConcluida     = false;
    this.preparacao        = true;
    this.tempoPreparacao   = 15;
    this.inimigosDanaram   = 0;

    this.textoOnda.setText('Onda: ' + this.ondaAtual + ' / ' + this.totalOndas);
    this.textoTempo.setText('Preparação: 15 s');
    this.btnLoja.setVisible(true);
    this.btnLojaTxt.setVisible(true);

    this.timerPreparacaoEvent = this.time.addEvent({
      delay: 1000, callback: this.atualizarTimerPreparacao, callbackScope: this,
      repeat: this.tempoPreparacao - 1
    });
  }

  // ════════════════════════════════════════════════════════════
  //  LOJA
  // ════════════════════════════════════════════════════════════

  _abrirLoja() {
    if (this.lojaAberta) return;
    this.lojaAberta = true;

    this._lojaObjs = [];
    const OV_W = 580, OV_H = 350;

    const ov = this.add.rectangle(400, 225, 800, 450, 0x000000, 0.75).setDepth(30);
    this._lojaObjs.push(ov);

    const painel = this.add.rectangle(400, 228, OV_W, OV_H, 0x070e18).setStrokeStyle(2, 0x3dff6e).setDepth(31);
    this._lojaObjs.push(painel);

    this._lojaObjs.push(
      this.add.text(400, 63, '🛒  LOJA DE SUPRIMENTOS', { fontSize: '16px', color: '#3dff6e', letterSpacing: 3 }).setOrigin(0.5).setDepth(32),
      this.add.text(400, 85, 'SP disponível: ' + this.sp, { fontSize: '12px', color: '#00ccff' }).setOrigin(0.5).setDepth(32)
    );
    this._textoSPLoja = this._lojaObjs[this._lojaObjs.length - 1];

    // ── Botão fechar (topo direito do painel) ──────────────────
    const btnX = 400 + OV_W / 2 - 22;
    const btnY = 63;
    const btnFechar = this.add.rectangle(btnX, btnY, 32, 32, 0x3a0a0a).setStrokeStyle(1, 0xff4444).setDepth(32).setInteractive({ useHandCursor: true });
    this.add.text(btnX, btnY, '✕', { fontSize: '14px', color: '#ff4444' }).setOrigin(0.5).setDepth(33);
    btnFechar.on('pointerup', () => this._fecharLoja());
    this._lojaObjs.push(btnFechar);

    // ── Itens (layout 2 colunas, scrollável por necessidade) ──
    const startY = 110;
    const colX   = [132, 402];
    const linH   = 94;

    LOJA_ITENS.forEach((item, i) => {
      const col  = i % 2;
      const lin  = Math.floor(i / 2);
      const cx   = colX[col];
      const cy   = startY + lin * linH;
      this._criarItemLoja(item, cx, cy);
    });
  }

  _criarItemLoja(item, cx, cy) {
    const nivelAtual = this.upgrades[item.id] ?? 0;
    const maxNivel   = item.maxNivel;
    const comprado   = nivelAtual >= maxNivel;
    const custo      = item.custos[nivelAtual] ?? 999;
    const podePagar  = this.sp >= custo && !comprado;

    const corBorda = comprado ? 0x3dff6e : (podePagar ? 0x334455 : 0x2a1a1a);
    const corFundo = comprado ? 0x0a1a0a : 0x0d1828;

    const card = this.add.rectangle(cx, cy, 250, 82, corFundo).setStrokeStyle(1, corBorda).setDepth(32).setInteractive({ useHandCursor: podePagar });
    this._lojaObjs.push(card);

    // Label + nível
    const nivelStr = maxNivel > 1 ? '  [Nv ' + nivelAtual + '/' + maxNivel + ']' : '';
    this._lojaObjs.push(this.add.text(cx, cy - 30, item.label + nivelStr, { fontSize: '11px', color: comprado ? '#3dff6e' : '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(33));

    // Descrição (truncada em 2 linhas)
    const descricao = item.descricao.split('\n')[0];
    this._lojaObjs.push(this.add.text(cx, cy - 12, descricao, { fontSize: '9px', color: '#7788aa', wordWrap: { width: 230 } }).setOrigin(0.5).setDepth(33));

    // Custo / status
    const custoLabel = comprado ? '✔ Máximo' : custo + ' SP';
    const custoColor = comprado ? '#3dff6e' : (podePagar ? '#00ccff' : '#ff4444');
    const custoTxt   = this.add.text(cx, cy + 12, custoLabel, { fontSize: '11px', color: custoColor }).setOrigin(0.5).setDepth(33);
    this._lojaObjs.push(custoTxt);

    if (!comprado) {
      // Barra de progresso de nível
      if (maxNivel > 1) {
        const barW = 200;
        this._lojaObjs.push(this.add.rectangle(cx, cy + 26, barW, 5, 0x1a1a2a).setDepth(33));
        if (nivelAtual > 0) this._lojaObjs.push(this.add.rectangle(cx - barW / 2, cy + 26, Math.round(barW * nivelAtual / maxNivel), 5, 0x3dff6e).setOrigin(0, 0.5).setDepth(34));
      }

      card.on('pointerover', () => { if (podePagar) card.setFillStyle(0x152030); });
      card.on('pointerout',  () => { if (podePagar) card.setFillStyle(corFundo); });
      card.on('pointerup',   () => {
        if (!podePagar) return;
        this.sp -= custo;
        this.textoSP.setText('SP: ' + this.sp);
        this._aplicarUpgrade(item.id);
        this._fecharLoja();
        this._abrirLoja(); // reabrir para atualizar estado
      });
    }
  }

  _aplicarUpgrade(id) {
    switch (id) {
      case 'danoGlobal':      this.upgrades.danoGlobal      = 1; break;
      case 'cooldownMult':    this.upgrades.cooldownMult     = 0.75; break;
      case 'baseReforco':     this.upgrades.baseReforco      = 1; this.baseMaxHP += 20; this.baseHP = Math.min(this.baseHP + 20, this.baseMaxHP); this.atualizarCorDaBase(); break;
      case 'viniDano':        this.upgrades.viniDano         = Math.min((this.upgrades.viniDano || 0) + 1, 3); break;
      case 'helenaCura':      this.upgrades.helenaCura       = Math.min((this.upgrades.helenaCura || 0) + 1, 2); break;
      case 'danielKnockback': this.upgrades.danielKnockback  = Math.min((this.upgrades.danielKnockback || 0) + 1, 3); break;
      case 'avatarHP':        this.upgrades.avatarHP         = 1; break;
    }
    this._floatingText(400, 200, '✔ Upgrade comprado!', '#3dff6e');
  }

  _fecharLoja() {
    if (!this.lojaAberta) return;
    this.lojaAberta = false;
    if (this._lojaObjs) { this._lojaObjs.forEach(o => o.destroy()); this._lojaObjs = null; }
  }

  // ════════════════════════════════════════════════════════════
  //  HABILIDADES PASSIVAS
  // ════════════════════════════════════════════════════════════

  _habilidadesPassivas() {
    if (this.gameOver || !this.ondaIniciada || this.ondaConcluida) return;

    // Helena: cura aliados em raio
    for (const slotHelena of this.slots) {
      if (slotHelena.personagemId !== 'helena' || slotHelena.hp <= 0) continue;
      const raio = 260 + this.upgrades.helenaCura * 70;
      for (const slot of this.slots) {
        if (slot === slotHelena || slot.hp <= 0 || slot.maxHp <= 0) continue;
        const dist = PhaserMath.Distance.Between(slotHelena.x, slotHelena.y, slot.x, slot.y);
        if (dist <= raio) {
          slot.hp = Math.min(slot.hp + 10, slot.maxHp);
          this._atualizarHPTorre(slot);
          this._floatingText(slot.x, slot.y - 20, '+10 HP', '#00ff88');
        }
      }
    }
  }

  // ════════════════════════════════════════════════════════════
  //  UTILIDADES
  // ════════════════════════════════════════════════════════════

  _floatingText(x, y, msg, cor) {
    const t = this.add.text(x, y, msg, { fontSize: '13px', color: cor || '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
    this.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 900, ease: 'Power1', onComplete: () => t.destroy() });
  }

  tocarSomDisparo()   { /* Web Audio API — implementar com assets */ }
  tocarSomInimigo()   { /* Web Audio API */ }
  tocarSomTorreHit()  { /* Web Audio API */ }
  tocarSomBoss()      { /* Web Audio API */ }

  // ════════════════════════════════════════════════════════════
  //  LOOP PRINCIPAL
  // ════════════════════════════════════════════════════════════

  update(time, delta) {
    if (this.gameOver || this.pausado) return;

    if (this.ondaIniciada && !this.ondaConcluida) {
      for (const z of [...this.inimigos]) {
        if (!z || !z.active) continue;

        // Atualiza UI flutuante do boss
        if (z.tipo === 'boss') {
          z._hpFundo?.setPosition(z.x, z.y - 64);
          z._hpBar?.setPosition(z.x - 35, z.y - 64);
          z._label?.setPosition(z.x, z.y - 76);
        }

        // Chegou à base?
        if (z.x >= 730) { this.zumbiAtingeuBase(z); continue; }

        // Ataque corpo-a-corpo à torre
        this._verificarAtaqueTorre(z, delta);
      }

      this.atacarInimigos(delta);
      this._desenharArcosCooldown();
    }
  }
}
