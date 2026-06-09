import { Math as PhaserMath } from 'phaser';

// Responsável por: spawn de inimigos, controle de ondas, fim de onda, próxima onda

export class GameWaves {
  constructor(scene) { this.s = scene; }

  // ── Timer de preparação ────────────────────────────────────────
  tick() {
    const s = this.s;
    if (!s.preparacao || s.pausado || s.tutorialAtivo) return;
    s.tempoPreparacao -= 1;
    s.textoTempo.setText('Preparação: ' + s.tempoPreparacao + ' s');
    if (s.tempoPreparacao <= 0 && !s.ondaIniciada) this.iniciar();
  }

  // ── Iniciar onda ───────────────────────────────────────────────
  iniciar() {
    const s = this.s;
    if (s.ondaIniciada) return;
    s.ondaIniciada  = true;
    s.ondaConcluida = false;
    s.preparacao    = false;

    if (s.timerPreparacaoEvent) { s.timerPreparacaoEvent.remove(false); s.timerPreparacaoEvent = null; }
    s.shop.fechar();
    s.textoTempo.setText('Onda ' + s.ondaAtual + ' em curso!');

    const config       = s.configOndas[s.ondaAtual - 1];
    const totalNormais = config.zumbis + config.caes;
    s.totalInimigosOnda = totalNormais + (config.boss ? 1 : 0);
    s.spawnados  = 0;
    s.eliminados = 0;

    this.spawnZumbi();
    if (totalNormais > 1) {
      s.time.addEvent({ delay: 2000, repeat: totalNormais - 2, callback: this.spawnZumbi, callbackScope: this });
    }
    if (config.boss) {
      s.bossSpawnEvent = s.time.delayedCall(totalNormais * 2000 + 2500, this.spawnBoss, [], this);
    } else {
      s.bossSpawnEvent = null;
    }
  }

  // ── Spawn ──────────────────────────────────────────────────────
  spawnZumbi() {
    const s      = this.s;
    const config = s.configOndas[s.ondaAtual - 1];
    const tipo   = s.spawnados < config.zumbis ? 'zumbi' : 'cao';
    s.spawnados++;
    s.textoOnda.setText('Onda: ' + s.ondaAtual + ' -- ' + s.eliminados + '/' + s.totalInimigosOnda);

    let hp, vel, cor, larg, alt, dano;
    if (tipo === 'zumbi') { hp = 100; vel = 80;  cor = 0xff0000; larg = 32; alt = 48; dano = 40; }
    else                  { hp = 60;  vel = 150; cor = 0x880000; larg = 24; alt = 24; dano = 20; }

    const z = s.add.rectangle(30, PhaserMath.Between(50, 400), larg, alt, cor);
    s.physics.add.existing(z);
    z.body.setVelocityX(vel);
    z.hp = hp; z.dano = dano; z.tipo = tipo; z._velocidade = vel; z.meleeTimer = 0;
    s.inimigos.push(z);
  }

  spawnBoss() {
    const s = this.s;
    if (s.gameOver || s.ondaConcluida || !s.ondaIniciada) return;
    s.bossSpawnEvent = null;
    s.cameras.main.flash(400, 180, 0, 0);
    s.cameras.main.shake(250, 0.012);

    const aviso = s.add.text(400, 200, '⚠  ZUMBI CHEFE  ⚠', { fontSize: '22px', color: '#ff2200', fontStyle: 'bold', letterSpacing: 4 }).setOrigin(0.5).setDepth(30).setAlpha(0);
    s.tweens.add({ targets: aviso, alpha: 1, duration: 200, yoyo: true, hold: 1200, onComplete: () => aviso.destroy() });
    s.textoSlot.setText('⚠ ZUMBI CHEFE apareceu! Concentre o fogo!');

    const z = s.add.rectangle(30, 225, 64, 96, 0x880044).setDepth(3);
    s.physics.add.existing(z);
    z.body.setVelocityX(45);
    z.hp = 400; z.maxHp = 400; z.dano = 60; z.tipo = 'boss'; z._velocidade = 45; z.meleeTimer = 0;
    z._hpFundo = s.add.rectangle(30, 225 - 64, 70, 8, 0x222233).setDepth(4);
    z._hpBar   = s.add.rectangle(30 - 35, 225 - 64, 70, 8, 0xff4400).setOrigin(0, 0.5).setDepth(4);
    z._label   = s.add.text(30, 225 - 76, 'CHEFE', { fontSize: '10px', color: '#ff4444', fontStyle: 'bold', letterSpacing: 2 }).setOrigin(0.5).setDepth(5);
    s.inimigos.push(z);
  }

  // ── Remover inimigo ────────────────────────────────────────────
  remover(z) {
    const s = this.s;
    if (!z || !z.active) return;

    const recompensa = z.tipo === 'boss' ? 30 : z.tipo === 'zumbi' ? 5 : 3;
    s.sp += recompensa;
    s.textoSP.setText('SP: ' + s.sp);
    s.ui.floatingText(z.x, z.y, '+' + recompensa + ' SP', '#00ccff');

    if (z.tipo === 'boss') {
      s.cameras.main.shake(500, 0.022);
      s.cameras.main.flash(300, 255, 80, 0);
      s.ui.floatingText(z.x, z.y - 30, 'CHEFE ELIMINADO!', '#ff4444');
    }

    this._limparUIInimigo(z);
    z.destroy();
    const idx = s.inimigos.indexOf(z);
    if (idx !== -1) s.inimigos.splice(idx, 1);
    s.eliminados++;
    s.textoOnda.setText('Onda: ' + s.ondaAtual + ' -- ' + s.eliminados + '/' + s.totalInimigosOnda);

    if (s.ondaConcluida) return;
    const config = s.configOndas[s.ondaAtual - 1];
    if (config?.boss && s.bossSpawnEvent) return;
    if (s.eliminados >= s.totalInimigosOnda && s.inimigos.length === 0) this.verificarFim();
  }

  atingiuBase(z) {
    const s = this.s;
    this._limparUIInimigo(z);
    z.destroy();
    const idx = s.inimigos.indexOf(z);
    if (idx !== -1) s.inimigos.splice(idx, 1);
    s.eliminados++;
    s.inimigosDanaram++;

    s.cameras.main.shake(200, 0.01);
    s.baseHP -= z.dano;
    s.atualizarCorDaBase();
    s.piscarBaseHit();
    s.textoOnda.setText('Onda: ' + s.ondaAtual + ' -- ' + s.eliminados + '/' + s.totalInimigosOnda);

    if (s.baseHP <= 0) {
      s.gameOver = true;
      s.scene.start('GameOverScene', { onda: s.ondaAtual, eliminados: s.eliminados, hp: 0 });
      return;
    }
    const config = s.configOndas[s.ondaAtual - 1];
    if (config?.boss && s.bossSpawnEvent) return;
    if (!s.ondaConcluida && s.eliminados >= s.totalInimigosOnda && s.inimigos.length === 0) this.verificarFim();
  }

  _limparUIInimigo(z) {
    if (z._hpFundo) { z._hpFundo.destroy(); z._hpFundo = null; }
    if (z._hpBar)   { z._hpBar.destroy();   z._hpBar   = null; }
    if (z._label)   { z._label.destroy();   z._label   = null; }
  }

  // ── Fim de onda ────────────────────────────────────────────────
  verificarFim() {
    const s = this.s;
    if (s.ondaConcluida) return;
    s.ondaConcluida = true;
    if (s.bossSpawnEvent) { s.bossSpawnEvent.remove(false); s.bossSpawnEvent = null; }

    if (s.ondaAtual === s.totalOndas) {
      s.time.delayedCall(1500, () => s.scene.start('VictoryScene', { onda: s.ondaAtual, danados: s.inimigosDanaram, sp: s.sp, eliminados: s.eliminados }));
    } else {
      s.time.delayedCall(1200, () => this.painelProximaOnda());
    }
  }

  painelProximaOnda() {
    const s    = this.s;
    const objs = [];

    objs.push(s.add.rectangle(400, 225, 800, 450, 0x000000, 0.65).setDepth(40));
    objs.push(s.add.text(400, 185, 'ONDA ' + s.ondaAtual + ' CONCLUÍDA', { fontSize: '20px', color: '#3dff6e', letterSpacing: 4, fontStyle: 'bold' }).setOrigin(0.5).setDepth(41));
    objs.push(s.add.text(400, 218, 'Inimigos que passaram: ' + s.inimigosDanaram, { fontSize: '13px', color: '#aaaacc' }).setOrigin(0.5).setDepth(41));
    objs.push(s.add.text(400, 240, 'SP acumulado: ' + s.sp, { fontSize: '13px', color: '#00ccff' }).setOrigin(0.5).setDepth(41));

    const btn    = s.add.rectangle(400, 290, 200, 38, 0x1a4a2a).setStrokeStyle(2, 0x3dff6e).setDepth(41).setInteractive({ useHandCursor: true });
    const btnTxt = s.add.text(400, 290, 'PRÓXIMA ONDA →', { fontSize: '14px', color: '#3dff6e', letterSpacing: 3 }).setOrigin(0.5).setDepth(42);
    btn.on('pointerover', () => btn.setFillStyle(0x27ae60));
    btn.on('pointerout',  () => btn.setFillStyle(0x1a4a2a));
    btn.on('pointerup',   () => { objs.forEach(o => o.destroy()); this.proximaOnda(); });
    objs.push(btn, btnTxt);
  }

  proximaOnda() {
    const s = this.s;
    s.ondaAtual++;
    s.ondaIniciada    = false;
    s.ondaConcluida   = false;
    s.preparacao      = true;
    s.tempoPreparacao = 15;
    s.inimigosDanaram = 0;

    s.textoOnda.setText('Onda: ' + s.ondaAtual + ' / ' + s.totalOndas);
    s.textoTempo.setText('Preparação: 15 s');

    s.timerPreparacaoEvent = s.time.addEvent({
      delay: 1000, callback: this.tick, callbackScope: this,
      repeat: s.tempoPreparacao - 1
    });
  }
}
