import { Scene } from 'phaser';
import bgCorreio from '../assets/CÓRREGO PERIFERIA PX.png';
import bgTransito from '../assets/TRANSITO SP PX.png';
import bgBarco from '../assets/BAR COFRE PX.png';

// ── Conteúdo dos slides ────────────────────────────────────────
const SLIDES = [
  {
    bgKey:   'slide-corre',
    bgPath:  bgCorreio,
    tag:      'DIA 0 — 06h32',
    titulo:   'OS PRIMEIROS RELATOS',
    texto:    'Casos isolados. Pessoas agindo de forma estranha\npelas periferias de São Paulo.\n\nNinguém levou a sério.\nEra só mais um rumor nas redes.'
  },
  {
    bgKey:   'slide-transito',
    bgPath:  bgTransito,
    tag:      'DIA 0 — 14h17',
    titulo:   'O COLAPSO',
    texto:    'Em menos de oito horas, a cidade entrou em colapso.\nBuzinas, sirenes, gritos nas ruas.\n\nTodos correndo. Empurrando. Fugindo.\nSem saber pra onde, só pra longe.'
  },
  {
    bgKey:   'slide-bar',
    bgPath:  bgBarco,
    tag:      'DIA 0 — 21h48',
    titulo:   'O BAR',
    texto:    'Enquanto São Paulo se apagava ao redor,\nvocê encontrou abrigo num bar no centro da cidade.\nPortas travadas. Luz apagada. Silêncio pesado.\n\nMas você não estava sozinho.'
  }
];

export class StoryScene extends Scene {
  constructor() { super('StoryScene'); }

  preload() {
    for (const slide of SLIDES) {
      if (slide.bgKey && slide.bgPath) {
        this.load.image(slide.bgKey, slide.bgPath);
      }
    }
  }

  create() {
    this.indice = 0;
    this.bloqueado = false;

    // Novo jogo → garante que o tutorial vai aparecer no GameScene
    localStorage.removeItem('outbreak-tutorial-game');

    // ── Fundo preto ────────────────────────────────────────────
    this.add.rectangle(400, 225, 800, 450, 0x000000).setDepth(-2);

    // ── Área da imagem (topo — 260px) ──────────────────────────
    this.retImagem = null;
    this.iconePlaceholder = this.add.text(400, 115, '[ imagem ]', {
      fontSize: '14px', color: '#333355'
    }).setOrigin(0.5).setDepth(0);

    // Gradiente embaixo da imagem para fundir com o painel
    const grad = this.add.graphics().setDepth(1);
    for (let i = 0; i < 40; i++) {
      const alpha = (i / 40) * 0.92;
      grad.fillStyle(0x000000, alpha);
      grad.fillRect(0, 220 + i, 800, 1);
    }

    // ── Painel de texto (parte inferior — 190px) ───────────────
    this.add.rectangle(400, 355, 800, 190, 0x000000).setDepth(2);
    // Linha divisória sutil no topo do painel
    this.add.rectangle(400, 261, 800, 1, 0x1a1a3a).setDepth(3);

    // Tag (ex: "DIA 0 — 06h32")
    this.textoTag = this.add.text(30, 270, '', {
      fontSize: '10px', color: '#3dff6e', letterSpacing: 5
    }).setDepth(5);

    // Título
    this.textoTitulo = this.add.text(400, 290, '', {
      fontSize: '22px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(5);

    // Corpo do texto
    this.textoCorpo = this.add.text(400, 368, '', {
      fontSize: '13px', color: '#aabbcc',
      align: 'center', lineSpacing: 7,
      wordWrap: { width: 680 }
    }).setOrigin(0.5).setDepth(5);

    // ── Rodapé: bolinhas + instrução ───────────────────────────
    this.bolinhas = [];
    for (let i = 0; i < SLIDES.length; i++) {
      const b = this.add.circle(388 + i * 16, 428, 3, 0x444466).setDepth(5);
      this.bolinhas.push(b);
    }

    this.textoAvanco = this.add.text(400, 442, 'clique para continuar', {
      fontSize: '11px', color: '#444466'
    }).setOrigin(0.5).setDepth(5);

    this.tweens.add({ targets: this.textoAvanco, alpha: 0.25, duration: 900, yoyo: true, repeat: -1 });

    this.mostrarSlide(0);
    this.input.on('pointerdown', () => this.avancar());
  }

  mostrarSlide(i) {
    const slide = SLIDES[i];
    this.cameras.main.fadeIn(300, 0, 0, 0);

    if (this.retImagem) { this.retImagem.destroy(); this.retImagem = null; }

    if (slide.bgKey && this.textures.exists(slide.bgKey)) {
      // Imagem ocupa toda a largura, altura 260px, topo da tela
      this.retImagem = this.add.image(400, 130, slide.bgKey)
        .setDisplaySize(800, 260)
        .setDepth(-1);
      this.iconePlaceholder.setVisible(false);
    } else {
      this.iconePlaceholder.setVisible(true);
    }

    this.textoTag.setText(slide.tag);
    this.textoTitulo.setText(slide.titulo);
    this.textoCorpo.setText(slide.texto);

    this.bolinhas.forEach((b, idx) => b.setFillStyle(idx === i ? 0x3dff6e : 0x444466));

    this.textoAvanco.setText(i === SLIDES.length - 1 ? 'clique para criar seu sobrevivente' : 'clique para continuar');
  }

  avancar() {
    if (this.bloqueado) return;
    this.bloqueado = true;

    this.cameras.main.fadeOut(250, 0, 0, 0);

    this.time.delayedCall(260, () => {
      this.indice++;

      if (this.indice >= SLIDES.length) {
        // Repassa slot e modo de jogo para CharacterScene
        const slot = this.scene.settings.data?.slot || null;
        const modo = this.scene.settings.data?.modo || 'normal';
        this.scene.start('CharacterScene', { slot, modo });
      } else {
        this.mostrarSlide(this.indice);
        this.bloqueado = false;
      }
    });
  }
}
