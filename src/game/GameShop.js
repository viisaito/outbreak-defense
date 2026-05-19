import { LOJA_ITENS } from './gameConfig.js';

// Responsável por: loja, upgrades progressivos

export class GameShop {
  constructor(scene) { this.s = scene; }

  abrir() {
    const s = this.s;
    if (s.lojaAberta) return;
    s.lojaAberta  = true;
    this._objs    = [];
    const OV_W = 580, OV_H = 350;

    this._objs.push(s.add.rectangle(400, 225, 800, 450, 0x000000, 0.75).setDepth(30));
    this._objs.push(s.add.rectangle(400, 228, OV_W, OV_H, 0x070e18).setStrokeStyle(2, 0x3dff6e).setDepth(31));
    this._objs.push(s.add.text(400, 63, '🛒  LOJA DE SUPRIMENTOS', { fontSize: '16px', color: '#3dff6e', letterSpacing: 3 }).setOrigin(0.5).setDepth(32));

    this._textoSP = s.add.text(400, 85, 'SP disponível: ' + s.sp, { fontSize: '12px', color: '#00ccff' }).setOrigin(0.5).setDepth(32);
    this._objs.push(this._textoSP);

    // Botão fechar — topo direito do painel
    const btnX = 400 + OV_W / 2 - 22;
    const btnFechar = s.add.rectangle(btnX, 63, 32, 32, 0x3a0a0a).setStrokeStyle(1, 0xff4444).setDepth(32).setInteractive({ useHandCursor: true });
    const btnFecharTxt = s.add.text(btnX, 63, '✕', { fontSize: '14px', color: '#ff4444' }).setOrigin(0.5).setDepth(33);
    btnFechar.on('pointerover', () => btnFechar.setFillStyle(0x5a1a1a));
    btnFechar.on('pointerout',  () => btnFechar.setFillStyle(0x3a0a0a));
    btnFechar.on('pointerup',   () => this.fechar());
    this._objs.push(btnFechar, btnFecharTxt);

    // Grid 2 colunas
    const colX  = [132, 402];
    const startY = 116;
    const linH   = 94;

    LOJA_ITENS.forEach((item, i) => {
      this._criarCard(item, colX[i % 2], startY + Math.floor(i / 2) * linH);
    });
  }

  _criarCard(item, cx, cy) {
    const s          = this.s;
    const nivelAtual = s.upgrades[item.id] ?? 0;
    const comprado   = nivelAtual >= item.maxNivel;
    const custo      = item.custos[nivelAtual] ?? 999;
    const podePagar  = s.sp >= custo && !comprado;

    const corBorda = comprado ? 0x3dff6e : (podePagar ? 0x334455 : 0x2a1a1a);
    const corFundo = comprado ? 0x0a1a0a : 0x0d1828;

    const card = s.add.rectangle(cx, cy, 250, 82, corFundo)
      .setStrokeStyle(1, corBorda).setDepth(32)
      .setInteractive({ useHandCursor: podePagar });
    this._objs.push(card);

    const nivelStr = item.maxNivel > 1 ? '  [Nv ' + nivelAtual + '/' + item.maxNivel + ']' : '';
    this._objs.push(s.add.text(cx, cy - 30, item.label + nivelStr, { fontSize: '11px', color: comprado ? '#3dff6e' : '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(33));
    this._objs.push(s.add.text(cx, cy - 12, item.descricao.split('\n')[0], { fontSize: '9px', color: '#7788aa', wordWrap: { width: 230 } }).setOrigin(0.5).setDepth(33));

    const custoTxt = s.add.text(cx, cy + 12, comprado ? '✔ Máximo' : custo + ' SP', {
      fontSize: '11px', color: comprado ? '#3dff6e' : (podePagar ? '#00ccff' : '#ff4444')
    }).setOrigin(0.5).setDepth(33);
    this._objs.push(custoTxt);

    if (item.maxNivel > 1 && !comprado) {
      const barW = 200;
      this._objs.push(s.add.rectangle(cx, cy + 28, barW, 5, 0x1a1a2a).setDepth(33));
      if (nivelAtual > 0)
        this._objs.push(s.add.rectangle(cx - barW / 2, cy + 28, Math.round(barW * nivelAtual / item.maxNivel), 5, 0x3dff6e).setOrigin(0, 0.5).setDepth(34));
    }

    if (!comprado) {
      card.on('pointerover', () => { if (podePagar) card.setFillStyle(0x152030); });
      card.on('pointerout',  () => { if (podePagar) card.setFillStyle(corFundo); });
      card.on('pointerup',   () => {
        if (!podePagar) return;
        s.sp -= custo;
        s.textoSP.setText('SP: ' + s.sp);
        this._aplicarUpgrade(item.id);
        this.fechar();
        this.abrir();
      });
    }
  }

  _aplicarUpgrade(id) {
    const s = this.s;
    switch (id) {
      case 'danoGlobal':
        s.upgrades.danoGlobal = 1; break;
      case 'cooldownMult':
        s.upgrades.cooldownMult = 0.75; break;
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
