import { TUTORIAL_PASSOS, PERSONAGENS_CONFIG, CORES_ROUPAS } from './gameConfig.js';

// Responsável por: HUD, tutorial, pausa, ícones de aliados, texto flutuante

export class GameUI {
  constructor(scene) { this.s = scene; }

  // ── HUD principal ──────────────────────────────────────────────
  criarHUD() {
    const s = this.s;

    s.add.text(16, 20, 'Base', { fontSize: '13px', color: '#aaaacc' }).setDepth(10);
    s.barraHPFundo = s.add.rectangle(58, 20, 170, 13, 0x333344).setOrigin(0, 0.5).setDepth(10);
    s.barraHP      = s.add.rectangle(58, 20, 170, 13, 0x33cc33).setOrigin(0, 0.5).setDepth(10);
    s.textoHP      = s.add.text(236, 13, s.baseHP + '/' + s.baseMaxHP, { fontSize: '12px', color: '#ffffff' }).setDepth(10);

    s.textoOnda  = s.add.text(16, 38, 'Onda: ' + s.ondaAtual + ' / ' + s.totalOndas, { fontSize: '16px', color: '#ffdd00' }).setDepth(10);
    s.textoSP    = s.add.text(16, 60, 'SP: ' + s.sp, { fontSize: '16px', color: '#00ccff' }).setDepth(10);
    s.textoTempo = s.add.text(16, 82, 'Preparação: 15 s', { fontSize: '16px', color: '#ffffff' }).setDepth(10);
    s.textoSlot  = s.add.text(16, 432, 'Selecione um aliado e arraste-o para um slot para posicionar', { fontSize: '12px', color: '#aaaacc' }).setDepth(10);

    // Dica sobre upgrades
    s.add.text(640, 20, 'Clique num aliado para melhorias', {
      fontSize: '9px', color: '#444466'
    }).setOrigin(0.5).setDepth(10);

    // Botão PAUSA
    const btnPausa = s.add.rectangle(756, 20, 64, 28, 0x1a1a3a).setStrokeStyle(1, 0x555577).setDepth(10).setInteractive({ useHandCursor: true });
    s.add.text(756, 20, '⏸ MENU', { fontSize: '11px', color: '#aaaacc', letterSpacing: 1 }).setOrigin(0.5).setDepth(11);
    btnPausa.on('pointerover', () => btnPausa.setFillStyle(0x2a2a5a));
    btnPausa.on('pointerout',  () => btnPausa.setFillStyle(0x1a1a3a));
    btnPausa.on('pointerup',   () => this.abrirPausa());
  }

  // ── Ícones de aliados ──────────────────────────────────────────
  criarIconesAliados() {
    const s      = this.s;
    const total  = s.aliados.length + 1;
    const startX = 400 - ((total - 1) * 120) / 2;
    s._iconeBgs  = [];
    if (!this._dragEventsReady) {
      s.input.on('pointermove', this._atualizarArraste, this);
      s.input.on('pointerup', this._finalizarArraste, this);
      this._dragEventsReady = true;
    }

    const playerCfg = {
      nome: s.personagem.nome,
      cor:  CORES_ROUPAS[s.personagem.roupaIndex] || 0x888888,
      custo: 0
    };
    const playerX = startX;
    const playerY = 405;
    const playerSel = s.aliadoSelecionado === 'avatar';

    const playerBg = s.add.rectangle(playerX, playerY, 102, 44, playerSel ? 0x0d1e30 : 0x1a1a2e)
      .setStrokeStyle(playerSel ? 2 : 1, playerSel ? playerCfg.cor : 0x333355)
      .setInteractive({ useHandCursor: true }).setDepth(10);

    s.add.rectangle(playerX - 33, playerY, 28, 28, playerCfg.cor).setDepth(11);
    s.add.text(playerX - 12, playerY - 11, 'VOCÊ', { fontSize: '12px', color: '#ffffff', fontStyle: 'bold' }).setDepth(11);
    s.add.text(playerX - 12, playerY + 7, 'JOGADOR', { fontSize: '10px', color: '#aaaacc' }).setDepth(11);

    playerBg._aliadoId = 'avatar';
    playerBg._cfg      = playerCfg;

    playerBg.on('pointerover', () => { if (s.aliadoSelecionado !== 'avatar') playerBg.setFillStyle(0x2a2a4a); });
    playerBg.on('pointerout',  () => { if (s.aliadoSelecionado !== 'avatar') playerBg.setFillStyle(0x1a1a2e); });
    playerBg.on('pointerdown', (pointer) => this._iniciarArraste(pointer, 'avatar', playerCfg, playerBg));

    s._iconeBgs.push(playerBg);

    s.aliados.forEach((id, i) => {
      const cfg   = PERSONAGENS_CONFIG[id] || { nome: id, cor: 0x888888, custo: 20, dano: 20, hp: 80 };
      const cx    = startX + (i + 1) * 120;
      const cy    = 405;
      const isSel = s.aliadoSelecionado === id;

      const bg = s.add.rectangle(cx, cy, 102, 44, isSel ? 0x0d1e30 : 0x1a1a2e)
        .setStrokeStyle(isSel ? 2 : 1, isSel ? cfg.cor : 0x333355)
        .setInteractive({ useHandCursor: true }).setDepth(10);

      s.add.rectangle(cx - 33, cy, 28, 28, cfg.cor).setDepth(11);
      s.add.text(cx - 12, cy - 9, cfg.nome, { fontSize: '12px', color: '#ffffff', fontStyle: 'bold' }).setDepth(11);
      s.add.text(cx - 12, cy + 5, cfg.custo + ' SP', { fontSize: '10px', color: '#aaaacc' }).setDepth(11);

      bg._aliadoId = id;
      bg._cfg      = cfg;

      bg.on('pointerover', () => { if (s.aliadoSelecionado !== id) bg.setFillStyle(0x2a2a4a); });
      bg.on('pointerout',  () => { if (s.aliadoSelecionado !== id) bg.setFillStyle(0x1a1a2e); });
      bg.on('pointerdown', (pointer) => this._iniciarArraste(pointer, id, cfg, bg));

      s._iconeBgs.push(bg);
    });
  }

  _iniciarArraste(pointer, id, cfg, bg) {
    const s = this.s;
    if (s.lojaAberta || s.tutorialAtivo || s.pausado) return;

    // Bloquear drag se já está posicionado no campo
    const jaNoSlot = s.slots.some(sl => sl.personagemId === id && sl.personagem);
    if (jaNoSlot) {
      s.textoSlot.setText((cfg.nome || id) + ' já está no campo — arraste diretamente do slot para mover.');
      return;
    }

    if (s.slotSelecionado) {
      s.slotSelecionado.setFillStyle(s.slotSelecionado.personagem ? 0x223388 : 0x444466);
      s.slotSelecionado = null;
    }

    s.aliadoSelecionado = id;
    this.atualizarBordasAliados();
    s.textoSlot.setText(cfg.nome + ' selecionado — arraste para um slot para posicionar');

    this._dragSource    = bg;
    this._dragId        = id;
    this._dragCfg       = cfg;
    this._dragHoverSlot = null;
    this._dragSlotOrigem = null;
    this._dragPreview   = s.add.container(pointer.x, pointer.y).setDepth(50);
    const previewBg   = s.add.rectangle(0, 0, 110, 40, 0x1a1a2e, 0.95).setStrokeStyle(2, cfg.cor);
    const previewText = s.add.text(0, 0, cfg.nome, { fontSize: '12px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this._dragPreview.add([previewBg, previewText]);
  }

  // ── Drag iniciado a partir de um slot ocupado ─────────────────
  _iniciarArrasteDeSlot(pointer, slot) {
    const s = this.s;
    if (s.lojaAberta || s.tutorialAtivo || s.pausado) return;
    const id  = slot.personagemId;
    const cfg = slot.cfg || PERSONAGENS_CONFIG[id] || { nome: id, cor: 0x888888 };
    this._dragSlotOrigem = slot;
    this._dragId         = id;
    this._dragCfg        = cfg;
    this._dragStartX     = pointer.x;
    this._dragStartY     = pointer.y;
    this._dragHoverSlot  = null;
    this._dragPreview    = null; // criado só após threshold de movimento
  }

  _atualizarArraste(pointer) {
    const s = this.s;

    // Drag pendente de slot: cria preview após mover > 8px
    if (this._dragSlotOrigem && !this._dragPreview) {
      const dx = pointer.x - this._dragStartX;
      const dy = pointer.y - this._dragStartY;
      if (Math.sqrt(dx * dx + dy * dy) > 8) {
        this._dragPreview = s.add.container(pointer.x, pointer.y).setDepth(50);
        const bg  = s.add.rectangle(0, 0, 110, 40, 0x1a1a2e, 0.95).setStrokeStyle(2, this._dragCfg.cor);
        const txt = s.add.text(0, 0, this._dragCfg.nome, { fontSize: '12px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        this._dragPreview.add([bg, txt]);
      } else {
        return;
      }
    }

    if (!this._dragPreview) return;
    this._dragPreview.setPosition(pointer.x, pointer.y);

    const slot = this._slotEmPointer(pointer);
    if (slot !== this._dragHoverSlot) {
      if (this._dragHoverSlot) this._dragHoverSlot.setFillStyle(this._dragHoverSlot.personagem ? 0x223388 : 0x444466);
      this._dragHoverSlot = slot;
      if (slot && slot !== this._dragSlotOrigem) {
        slot.setFillStyle(slot.personagem && slot.personagemId !== this._dragId ? 0xaa2222 : 0x00cc66);
      }
    }
  }

  _finalizarArraste(pointer) {
    const s = this.s;

    // Soltar sem mover = clique → abre shop de melhorias do personagem
    if (this._dragSlotOrigem && !this._dragPreview) {
      const slotOrigem = this._dragSlotOrigem;
      this._dragSlotOrigem = null;
      s.shop.abrir(slotOrigem.personagemId);
      return;
    }

    if (!this._dragPreview) return;

    const slot = this._slotEmPointer(pointer);

    // ── Drag originado de slot ocupado ──────────────────────────
    if (this._dragSlotOrigem) {
      const origem = this._dragSlotOrigem;
      if (slot && slot !== origem) {
        if (slot.personagem) {
          s.textoSlot.setText('Slot ocupado! Arraste para um slot livre.');
        } else {
          const CUSTO = 20;
          if (s.sp < CUSTO) {
            s.textoSlot.setText('SP insuficiente para mover! (custo: ' + CUSTO + ' SP)');
            this._cancelarArraste(false);
            return;
          }
          s.sp -= CUSTO;
          s.textoSP.setText('SP: ' + s.sp);
          const id = this._dragId, cfg = this._dragCfg;
          const hpPreservado = origem.hp;
          s.slots_mgr.removerDoSlot(origem);
          s.slots_mgr.posicionarNoSlot(slot, id, cfg);
          slot.hp = hpPreservado;
          s.slots_mgr.atualizarHPTorre(slot);
          s.textoSlot.setText(cfg.nome + ' movido! (-' + CUSTO + ' SP)');
        }
      } else if (!slot) {
        // Solto fora de todos os slots = remove
        s.slots_mgr.removerDoSlot(origem);
        s.textoSlot.setText('Personagem removido. Arraste da barra para reposicionar.');
      }
      // slot === origem: devolveu ao mesmo slot → cancela silenciosamente
      this._cancelarArraste(false);
      return;
    }

    // ── Drag originado do ícone inferior ────────────────────────
    if (slot) {
      if (slot.personagem && slot.personagemId !== this._dragId) {
        s.textoSlot.setText('Slot ocupado! Arraste para outro slot.');
        this._cancelarArraste(false);
        return;
      }
      if (s.slotSelecionado && s.slotSelecionado !== slot)
        s.slotSelecionado.setFillStyle(s.slotSelecionado.personagem ? 0x223388 : 0x444466);
      s.slotSelecionado = slot;
      s.slots_mgr.colocarNoSlot();
      this._cancelarArraste(true);
      return;
    }

    s.textoSlot.setText('Posicionamento cancelado. Arraste um aliado para um slot.');
    this._cancelarArraste(false);
  }

  _cancelarArraste(keepSelection) {
    const s = this.s;
    if (this._dragPreview) { this._dragPreview.destroy(); this._dragPreview = null; }
    if (this._dragHoverSlot) {
      this._dragHoverSlot.setFillStyle(this._dragHoverSlot.personagem ? 0x223388 : 0x444466);
      this._dragHoverSlot = null;
    }
    this._dragSlotOrigem = null;
    if (!keepSelection) { s.aliadoSelecionado = null; this.atualizarBordasAliados(); }
  }

  // ── Painel de habilidades do personagem no slot ───────────────
  mostrarPainelPersonagem(slot) {
    const s = this.s;
    if (!slot?.personagemId) return;
    const id  = slot.personagemId;
    const cfg = PERSONAGENS_CONFIG[id] || {};
    const nome    = id === 'avatar' ? s.personagem.nome : (cfg.nome || id);
    const funcao  = id === 'avatar' ? 'Sobrevivente'    : (cfg.funcao  || '');
    const passiva = id === 'avatar' ? 'Boost de dano\naos aliados próximos' : (cfg.passiva || '');
    const cor     = id === 'avatar'
      ? (CORES_ROUPAS[s.personagem?.roupaIndex] || 0x3dff6e)
      : (cfg.cor || 0x888888);

    const PW = 200, PH = 138;
    // Painel à direita do slot; se não couber, vai à esquerda
    const px = slot.x + 36 + PW / 2 > 790 ? slot.x - 36 - PW : slot.x + 36;
    let   py = Math.max(8, Math.min(slot.y - PH / 2, 450 - PH - 8));

    const objs = [];
    objs.push(s.add.rectangle(px + PW / 2, py + PH / 2, PW, PH, 0x060d18)
      .setStrokeStyle(2, cor).setDepth(70));

    objs.push(s.add.text(px + PW / 2, py + 14, nome, {
      fontSize: '13px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(71));

    if (funcao) objs.push(s.add.text(px + PW / 2, py + 28, funcao, {
      fontSize: '9px', color: '#7788aa'
    }).setOrigin(0.5).setDepth(71));

    objs.push(s.add.rectangle(px + PW / 2, py + 40, PW - 20, 1, 0x1a2a3a).setDepth(71));

    const hpRatio = slot.maxHp > 0 ? slot.hp / slot.maxHp : 0;
    const hpCor   = hpRatio > 0.5 ? '#33cc33' : hpRatio > 0.25 ? '#ffcc33' : '#ff4444';
    objs.push(s.add.text(px + 12, py + 50, '❤  ' + slot.hp + ' / ' + slot.maxHp, {
      fontSize: '10px', color: hpCor
    }).setDepth(71));

    if (passiva) objs.push(s.add.text(px + PW / 2, py + 82, passiva, {
      fontSize: '10px', color: '#aabbcc', align: 'center', lineSpacing: 4,
      wordWrap: { width: PW - 20 }
    }).setOrigin(0.5).setDepth(71));

    objs.push(s.add.text(px + PW / 2, py + PH - 10, 'arraste para mover ou remover', {
      fontSize: '8px', color: '#444466'
    }).setOrigin(0.5).setDepth(71));

    // Fundo invisível para fechar ao clicar fora
    const closer = s.add.rectangle(400, 225, 800, 450, 0x000000, 0).setDepth(69).setInteractive();
    closer.on('pointerdown', () => { objs.forEach(o => o.destroy()); closer.destroy(); });
    objs.push(closer);
  }

  _slotEmPointer(pointer) {
    const s = this.s;
    return s.slots.find(slot => slot.getBounds().contains(pointer.x, pointer.y));
  }

  atualizarBordasAliados() {
    const s = this.s;
    s._iconeBgs.forEach(bg => {
      const cfg = PERSONAGENS_CONFIG[bg._aliadoId] || { cor: 0x888888 };
      const sel = s.aliadoSelecionado === bg._aliadoId;
      bg.setStrokeStyle(sel ? 2 : 1, sel ? cfg.cor : 0x333355);
      bg.setFillStyle(sel ? 0x0d1e30 : 0x1a1a2e);
    });
  }

  // ── Tutorial com spotlight ─────────────────────────────────────
  mostrarTutorial(idx) {
    const s = this.s;
    if (idx >= TUTORIAL_PASSOS.length) {
      s.tutorialAtivo = false;
      localStorage.setItem('outbreak-tutorial-game', '1');

      // O timer consumiu seus repeats durante o tutorial — reinicia do zero
      if (s.timerPreparacaoEvent) { s.timerPreparacaoEvent.remove(false); }
      s.tempoPreparacao = 15;
      s.textoTempo.setText('Preparação: 15 s');
      s.timerPreparacaoEvent = s.time.addEvent({
        delay: 1000, callback: s.waves.tick, callbackScope: s.waves,
        repeat: s.tempoPreparacao - 1
      });
      return;
    }
    s.tutorialAtivo = true;
    const p      = TUTORIAL_PASSOS[idx];
    const ultimo = idx === TUTORIAL_PASSOS.length - 1;
    const objs   = [];
    const sp     = p.spot;
    const DIM    = 0.82;
    const W = 800, H = 450;

    // ── Spotlight: 4 painéis escuros ao redor do elemento ──────
    if (sp.y > 0)
      objs.push(s.add.rectangle(W/2, sp.y/2, W, sp.y, 0x000000, DIM).setDepth(60));
    const bY = sp.y + sp.h;
    if (bY < H)
      objs.push(s.add.rectangle(W/2, bY + (H-bY)/2, W, H-bY, 0x000000, DIM).setDepth(60));
    if (sp.x > 0)
      objs.push(s.add.rectangle(sp.x/2, sp.y + sp.h/2, sp.x, sp.h, 0x000000, DIM).setDepth(60));
    const rX = sp.x + sp.w;
    if (rX < W)
      objs.push(s.add.rectangle(rX + (W-rX)/2, sp.y + sp.h/2, W-rX, sp.h, 0x000000, DIM).setDepth(60));

    // Borda pulsante ao redor do spotlight
    const border = s.add.rectangle(sp.x + sp.w/2, sp.y + sp.h/2, sp.w, sp.h, 0x000000, 0)
      .setStrokeStyle(2, 0x3dff6e, 0.7).setDepth(61);
    objs.push(border);
    s.tweens.add({ targets: border, alpha: 0.25, duration: 650, yoyo: true, repeat: -1 });

    // ── Callout de texto ────────────────────────────────────────
    const CW = 238, CH = 154;
    const cx = p.cx, cy = p.cy;

    objs.push(s.add.rectangle(cx, cy, CW, CH, 0x050c16).setStrokeStyle(1, 0x2a5a2a).setDepth(62));

    objs.push(s.add.text(cx, cy - CH/2 + 15, p.titulo, {
      fontSize: '11px', color: '#3dff6e', letterSpacing: 3, fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(63));

    objs.push(s.add.rectangle(cx, cy - CH/2 + 25, CW - 20, 1, 0x0f2a12).setDepth(63));

    objs.push(s.add.text(cx, cy - 4, p.texto, {
      fontSize: '10px', color: '#9aabbc', align: 'center', lineSpacing: 5,
      wordWrap: { width: CW - 20 }
    }).setOrigin(0.5).setDepth(63));

    objs.push(s.add.text(cx - CW/2 + 10, cy + CH/2 - 14, (idx+1) + '/' + TUTORIAL_PASSOS.length, {
      fontSize: '9px', color: '#3a3a5a'
    }).setDepth(63));

    const btn = s.add.rectangle(cx + 32, cy + CH/2 - 14, 106, 21, 0x1a4a2a)
      .setStrokeStyle(1, 0x3dff6e).setDepth(63).setInteractive({ useHandCursor: true });
    const btnTxt = s.add.text(cx + 32, cy + CH/2 - 14, ultimo ? '▶  COMEÇAR' : 'PRÓXIMO →', {
      fontSize: '9px', color: '#3dff6e', letterSpacing: 1
    }).setOrigin(0.5).setDepth(64);
    objs.push(btn, btnTxt);

    btn.on('pointerover', () => btn.setFillStyle(0x27ae60));
    btn.on('pointerout',  () => btn.setFillStyle(0x1a4a2a));
    btn.on('pointerup',   () => { objs.forEach(o => o.destroy()); this.mostrarTutorial(idx + 1); });
  }

  // ── Pausa ──────────────────────────────────────────────────────
  abrirPausa() {
    const s = this.s;
    if (s.pausado) return;
    s.pausado = true;
    s.physics.pause();
    if (s.timerPreparacaoEvent) s.timerPreparacaoEvent.paused = true;
    s.timerHabilidades.paused = true;

    const objs = [];
    objs.push(s.add.rectangle(400, 225, 800, 450, 0x000000, 0.80).setDepth(80));
    objs.push(s.add.text(400, 96, '⏸  PAUSADO', { fontSize: '20px', color: '#ffffff', letterSpacing: 5 }).setOrigin(0.5).setDepth(81));
    // Caixa: 260×300, centralizada em y=238 → topo 88, base 388
    objs.push(s.add.rectangle(400, 238, 260, 300, 0x0a1520).setStrokeStyle(2, 0x333355).setDepth(81));

    const opcoes = [
      { label: '💾  SALVAR',           acao: () => this.abrirMenuSalvar() },
      { label: '🔊  OPÇÕES (em breve)', acao: null },
      { label: '🗺  VOLTAR AO MAPA',   acao: null },
      { label: '🏠  MENU PRINCIPAL',   acao: () => { this.fecharPausa(objs); s.scene.start('MenuScene'); } },
      { label: '▶   RETOMAR',          acao: () => this.fecharPausa(objs) }
    ];

    // 5 itens × 44px de espaço, iniciando em y=120 → 120,164,208,252,296,340 — todos dentro da caixa (88–388)
    opcoes.forEach((op, i) => {
      const cy  = 130 + i * 44;
      const bg  = s.add.rectangle(400, cy, 220, 36, 0x111128).setStrokeStyle(1, 0x2a2a4a).setDepth(82).setInteractive({ useHandCursor: !!op.acao });
      const txt = s.add.text(400, cy, op.label, { fontSize: '13px', color: op.acao ? '#ffffff' : '#444466', letterSpacing: 1 }).setOrigin(0.5).setDepth(83);
      if (op.acao) {
        bg.on('pointerover', () => { bg.setFillStyle(0x1e2240); txt.setStyle({ color: '#3dff6e' }); });
        bg.on('pointerout',  () => { bg.setFillStyle(0x111128); txt.setStyle({ color: '#ffffff' }); });
        bg.on('pointerup',   () => op.acao());
      }
      objs.push(bg, txt);
    });

    s._pausaObjs = objs;
  }

  fecharPausa(objs) {
    const s = this.s;
    (objs || s._pausaObjs || []).forEach(o => o.destroy());
    s._pausaObjs = null;
    s.pausado    = false;
    s.physics.resume();
    if (s.timerPreparacaoEvent) s.timerPreparacaoEvent.paused = false;
    s.timerHabilidades.paused = false;
  }

  // ── Salvar: seleção de slot ────────────────────────────────────
  abrirMenuSalvar() {
    const s    = this.s;
    const KEYS = ['outbreak-defense-save-1', 'outbreak-defense-save-2'];
    const saves = KEYS.map(k => { const r = localStorage.getItem(k); return r ? JSON.parse(r) : null; });

    const objs = [];
    objs.push(s.add.rectangle(400, 225, 800, 450, 0x000000, 0.55).setDepth(90));
    objs.push(s.add.rectangle(400, 225, 500, 310, 0x080e1c).setStrokeStyle(1, 0x2a2a4a).setDepth(90));

    objs.push(s.add.text(400, 95, 'SALVAR PARTIDA', {
      fontSize: '14px', color: '#ffffff', letterSpacing: 4
    }).setOrigin(0.5).setDepth(91));
    objs.push(s.add.text(400, 118, 'Escolha o slot onde deseja salvar:', {
      fontSize: '11px', color: '#555577'
    }).setOrigin(0.5).setDepth(91));
    objs.push(s.add.rectangle(400, 134, 440, 1, 0x1a1a3a).setDepth(91));

    const CARD_W = 440;
    const LEFT   = 400 - CARD_W / 2 + 18;
    const RIGHT  = 400 + CARD_W / 2 - 14;

    saves.forEach((save, i) => {
      const cy   = 186 + i * 96;
      const card = s.add.rectangle(400, cy, CARD_W, 80, 0x0d1220)
        .setStrokeStyle(1, 0x252545).setDepth(91).setInteractive({ useHandCursor: true });

      objs.push(s.add.text(LEFT, cy - 30, 'SLOT ' + (i + 1), {
        fontSize: '9px', color: '#3dff6e', letterSpacing: 3
      }).setDepth(92));

      if (save) {
        objs.push(s.add.text(LEFT, cy - 14, save.nome || 'Sobrevivente', {
          fontSize: '14px', color: '#ffffff', fontStyle: 'bold'
        }).setDepth(92));
        const aliados = (save.aliados || []).join(', ');
        if (aliados) objs.push(s.add.text(LEFT, cy + 6, 'Aliados: ' + aliados, {
          fontSize: '10px', color: '#00ccff'
        }).setDepth(92));
        const generoTxt = save.genero === 'fem' ? 'Feminino' : 'Masculino';
        const ondaTxt   = save.ondaAtual ? '  •  Onda ' + save.ondaAtual : '';
        objs.push(s.add.text(LEFT, cy + 22, (save.savedAt || '') + '  •  ' + generoTxt + ondaTxt, {
          fontSize: '10px', color: '#444466'
        }).setDepth(92));
        const aviso = s.add.text(RIGHT, cy, '⚠  sobrescrever', {
          fontSize: '10px', color: '#7a3311'
        }).setOrigin(1, 0.5).setDepth(92);
        objs.push(aviso);
        card.on('pointerover', () => { card.setStrokeStyle(1, 0xff6633); card.setFillStyle(0x1e0e08); aviso.setStyle({ color: '#ff6633' }); });
        card.on('pointerout',  () => { card.setStrokeStyle(1, 0x252545); card.setFillStyle(0x0d1220); aviso.setStyle({ color: '#7a3311' }); });
      } else {
        objs.push(s.add.text(LEFT, cy - 2, '— slot vazio —', {
          fontSize: '12px', color: '#333355'
        }).setDepth(92));
        card.on('pointerover', () => { card.setStrokeStyle(1, 0x3dff6e); card.setFillStyle(0x0a1a0a); });
        card.on('pointerout',  () => { card.setStrokeStyle(1, 0x252545); card.setFillStyle(0x0d1220); });
      }

      card.on('pointerup', () => { objs.forEach(o => o.destroy()); this._confirmarSalvar(i + 1); });
      objs.push(card);
    });

    const cancelar = s.add.text(400, 360, 'CANCELAR', {
      fontSize: '12px', color: '#444466', letterSpacing: 3
    }).setOrigin(0.5).setDepth(91).setInteractive({ useHandCursor: true });
    cancelar.on('pointerover', () => cancelar.setStyle({ color: '#aaaacc' }));
    cancelar.on('pointerout',  () => cancelar.setStyle({ color: '#444466' }));
    cancelar.on('pointerup',   () => objs.forEach(o => o.destroy()));
    objs.push(cancelar);
  }

  _confirmarSalvar(slot) {
    const s   = this.s;
    const key = 'outbreak-defense-save-' + slot;
    const raw = localStorage.getItem(key);
    const save = raw ? JSON.parse(raw) : {};
    Object.assign(save, {
      nome:       s.personagem?.nome   || save.nome,
      genero:     s.personagem?.genero || save.genero,
      aliados:    s.aliados            || save.aliados,
      ondaAtual:  s.ondaAtual,
      sp:         s.sp,
      baseHP:     s.baseHP,
      baseMaxHP:  s.baseMaxHP,
      upgrades:   { ...s.upgrades },
      avatarEscudo: s.avatarEscudoComprado || false,
      // posição de cada slot: id do personagem ou null
      slots: s.slots.map(sl => sl.personagemId
        ? { id: sl.personagemId, hp: sl.hp, maxHp: sl.maxHp }
        : null
      ),
      savedAt: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    });
    localStorage.setItem(key, JSON.stringify(save));
    s.registry.set('slotAtual', slot);
    this.floatingText(400, 225, '💾 Slot ' + slot + ' salvo!', '#3dff6e');
  }

  // ── Texto flutuante ────────────────────────────────────────────
  floatingText(x, y, msg, cor) {
    const t = this.s.add.text(x, y, msg, { fontSize: '13px', color: cor || '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
    this.s.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 900, ease: 'Power1', onComplete: () => t.destroy() });
  }
}
