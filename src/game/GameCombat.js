import { Math as PhaserMath } from 'phaser';
import { PERSONAGENS_CONFIG } from './gameConfig.js';

// Responsável por: ataque das torres, projéteis, passivas, arcos de cooldown

export class GameCombat {
  constructor(scene) { this.s = scene; }

  // ── Zumbi ataca torre corpo-a-corpo ────────────────────────────
  verificarAtaqueTorre(z, delta) {
    const s = this.s;
    if (!z || !z.active) return false;

    for (const slot of s.slots) {
      if (!slot.personagem || slot.hp <= 0) continue;
      const dist = PhaserMath.Distance.Between(z.x, z.y, slot.x, slot.y);
      if (dist <= 36) {
        z.body.setVelocityX(0);
        z.meleeTimer = (z.meleeTimer || 0) + delta / 1000;
        if (z.meleeTimer >= 1.0) {
          z.meleeTimer = 0;
          let danoRestante = z.dano;
          if (slot.personagemId === 'avatar' && slot.armor > 0) {
            const absorvido = Math.min(slot.armor, danoRestante);
            slot.armor -= absorvido;
            danoRestante -= absorvido;
          }
          if (danoRestante > 0) slot.hp -= danoRestante;
          if (slot.personagem?.active) {
            const cfg = slot.cfg || PERSONAGENS_CONFIG[slot.personagemId] || { cor: 0x888888 };
            slot.personagem.setFillStyle(0xffffff);
            s.time.delayedCall(80, () => { if (slot.personagem?.active) slot.personagem.setFillStyle(cfg.cor); });
          }
          s.slots_mgr.atualizarHPTorre(slot);
          if (slot.hp <= 0) { slot.hp = -999; this.destruirTorre(slot, z); }
        }
        return true;
      }
    }
    if (z.body && z.body.velocity.x === 0) z.body.setVelocityX(z._velocidade || 80);
    return false;
  }

  destruirTorre(slot, z) {
    const s = this.s;
    if (slot.personagem) s.tweens.add({ targets: slot.personagem, alpha: 0, scaleX: 2, scaleY: 2, duration: 350 });
    const ex = s.add.circle(slot.x, slot.y, 28, 0xff4444, 0.6).setDepth(10);
    s.tweens.add({ targets: ex, alpha: 0, scale: 2.5, duration: 450, onComplete: () => ex.destroy() });
    s.cameras.main.shake(120, 0.007);
    const cfg = slot.cfg || PERSONAGENS_CONFIG[slot.personagemId] || { nome: 'Aliado' };
    s.textoSlot.setText(cfg.nome + ' foi eliminado pelos infectados!');
    s.aliadosMortos.add(slot.personagemId);
    if (z?.body) z.body.setVelocityX(z._velocidade || 80);
    s.time.delayedCall(380, () => s.slots_mgr.removerDoSlot(slot));
  }

  // ── Torres atacam inimigos ─────────────────────────────────────
  atacar(delta) {
    const s = this.s;
    for (const slot of s.slots) {
      if (!slot.personagem || !slot.rangeCircle || slot.hp <= 0) continue;
      slot.cooldown = Math.max(0, slot.cooldown - delta / 1000);
      if (slot.cooldown > 0) continue;

      const cfg      = slot.cfg || PERSONAGENS_CONFIG[slot.personagemId] || { dano: 20 };
      let danoFinal  = cfg.dano + (s.upgrades.danoGlobal ? 5 : 0);
      if (slot.personagemId === 'vini' && s.upgrades.viniDano > 0)
        danoFinal = Math.round(danoFinal * (1 + s.upgrades.viniDano * 0.1));
      const cdBase   = 0.8 * (s.upgrades.cooldownMult > 0 ? 0.75 : 1.0);

      for (const z of s.inimigos) {
        if (!z || !z.active) continue;
        const dist = PhaserMath.Distance.Between(slot.x, slot.y, z.x, z.y);
        if (dist <= (slot.attackRange ?? s.attackRange)) {
          z.hp -= danoFinal;
          slot.cooldown = cdBase;
          this._projetil(slot.x, slot.y, z.x, z.y, cfg);

          // Daniel: knockback por chance
          if (slot.personagemId === 'daniel' && s.upgrades.danielKnockback > 0 && z.body) {
            if (Math.random() < s.upgrades.danielKnockback * 0.10) {
              z.body.setVelocityX(-120);
              s.time.delayedCall(500, () => { if (z?.active) z.body.setVelocityX(z._velocidade); });
              s.ui.floatingText(z.x, z.y - 10, '🔧', '#ffaa33');
            }
          }

          z.setFillStyle(0xffffff);
          s.time.delayedCall(100, () => {
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

          if (z.hp <= 0) s.waves.remover(z);
          break;
        }
      }
    }
  }

  _projetil(x1, y1, x2, y2, cfg) {
    const s   = this.s;
    const cor = cfg?.cor || 0xffff00;
    const shot = s.add.circle(x1, y1, 5, cor, 1).setDepth(8);
    s.tweens.add({ targets: shot, x: x2, y: y2, duration: 110, ease: 'Linear', onComplete: () => shot.destroy() });
    const flash = s.add.circle(x1, y1, 14, cor, 0.2).setDepth(7);
    s.tweens.add({ targets: flash, alpha: 0, scale: 1.8, duration: 110, onComplete: () => flash.destroy() });
  }

  // ── Arcos de cooldown visuais ──────────────────────────────────
  desenharArcos() {
    const s = this.s;
    s.graficoCooldown.clear();
    for (const slot of s.slots) {
      if (!slot.personagem || slot.hp <= 0 || slot.cooldown <= 0) continue;
      const ratio  = slot.cooldown / 0.8;
      const angFim = PhaserMath.DegToRad(-90 + ratio * 360);
      s.graficoCooldown.lineStyle(3, 0xffffff, 0.5);
      s.graficoCooldown.beginPath();
      s.graficoCooldown.arc(slot.x, slot.y, 28, PhaserMath.DegToRad(-90), angFim, false);
      s.graficoCooldown.strokePath();
    }
  }

  // ── Habilidades passivas periódicas ────────────────────────────
  habilidadesPassivas() {
    const s = this.s;
    if (s.gameOver || !s.ondaIniciada || s.ondaConcluida) return;

    // Helena: cura aliados em raio a cada 20s
    for (const slotHelena of s.slots) {
      if (slotHelena.personagemId !== 'helena' || slotHelena.hp <= 0) continue;
      const raio = 260 + s.upgrades.helenaCura * 70;
      for (const slot of s.slots) {
        if (slot === slotHelena || slot.hp <= 0 || slot.maxHp <= 0) continue;
        const dist = PhaserMath.Distance.Between(slotHelena.x, slotHelena.y, slot.x, slot.y);
        if (dist <= raio) {
          slot.hp = Math.min(slot.hp + 10, slot.maxHp);
          s.slots_mgr.atualizarHPTorre(slot);
          s.ui.floatingText(slot.x, slot.y - 20, '+10 HP', '#00ff88');
        }
      }
    }
  }
}
