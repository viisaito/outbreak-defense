import { TUTORIAL_PASSOS, PERSONAGENS_CONFIG } from './gameConfig.js';

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
    s.textoSlot  = s.add.text(16, 432, 'Selecione um aliado e clique num slot para posicionar', { fontSize: '12px', color: '#aaaacc' }).setDepth(10);

    // Botão LOJA
    s.btnLoja    = s.add.rectangle(640, 20, 96, 28, 0x1a3a1a).setStrokeStyle(1, 0x3dff6e).setDepth(10).setInteractive({ useHandCursor: true });
    s.btnLojaTxt = s.add.text(640, 20, '🛒 LOJA', { fontSize: '12px', color: '#3dff6e', letterSpacing: 2 }).setOrigin(0.5).setDepth(11);
    s.btnLoja.on('pointerover', () => s.btnLoja.setFillStyle(0x27ae60));
    s.btnLoja.on('pointerout',  () => s.btnLoja.setFillStyle(0x1a3a1a));
    s.btnLoja.on('pointerup',   () => { if (s.preparacao && !s.pausado) s.shop.abrir(); });

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
    const total  = s.aliados.length;
    const startX = 400 - ((total - 1) * 120) / 2;
    s._iconeBgs  = [];

    s.aliados.forEach((id, i) => {
      const cfg   = PERSONAGENS_CONFIG[id] || { nome: id, cor: 0x888888, custo: 20, dano: 20, hp: 80 };
      const cx    = startX + i * 120;
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
      bg.on('pointerdown', () => {
        if (s.lojaAberta || s.tutorialAtivo || s.pausado) return;
        if (s.aliadoSelecionado === id) {
          s.aliadoSelecionado = null;
          this.atualizarBordasAliados();
          if (s.slotSelecionado) { s.slotSelecionado.setFillStyle(0x444466); s.slotSelecionado = null; }
          s.textoSlot.setText('Seleção cancelada.');
          return;
        }
        s.aliadoSelecionado = id;
        this.atualizarBordasAliados();
        if (s.slotSelecionado) s.slots_mgr.colocarNoSlot();
        else s.textoSlot.setText(cfg.nome + ' selecionado — clique num slot para posicionar');
      });

      s._iconeBgs.push(bg);
    });
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

  // ── Tutorial ───────────────────────────────────────────────────
  mostrarTutorial(idx) {
    const s = this.s;
    if (idx >= TUTORIAL_PASSOS.length) {
      s.tutorialAtivo = false;
      localStorage.setItem('outbreak-tutorial-game', '1');
      return;
    }
    s.tutorialAtivo = true;
    const passo  = TUTORIAL_PASSOS[idx];
    const ultimo = idx === TUTORIAL_PASSOS.length - 1;
    const objs   = [];

    objs.push(s.add.rectangle(400, 225, 800, 450, 0x000000, 0.72).setDepth(60));
    objs.push(s.add.rectangle(400, 240, 500, 170, 0x0a1520).setStrokeStyle(2, 0x3dff6e).setDepth(61));
    objs.push(s.add.text(400, 172, passo.titulo, { fontSize: '16px', color: '#3dff6e', letterSpacing: 3, fontStyle: 'bold' }).setOrigin(0.5).setDepth(62));
    objs.push(s.add.text(400, 232, passo.texto, { fontSize: '13px', color: '#ccccdd', align: 'center', lineSpacing: 6 }).setOrigin(0.5).setDepth(62));
    objs.push(s.add.text(400, 300, (idx + 1) + ' / ' + TUTORIAL_PASSOS.length, { fontSize: '10px', color: '#555577' }).setOrigin(0.5).setDepth(62));

    const btnBg  = s.add.rectangle(400, 320, 160, 30, 0x1a4a2a).setStrokeStyle(1, 0x3dff6e).setDepth(62).setInteractive({ useHandCursor: true });
    const btnTxt = s.add.text(400, 320, ultimo ? 'COMEÇAR!' : 'PRÓXIMO →', { fontSize: '13px', color: '#3dff6e', letterSpacing: 2 }).setOrigin(0.5).setDepth(63);
    objs.push(btnBg, btnTxt);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x27ae60));
    btnBg.on('pointerout',  () => btnBg.setFillStyle(0x1a4a2a));
    btnBg.on('pointerup',   () => { objs.forEach(o => o.destroy()); this.mostrarTutorial(idx + 1); });
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
    objs.push(s.add.text(400, 110, '⏸  PAUSADO', { fontSize: '22px', color: '#ffffff', letterSpacing: 5 }).setOrigin(0.5).setDepth(81));
    objs.push(s.add.rectangle(400, 225, 260, 270, 0x0a1520).setStrokeStyle(2, 0x333355).setDepth(81));

    const opcoes = [
      { label: '💾  SALVAR',           acao: () => this.salvarJogo() },
      { label: '🔊  OPÇÕES (em breve)', acao: null },
      { label: '🗺  VOLTAR AO MAPA',   acao: null },
      { label: '🏠  MENU PRINCIPAL',   acao: () => { this.fecharPausa(objs); s.scene.start('MenuScene'); } },
      { label: '▶   RETOMAR',          acao: () => this.fecharPausa(objs) }
    ];

    opcoes.forEach((op, i) => {
      const cy  = 158 + i * 48;
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

  salvarJogo() {
    const s   = this.s;
    const slot = s.registry.get('slotAtual') || 1;
    const key  = 'outbreak-defense-save-' + slot;
    const raw  = localStorage.getItem(key);
    const save = raw ? JSON.parse(raw) : {};
    save.ondaAtual = s.ondaAtual;
    save.sp        = s.sp;
    save.baseHP    = s.baseHP;
    save.savedAt   = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    localStorage.setItem(key, JSON.stringify(save));
    this.floatingText(400, 220, '💾 Salvo!', '#3dff6e');
  }

  // ── Texto flutuante ────────────────────────────────────────────
  floatingText(x, y, msg, cor) {
    const t = this.s.add.text(x, y, msg, { fontSize: '13px', color: cor || '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(20);
    this.s.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 900, ease: 'Power1', onComplete: () => t.destroy() });
  }
}
