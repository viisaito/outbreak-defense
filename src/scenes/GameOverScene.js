import { Scene } from 'phaser';
import { formatStarRating, saveBestPerformance } from '../game/Performance.js';

export class GameOverScene extends Scene {
  constructor() { super('GameOverScene'); }

  create() {
    const d          = this.scene.settings.data || {};
    const onda       = d.onda       ?? 1;
    const eliminados = d.eliminados ?? 0;

    const estrelas   = Math.max(1, Math.min(3, onda));
    const ratingText = estrelas === 3 ? 'Excelente desempenho'
                      : estrelas === 2 ? 'Bom desempenho'
                      : 'Precisa melhorar';

    const { best, isNewRecord } = saveBestPerformance({
      estrelas,
      ondas: onda,
      eliminados,
      hp: 0,
      result: 'defeat'
    });

    this.add.rectangle(400, 225, 800, 450, 0x100808);

    this.add.text(400, 70, 'GAME OVER', {
      fontSize: '52px', color: '#ff4444', fontStyle: 'bold', letterSpacing: 6
    }).setOrigin(0.5);

    this.add.text(400, 122, 'A base foi destruida pelos infectados.', {
      fontSize: '14px', color: '#664444'
    }).setOrigin(0.5);

    this.add.rectangle(400, 144, 280, 1, 0x441111);

    // Estatisticas
    const stats = [
      { label: 'Ondas sobrevividas',  valor: onda + ' / 3',   cor: '#ff9944' },
      { label: 'Inimigos eliminados', valor: String(eliminados), cor: '#ff9944' }
    ];

    stats.forEach((s, i) => {
      const cy = 196 + i * 58;
      this.add.rectangle(400, cy, 420, 46, 0x1a0a0a)
        .setStrokeStyle(1, 0x331111);
      this.add.text(208, cy - 10, s.label, {
        fontSize: '12px', color: '#664444', letterSpacing: 1
      });
      this.add.text(592, cy + 4, s.valor, {
        fontSize: '22px', color: s.cor, fontStyle: 'bold'
      }).setOrigin(1, 0.5);
    });

    this.add.text(400, 310, ratingText, {
      fontSize: '14px', color: '#ffcc33', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(400, 342, formatStarRating(estrelas), {
      fontSize: '26px', color: '#ffcc33', letterSpacing: 6
    }).setOrigin(0.5);

    this.add.text(400, 386, isNewRecord
      ? 'Novo recorde! Continue assim para melhorar ainda mais.'
      : 'Melhor desempenho: ' + (best ? formatStarRating(best.estrelas) + ' • ' + best.ondas + ' / 3 ondas' : 'Nenhum histórico ainda.'), {
      fontSize: '12px', color: '#ddcc88'
    }).setOrigin(0.5);

    // Botao: Tentar novamente
    const btnTentar = this.add.rectangle(285, 410, 210, 44, 0x2a0e0e)
      .setStrokeStyle(1, 0xff4444)
      .setInteractive({ useHandCursor: true });
    this.add.text(285, 410, 'TENTAR NOVAMENTE', {
      fontSize: '13px', color: '#ff6666', letterSpacing: 2
    }).setOrigin(0.5);
    btnTentar.on('pointerover', () => btnTentar.setFillStyle(0x3a1818));
    btnTentar.on('pointerout',  () => btnTentar.setFillStyle(0x2a0e0e));
    btnTentar.on('pointerup',   () => this.scene.start('GameScene'));

    // Botao: Menu principal
    const btnMenu = this.add.rectangle(535, 410, 180, 44, 0x1a1a2e)
      .setStrokeStyle(1, 0x444466)
      .setInteractive({ useHandCursor: true });
    this.add.text(535, 410, 'MENU PRINCIPAL', {
      fontSize: '13px', color: '#aaaacc', letterSpacing: 2
    }).setOrigin(0.5);
    btnMenu.on('pointerover', () => btnMenu.setFillStyle(0x2a2a4a));
    btnMenu.on('pointerout',  () => btnMenu.setFillStyle(0x1a1a2e));
    btnMenu.on('pointerup',   () => this.scene.start('MenuScene'));

    this.add.text(400, 440, 'Dica: posicione aliados em slots diferentes para cobrir mais area.', {
      fontSize: '11px', color: '#443333'
    }).setOrigin(0.5);
  }
}
