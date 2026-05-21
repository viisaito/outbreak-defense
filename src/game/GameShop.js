import { LOJA_ITENS, PERSONAGENS_CONFIG, CORES_ROUPAS } from './gameConfig.js';

// Responsável por: loja, upgrades progressivos

export class GameShop {
  constructor(scene) { this.s = scene; }

  abrir(personagemId) {
    const s = this.s;
    if (s.lojaAberta || s.pausado) return;
    s.lojaAberta = true;
    this._personagemAtual = personagemId;
    this._objs = [];

    const itens   = LOJA_ITENS.filter(i => i.personagem === personagemId);
    const cfg     = PERSONAGENS_CONFIG[personagemId] || {};
    const slot    = s.slots.find(sl => sl.personagemId === personagemId);
    const isBase  = personagemId === 'base';
    const isAvatar = personagemId === 'avatar';

    const nome   = isBase   ? 'Base'
                 : isAvatar ? (s.personagem?.nome || 'Sobrevivente')
                 :            (cfg.nome || personagemId);
    const funcao = isBase   ? 'Estrutura de defesa'
                 : isAvatar ? 'Sobrevivente'
                 :            (cfg.funcao || '');
    const passiva = isBase   ? 'Resiste aos ataques\ndos infectados'
                  : isAvatar ? 'Boost de dano\naos aliados próximos'
                  :            (cfg.passiva || '');
    const cor    = isBase   ? 0x33cc33
                 : isAvatar ? (CORES_ROUPAS[s.personagem?.roupaIndex] || 0x3dff6e)
                 :            (cfg.cor || 0x888888);

    // Dano atual com upgrades aplicados
    let danoFinal = 0;
    if (slot?.cfg) {
      danoFinal = (slot.cfg.dano || 0) + (s.upgrades.danoGlobal ? 5 : 0);
      if (personagemId === 'vini' && s.upgrades.viniDano > 0)
        danoFinal = Math.round(danoFinal * (1 + s.upgrades.viniDano * 0.1));
    }

    const tituloLabel = isAvatar ? nome.toUpperCase()
      : { vini: 'VINI CARVALHO', helena: 'HELENA MARIA', daniel: 'DANIEL FERNANDES', base: 'BASE' }[personagemId] || nome.toUpperCase();

    const OV_W  = 420;
    const CARD_H = 84;
    const HDR    = 68;
    const STATS_H = 78;
    const OV_H   = Math.min(420, HDR + STATS_H + 14 + itens.length * (CARD_H + 6) + 18);
    const top    = Math.max(10, 225 - OV_H / 2);

    // Fundo
    this._objs.push(s.add.rectangle(400, 225, 800, 450, 0x000000, 0.72).setDepth(30));
    this._objs.push(s.add.rectangle(400, top + OV_H / 2, OV_W, OV_H, 0x070e18).setStrokeStyle(2, 0x3dff6e).setDepth(31));

    // Cabeçalho
    this._objs.push(s.add.text(400, top + 18, tituloLabel + ' — MELHORIAS', {
      fontSize: '13px', color: '#3dff6e', letterSpacing: 3
    }).setOrigin(0.5).setDepth(32));

    this._textoSP = s.add.text(400, top + 36, 'SP disponível: ' + s.sp, {
      fontSize: '11px', color: '#00ccff'
    }).setOrigin(0.5).setDepth(32);
    this._objs.push(this._textoSP);

    this._objs.push(s.add.rectangle(400, top + 52, OV_W - 20, 1, 0x1a2a3a).setDepth(32));

    // Botão fechar
    const bx = 400 + OV_W / 2 - 18;
    const btnF = s.add.rectangle(bx, top + 18, 26, 26, 0x3a0a0a).setStrokeStyle(1, 0xff4444).setDepth(32).setInteractive({ useHandCursor: true });
    const btnT = s.add.text(bx, top + 18, '✕', { fontSize: '11px', color: '#ff4444' }).setOrigin(0.5).setDepth(33);
    btnF.on('pointerover', () => btnF.setFillStyle(0x5a1a1a));
    btnF.on('pointerout',  () => btnF.setFillStyle(0x3a0a0a));
    btnF.on('pointerup',   () => this.fechar());
    this._objs.push(btnF, btnT);

    // ── Seção de stats ────────────────────────────────────────────
    const statsY = top + HDR + STATS_H / 2;
    const portX  = 400 - OV_W / 2 + 36;
    const statsX = portX + 50;

    // Portrait
    this._objs.push(s.add.circle(portX, statsY, 22, cor).setDepth(32));
    this._objs.push(s.add.text(portX, statsY, (nome[0] || '?').toUpperCase(), {
      fontSize: '18px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(33));

    if (funcao) this._objs.push(s.add.text(portX, statsY + 28, funcao, {
      fontSize: '8px', color: '#555577', align: 'center'
    }).setOrigin(0.5).setDepth(33));

    // HP + Dano
    if (isBase) {
      const hpRatio = s.baseHP / s.baseMaxHP;
      const hpCor = hpRatio > 0.5 ? '#33cc33' : hpRatio > 0.25 ? '#ffcc33' : '#ff4444';
      this._objs.push(s.add.text(statsX, statsY - 24, '❤  Base HP: ' + s.baseHP + ' / ' + s.baseMaxHP, {
        fontSize: '11px', color: hpCor
      }).setDepth(33));
    } else if (slot) {
      const hpRatio = slot.maxHp > 0 ? slot.hp / slot.maxHp : 0;
      const hpCor   = hpRatio > 0.5 ? '#33cc33' : hpRatio > 0.25 ? '#ffcc33' : '#ff4444';
      this._objs.push(s.add.text(statsX, statsY - 28, '❤  HP: ' + slot.hp + ' / ' + slot.maxHp, {
        fontSize: '11px', color: hpCor
      }).setDepth(33));
      if (danoFinal > 0) this._objs.push(s.add.text(statsX, statsY - 12, '⚔  Dano: ' + danoFinal, {
        fontSize: '11px', color: '#ffaa44'
      }).setDepth(33));
    }

    // Passiva
    if (passiva) this._objs.push(s.add.text(statsX, statsY + 8, passiva, {
      fontSize: '9px', color: '#7788aa', lineSpacing: 3
    }).setDepth(33));

    // Separador
    this._objs.push(s.add.rectangle(400, top + HDR + STATS_H + 7, OV_W - 20, 1, 0x1a2a3a).setDepth(32));

    // ── Cards de upgrade ─────────────────────────────────────────
    itens.forEach((item, i) => {
      const cy = top + HDR + STATS_H + 16 + i * (CARD_H + 6) + CARD_H / 2;
      this._criarCard(item, 400, cy, OV_W - 30);
    });

    if (itens.length === 0) {
      this._objs.push(s.add.text(400, top + HDR + STATS_H + 40, 'Nenhuma melhoria disponível.', {
        fontSize: '12px', color: '#555577'
      }).setOrigin(0.5).setDepth(32));
    }
  }

  _criarCard(item, cx, cy, cardW = 380) {
    const s          = this.s;
    const nivelAtual = s.upgrades[item.id] ?? 0;
    const comprado   = nivelAtual >= item.maxNivel;
    const custo      = item.custos[nivelAtual] ?? 999;
    const podePagar  = s.sp >= custo && !comprado;
    const CARD_H     = 84;
    const left       = cx - cardW / 2 + 12;

    const corBorda = comprado ? 0x3dff6e : (podePagar ? 0x334455 : 0x2a1a1a);
    const corFundo = comprado ? 0x0a1a0a : 0x0d1828;

    const card = s.add.rectangle(cx, cy, cardW, CARD_H, corFundo)
      .setStrokeStyle(1, corBorda).setDepth(32)
      .setInteractive({ useHandCursor: podePagar });
    this._objs.push(card);

    // Label + nível
    const nivelStr = item.maxNivel > 1 ? '  [Nv ' + nivelAtual + '/' + item.maxNivel + ']' : '';
    this._objs.push(s.add.text(left, cy - 30, item.label + nivelStr, {
      fontSize: '11px', color: comprado ? '#3dff6e' : '#ffffff', fontStyle: 'bold'
    }).setDepth(33));

    // Descrição (2 linhas)
    this._objs.push(s.add.text(left, cy - 14, item.descricao, {
      fontSize: '9px', color: '#7788aa', lineSpacing: 3
    }).setDepth(33));

    // Custo (direita)
    const custoX = cx + cardW / 2 - 12;
    this._objs.push(s.add.text(custoX, cy - 10, comprado ? '✔ Máx' : custo + ' SP', {
      fontSize: '11px', color: comprado ? '#3dff6e' : (podePagar ? '#00ccff' : '#ff4444')
    }).setOrigin(1, 0.5).setDepth(33));

    // Barra de progresso de nível
    if (item.maxNivel > 1) {
      const barW = cardW - 24;
      this._objs.push(s.add.rectangle(cx, cy + 30, barW, 5, 0x1a1a2a).setDepth(33));
      if (nivelAtual > 0)
        this._objs.push(s.add.rectangle(cx - barW / 2, cy + 30, Math.round(barW * nivelAtual / item.maxNivel), 5, 0x3dff6e).setOrigin(0, 0.5).setDepth(34));
    }

    if (!comprado) {
      card.on('pointerover', () => { if (podePagar) card.setFillStyle(0x152030); });
      card.on('pointerout',  () => { if (podePagar) card.setFillStyle(corFundo); });
      card.on('pointerup',   () => {
        if (!podePagar) return;
        s.sp -= custo;
        s.textoSP.setText('SP: ' + s.sp);
        this._aplicarUpgrade(item.id);
        const per = item.personagem;
        this.fechar();
        this.abrir(per);
      });
    }
  }

  _aplicarUpgrade(id) {
    const s = this.s;
    switch (id) {
      case 'danoGlobal':
        s.upgrades.danoGlobal = 1; break;
      case 'cooldownMult':
        s.upgrades.cooldownMult = 1; break;
      case 'baseReforco':
        s.upgrades.baseReforco = 1;
        s.baseMaxHP += 20;
        s.baseHP = Math.min(s.baseHP + 20, s.baseMaxHP);
        s.atualizarCorDaBase();
        break;
      case 'viniDano':
        s.upgrades.viniDano = Math.min((s.upgrades.viniDano || 0) + 1, 3); break;
      case 'helenaCura':
        s.upgrades.helenaCura = Math.min((s.upgrades.helenaCura || 0) + 1, 2); break;
      case 'danielKnockback':
        s.upgrades.danielKnockback = Math.min((s.upgrades.danielKnockback || 0) + 1, 3); break;
      case 'avatarHP':
        s.upgrades.avatarHP = Math.max(s.upgrades.avatarHP || 0, 1);
        s.avatarEscudoComprado = true;
        const avatarSlot = s.slots.find(sl => sl.personagemId === 'avatar');
        if (avatarSlot) {
          avatarSlot.maxArmor = s.upgrades.avatarHP * 20;
          avatarSlot.armor = avatarSlot.maxArmor;
          if (!avatarSlot.armorBar) {
            avatarSlot.armorBarFundo = s.add.rectangle(avatarSlot.x, avatarSlot.y - 42, 44, 6, 0x112a42).setDepth(3);
            avatarSlot.armorBar = s.add.rectangle(avatarSlot.x - 22, avatarSlot.y - 42, 44, 6, 0x3399ff).setOrigin(0, 0.5).setDepth(4);
          }
          s.slots_mgr.atualizarHPTorre(avatarSlot);
        }
        break;
    }
    s.ui.floatingText(400, 200, '✔ Upgrade comprado!', '#3dff6e');
  }

  fechar() {
    const s = this.s;
    if (!s.lojaAberta) return;
    s.lojaAberta = false;
    (this._objs || []).forEach(o => o.destroy());
    this._objs = [];
  }
}
