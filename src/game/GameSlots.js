import { Math as PhaserMath } from 'phaser';
import { PERSONAGENS_CONFIG, CORES_ROUPAS } from './gameConfig.js';

// Responsável por: criação de slots, posicionamento de personagens, HP de torres

export class GameSlots {
  constructor(scene) { this.s = scene; }

  criarSlot(pos, i) {
    const s    = this.s;
    const slot = s.add.rectangle(pos.x, pos.y, 52, 52, 0x444466)
      .setInteractive().setStrokeStyle(2, 0x8888aa).setDepth(1);

    slot.personagem   = null;
    slot.rangeCircle  = null;
    slot.aimIcon      = null;
    slot.cooldown     = 0;
    slot.hp           = 0;
    slot.maxHp        = 0;
    slot.armor        = 0;
    slot.maxArmor     = 0;
    slot.hpBarFundo   = null;
    slot.hpBar        = null;
    slot.armorBarFundo = null;
    slot.armorBar      = null;
    slot.personagemId = null;
    slot.isBaseSlot   = !!pos.base;

    s.add.text(pos.x, pos.y, slot.isBaseSlot ? 'B' : (i + 1).toString(), { fontSize: '16px', color: '#aaaacc' }).setOrigin(0.5).setDepth(5);

    slot.on('pointerover', () => {
      if (!slot.personagem && slot !== s.slotSelecionado) slot.setFillStyle(0x666688);
    });
    slot.on('pointerout', () => {
      if (slot !== s.slotSelecionado) slot.setFillStyle(slot.personagem ? 0x223388 : 0x444466);
    });
    slot.on('pointerdown', (pointer) => {
      if (s.lojaAberta || s.tutorialAtivo || s.pausado) return;

      if (slot.personagem) {
        // Clique/drag em slot ocupado: inicia drag; soltar sem mover abre painel
        s.ui._iniciarArrasteDeSlot(pointer, slot);
      } else {
        // Slot vazio: seleciona como alvo de posicionamento
        if (s.slotSelecionado === slot) {
          slot.setFillStyle(0x444466);
          s.slotSelecionado = null;
          s.textoSlot.setText('Seleção cancelada.');
          return;
        }
        if (s.slotSelecionado) s.slotSelecionado.setFillStyle(0x444466);
        s.slotSelecionado = slot;
        slot.setFillStyle(0x00cc66);
        const cfg = s.aliadoSelecionado === 'avatar'
          ? { nome: s.personagem.nome }
          : PERSONAGENS_CONFIG[s.aliadoSelecionado];
        s.textoSlot.setText('Slot selecionado — ' + (cfg ? cfg.nome + ' pronto para posicionar' : 'selecione um aliado'));
      }
    });

    s.slots.push(slot);
  }

  posicionarAvatarInicial() {
    const s = this.s;
    if (!s.personagem || s.slots.length === 0) return;
    const cfg = {
      nome: s.personagem.nome,
      cor: CORES_ROUPAS[s.personagem.roupaIndex] || 0x888888,
      custo: 20,
      dano: 22,
      hp: 100
    };
    const slot = s.slots[0];
    if (slot.personagem) return;
    this.posicionarNoSlot(slot, 'avatar', cfg);
    s.textoSlot.setText(cfg.nome + ' posicionado no slot B para a 1ª onda.');
  }

  colocarNoSlot() {
    const s = this.s;
    if (!s.slotSelecionado) { s.textoSlot.setText('Selecione um slot primeiro.'); return; }
    const slot = s.slotSelecionado;
    if (slot.personagem) { s.textoSlot.setText('Slot ocupado! Escolha outro.'); return; }

    const id = s.aliadoSelecionado;

    if (s.aliadosMortos.has(id)) {
      if (s.sp < 20) { s.textoSlot.setText('SP insuficiente para ressuscitar!'); return; }
      s.sp -= 20; s.textoSP.setText('SP: ' + s.sp); s.aliadosMortos.delete(id);
    }

    let cfg;
    if (id === 'avatar') {
      cfg = { nome: s.personagem.nome, cor: CORES_ROUPAS[s.personagem.roupaIndex] || 0x888888, custo: 20, dano: 22, hp: 100 };
    } else {
      cfg = { ...(PERSONAGENS_CONFIG[id] || { nome: id, cor: 0x888888, custo: 20, dano: 22, hp: 100 }) };
    }

    const slotAtual = s.slots.find(sl => sl.personagemId === id && sl.personagem);
    if (slotAtual === slot) { s.textoSlot.setText(cfg.nome + ' já está neste slot.'); return; }

    let hpPreservado = null;
    if (slotAtual) {
      if (s.sp < 20) { s.textoSlot.setText('SP insuficiente para mover!'); return; }
      s.sp -= 20; s.textoSP.setText('SP: ' + s.sp);
      hpPreservado = slotAtual.hp;
      this.removerDoSlot(slotAtual);
    }

    this.posicionarNoSlot(slot, id, cfg);
    if (hpPreservado !== null) {
      slot.hp = hpPreservado;
      this.atualizarHPTorre(slot);
    }
    s.slotSelecionado = null;
  }

  posicionarNoSlot(slot, id, cfg) {
    const s = this.s;
    const range       = (id === 'avatar' && slot.isBaseSlot) ? 760 : s.attackRange;
    slot.attackRange  = range;
    slot.personagem   = s.add.rectangle(slot.x, slot.y, 32, 32, cfg.cor).setDepth(2);
    slot.rangeCircle  = s.add.circle(slot.x, slot.y, range, 0x00ccff, 0.10).setDepth(-1);
    slot.aimIcon      = s.add.circle(slot.x, slot.y, 20, 0xffff00, 0.15).setStrokeStyle(2, 0xffff00, 0.8).setDepth(1);
    slot.hpBarFundo   = s.add.rectangle(slot.x, slot.y - 34, 44, 6, 0x222233).setDepth(3);
    slot.hpBar        = s.add.rectangle(slot.x - 22, slot.y - 34, 44, 6, cfg.cor).setOrigin(0, 0.5).setDepth(3);

    if (id === 'avatar' && (s.upgrades.avatarHP > 0 || s.avatarEscudoComprado)) {
      s.upgrades.avatarHP = Math.max(s.upgrades.avatarHP || 0, 1);
      slot.maxArmor     = s.upgrades.avatarHP * 20;
      slot.armor        = slot.maxArmor;
      slot.armorBarFundo = s.add.rectangle(slot.x, slot.y - 42, 44, 6, 0x112a42).setDepth(3);
      slot.armorBar      = s.add.rectangle(slot.x - 22, slot.y - 42, 44, 6, 0x3399ff).setOrigin(0, 0.5).setDepth(4);
    } else {
      slot.maxArmor     = 0;
      slot.armor        = 0;
      slot.armorBarFundo = null;
      slot.armorBar      = null;
    }

    if (id === 'helena') {
      const raio = 260 + s.upgrades.helenaCura * 70;
      slot.healCircle = s.add.circle(slot.x, slot.y, raio, 0x00ff88, 0.04).setStrokeStyle(2, 0x00ff88, 0.4).setDepth(0.5);
    } else {
      slot.healCircle = null;
    }

    slot.personagemId = id;
    slot.hp           = cfg.hp;
    slot.maxHp        = cfg.hp;
    slot.cooldown     = 0;
    slot.cfg          = cfg;
    slot.setFillStyle(0x223388);
    slot.setStrokeStyle(2, cfg.cor);
    s.textoSlot.setText(cfg.nome + ' posicionado no slot ' + (s.slots.indexOf(slot) + 1) + '!');
  }

  restaurarSlots(slotsSalvos) {
    const s = this.s;
    // Remove qualquer personagem já posicionado (ex: avatar inicial)
    s.slots.forEach(sl => { if (sl.personagem) this.removerDoSlot(sl); });

    slotsSalvos.forEach((dado, i) => {
      if (!dado?.id) return;
      const slot = s.slots[i];
      if (!slot) return;

      let cfg;
      if (dado.id === 'avatar') {
        cfg = {
          nome: s.personagem.nome,
          cor:  CORES_ROUPAS[s.personagem.roupaIndex] || 0x888888,
          custo: 20, dano: 22, hp: dado.maxHp || 100
        };
      } else {
        cfg = { ...(PERSONAGENS_CONFIG[dado.id] || { nome: dado.id, cor: 0x888888, custo: 20, dano: 22, hp: 80 }) };
        cfg.hp = dado.maxHp || cfg.hp;
      }

      this.posicionarNoSlot(slot, dado.id, cfg);
      // Restaura HP atual (pode ser menor que o máximo)
      slot.hp = dado.hp ?? cfg.hp;
      this.atualizarHPTorre(slot);
    });
  }

  removerDoSlot(slot) {
    ['personagem', 'rangeCircle', 'aimIcon', 'healCircle', 'hpBarFundo', 'hpBar', 'armorBarFundo', 'armorBar'].forEach(k => {
      if (slot[k]) { slot[k].destroy(); slot[k] = null; }
    });
    slot.hp = 0; slot.maxHp = 0; slot.armor = 0; slot.maxArmor = 0; slot.personagemId = null; slot.cooldown = 10;
    slot.setFillStyle(0x444466); slot.setStrokeStyle(2, 0x8888aa);
  }

  atualizarHPTorre(slot) {
    if (!slot.hpBar || slot.maxHp <= 0) return;
    const ratio = Math.max(0, slot.hp / slot.maxHp);
    slot.hpBar.setSize(Math.round(44 * ratio), 6);
    slot.hpBar.setFillStyle(ratio > 0.5 ? 0x33cc33 : ratio > 0.25 ? 0xffcc33 : 0xff4444);

    if (slot.armorBar) {
      const armorRatio = slot.maxArmor > 0 ? Math.max(0, slot.armor / slot.maxArmor) : 0;
      slot.armorBarFundo.setPosition(slot.x, slot.y - 42);
      slot.armorBar.setPosition(slot.x - 22, slot.y - 42);
      slot.armorBar.setSize(Math.round(44 * armorRatio), 6);
      slot.armorBar.setVisible(armorRatio > 0);
    }
  }
}
