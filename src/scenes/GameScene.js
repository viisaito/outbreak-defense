import { Scene, Math as PhaserMath } from 'phaser';
import { GameUI }     from '../game/GameUI.js';
import { GameSlots }  from '../game/GameSlots.js';
import { GameShop }   from '../game/GameShop.js';
import { GameWaves }  from '../game/GameWaves.js';
import { GameCombat } from '../game/GameCombat.js';

export class GameScene extends Scene {
  constructor() { super('GameScene'); }

  create() {
    // ── Estado da partida ──────────────────────────────────────
    // Lê dados salvos do registry (null quando é partida nova)
    const _ondaSalva     = this.registry.get('ondaAtual');
    const _spSalvo       = this.registry.get('spSalvo');
    const _baseHPSalvo   = this.registry.get('baseHPSalvo');
    const _baseMaxHPSalvo= this.registry.get('baseMaxHPSalvo');
    const _upgradesSalvos= this.registry.get('upgradesSalvos');
    const _avatarEscudo  = this.registry.get('avatarEscudo');
    const _slotsSalvos   = this.registry.get('slotsSalvos');
    // Limpa para não vazar em partidas futuras
    ['ondaAtual','spSalvo','baseHPSalvo','baseMaxHPSalvo',
     'upgradesSalvos','avatarEscudo','slotsSalvos'].forEach(k => this.registry.remove(k));

    this.baseMaxHP         = _baseMaxHPSalvo || 120;
    this.baseHP            = (_baseHPSalvo   != null) ? _baseHPSalvo : this.baseMaxHP;
    this.ondaAtual         = _ondaSalva      || 1;
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
    this.sp                = (_spSalvo       != null) ? _spSalvo       : 60;
    this.preparacao        = true;
    this.tempoPreparacao   = 15;
    this.ondaIniciada      = false;
    this.ondaConcluida     = false;
    this.attackRange       = 140;
    this.lojaAberta        = false;
    this.tutorialAtivo     = false;
    this.inimigos          = [];
    this.slots             = [];
    this.slotSelecionado   = null;
    this.aliadosMortos     = new Set();

    // ── Upgrades progressivos ──────────────────────────────────
    this.upgrades = {
      danoGlobal:      0,
      cooldownMult:    1.0,
      baseReforco:     0,
      viniDano:        0,
      helenaCura:      0,
      danielKnockback: 0,
      avatarHP:        0
    };
    this.avatarEscudoComprado = false;

    // ── Dados do jogador ───────────────────────────────────────
    this.aliados           = this.registry.get('aliados') || ['vini'];
    this.aliadoSelecionado = this.aliados[0];
    this.personagem        = this.registry.get('personagem') || { nome: 'Sobrevivente', genero: 'masc', cabeloIndex: 0, roupaIndex: 0 };

    // ── Mundo ──────────────────────────────────────────────────
    this.add.rectangle(400, 225, 800, 450, 0x1a1a2e);
    this.baseColor = 0x33cc33;
    this.base = this.add.rectangle(750, 225, 40, 450, this.baseColor);
    this.graficoCooldown = this.add.graphics().setDepth(6);

    // ── Módulos ────────────────────────────────────────────────
    this.ui        = new GameUI(this);
    this.slots_mgr = new GameSlots(this);
    this.shop      = new GameShop(this);
    this.waves     = new GameWaves(this);
    this.combat    = new GameCombat(this);

    // ── Construção da cena ─────────────────────────────────────
    const posicoes = [
      { x: 750, y: 90,  base: true },
      { x: 190, y: 140 },
      { x: 360, y: 310 },
      { x: 530, y: 180 }
    ];
    posicoes.forEach((pos, i) => this.slots_mgr.criarSlot(pos, i));

    this.ui.criarHUD();
    this.ui.criarIconesAliados();

    // Restaurar upgrades antes de posicionar torres (alguns afetam HP/armadura)
    if (_upgradesSalvos) {
      Object.assign(this.upgrades, _upgradesSalvos);
      this.avatarEscudoComprado = _avatarEscudo || false;
    }

    if (_slotsSalvos) {
      this.slots_mgr.restaurarSlots(_slotsSalvos);
    } else {
      this.slots_mgr.posicionarAvatarInicial();
    }

    this.atualizarCorDaBase();

    // ── Timers ─────────────────────────────────────────────────
    this.timerPreparacaoEvent = this.time.addEvent({
      delay: 1000, callback: this.waves.tick, callbackScope: this.waves,
      repeat: this.tempoPreparacao - 1
    });

    this.timerHabilidades = this.time.addEvent({
      delay: 10000, callback: this.combat.habilidadesPassivas,
      callbackScope: this.combat, loop: true
    });

    // Tutorial apenas na primeira jogada
    if (!localStorage.getItem('outbreak-tutorial-game'))
      this.time.delayedCall(800, () => this.ui.mostrarTutorial(0));
  }

  // ── HP da base ─────────────────────────────────────────────
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
    if (ratio <= 0.25)      this.textoHP.setColor('#ff4444');
    else if (ratio <= 0.5)  this.textoHP.setColor('#ffcc33');
    else                    this.textoHP.setColor('#ffffff');
  }

  piscarBaseHit() {
    const cor = this.baseColor;
    this.tweens.add({
      targets: this.base, alpha: 0.2, duration: 80, yoyo: true,
      onStart:    () => this.base.setFillStyle(0xffffff),
      onComplete: () => { this.base.setFillStyle(cor); this.base.setAlpha(1); }
    });
  }

  // ── Loop principal ─────────────────────────────────────────
  update(_, delta) {
    if (this.gameOver || this.pausado) return;

    if (this.ondaIniciada && !this.ondaConcluida) {
      for (const z of [...this.inimigos]) {
        if (!z || !z.active) continue;
        if (z.tipo === 'boss') {
          z._hpFundo?.setPosition(z.x, z.y - 64);
          z._hpBar?.setPosition(z.x - 35, z.y - 64);
          z._label?.setPosition(z.x, z.y - 76);
        }
        if (z.x >= 730) { this.waves.atingiuBase(z); continue; }
        this.combat.verificarAtaqueTorre(z, delta);
      }
      this.combat.atacar(delta);
      this.combat.desenharArcos();
    }
  }
}
