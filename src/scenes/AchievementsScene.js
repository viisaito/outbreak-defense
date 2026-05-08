import { Scene } from 'phaser';

const SAVE_KEY = 'outbreak-defense-achievements';

// ── Lista de conquistas ────────────────────────────────────────
// desbloqueado: false por padrão — a lógica de desbloqueio
// será conectada quando os mapas e modos de jogo estiverem prontos.
const CONQUISTAS = [
  {
    id:       'tutorial_completo',
    icone:    '🛡',
    titulo:   'Primeira Defesa',
    descricao: 'Complete o tutorial e defenda a base pela primeira vez.',
    desbloqueado: false
  },
  {
    id:       'zerar_normal',
    icone:    '⚔',
    titulo:   'Sobrevivente',
    descricao: 'Zere o jogo completo no modo Normal.',
    desbloqueado: false
  },
  {
    id:       'zerar_dificil',
    icone:    '💀',
    titulo:   'Lenda Urbana',
    descricao: 'Zere o jogo completo no modo Difícil.',
    desbloqueado: false
  },
  {
    id:       'sem_hit_normal',
    icone:    '✦',
    titulo:   'Sem Arranhões',
    descricao: 'Complete o modo Normal sem tomar nenhum hit na base.',
    desbloqueado: false
  },
  {
    id:       'sem_hit_dificil',
    icone:    '👁',
    titulo:   'Fantasma',
    descricao: 'Complete o modo Difícil sem tomar nenhum hit na base.',
    desbloqueado: false
  },
  {
    id:       'todos_biomas',
    icone:    '🏙',
    titulo:   'Guardião de SP',
    descricao: 'Complete todos os biomas: Metrô, Hospital, Jornal e Universidade.',
    desbloqueado: false
  }
];

export class AchievementsScene extends Scene {
  constructor() { super('AchievementsScene'); }

  create() {
    // Carrega estado salvo (desbloqueios anteriores)
    const estadoSalvo = this.carregarEstado();

    // Mescla estado salvo com a lista base
    this.conquistas = CONQUISTAS.map(c => ({
      ...c,
      desbloqueado: estadoSalvo[c.id] ?? c.desbloqueado
    }));

    // ── Fundo ──────────────────────────────────────────────────
    this.add.rectangle(400, 225, 800, 450, 0x12122a);

    // ── Cabeçalho ──────────────────────────────────────────────
    this.add.text(400, 28, 'CONQUISTAS', {
      fontSize: '20px', color: '#3dff6e', letterSpacing: 6
    }).setOrigin(0.5);

    // Contador desbloqueados / total
    const qtd = this.conquistas.filter(c => c.desbloqueado).length;
    this.add.text(400, 54, qtd + ' / ' + this.conquistas.length + ' desbloqueadas', {
      fontSize: '12px', color: '#555577'
    }).setOrigin(0.5);

    // Barra de progresso geral
    const barW = 400;
    this.add.rectangle(400, 72, barW, 6, 0x1e1e3a);
    if (qtd > 0) {
      const preenchido = Math.round(barW * (qtd / this.conquistas.length));
      this.add.rectangle(400 - barW / 2 + preenchido / 2, 72, preenchido, 6, 0x3dff6e);
    }

    // ── Lista de conquistas ────────────────────────────────────
    const startY  = 100;
    const altCard = 54;

    this.conquistas.forEach((c, i) => {
      this.criarCard(c, startY + i * altCard);
    });

    // ── Rodapé ─────────────────────────────────────────────────
    this.add.rectangle(400, 430, 800, 1, 0x1e1e3a);

    this.add.text(400, 443, 'As conquistas serão desbloqueadas conforme você avança no jogo.', {
      fontSize: '10px', color: '#333355'
    }).setOrigin(0.5);

    // Botão VOLTAR
    const voltar = this.add.text(60, 443, '← VOLTAR', {
      fontSize: '12px', color: '#555577'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    voltar.on('pointerover', () => voltar.setStyle({ color: '#aaaacc' }));
    voltar.on('pointerout',  () => voltar.setStyle({ color: '#555577' }));
    voltar.on('pointerup',   () => this.scene.start('MenuScene'));
  }

  // ── Renderiza um card de conquista ────────────────────────
  criarCard(conquista, y) {
    const bloqueado   = !conquista.desbloqueado;
    const corFundo    = bloqueado ? 0x16162a : 0x1a2e1a;
    const corBorda    = bloqueado ? 0x222240 : 0x2a5a2a;
    const corTitulo   = bloqueado ? '#555577' : '#ffffff';
    const corDescricao = bloqueado ? '#333355' : '#889988';
    const corIcone    = bloqueado ? '#333355' : '#3dff6e';

    // Fundo do card
    this.add.rectangle(400, y + 20, 720, 48, corFundo)
      .setStrokeStyle(1, corBorda);

    // Ícone
    this.add.text(68, y + 20, conquista.icone, {
      fontSize: '20px', color: corIcone
    }).setOrigin(0.5);

    // Cadeado se bloqueado
    if (bloqueado) {
      this.add.text(96, y + 8, '🔒', { fontSize: '10px' }).setOrigin(0.5);
    }

    // Título
    this.add.text(114, y + 8, conquista.titulo, {
      fontSize: '14px', color: corTitulo, fontStyle: bloqueado ? 'normal' : 'bold'
    });

    // Descrição
    this.add.text(114, y + 26, conquista.descricao, {
      fontSize: '11px', color: corDescricao
    });

    // Badge de status
    if (conquista.desbloqueado) {
      const badge = this.add.rectangle(706, y + 20, 90, 24, 0x1a4a1a)
        .setStrokeStyle(1, 0x3dff6e);
      this.add.text(706, y + 20, '✔  OBTIDA', {
        fontSize: '10px', color: '#3dff6e', letterSpacing: 1
      }).setOrigin(0.5);
    } else {
      const badge = this.add.rectangle(706, y + 20, 90, 24, 0x1e1e3a)
        .setStrokeStyle(1, 0x2a2a4a);
      this.add.text(706, y + 20, '🔒  BLOQUEADA', {
        fontSize: '9px', color: '#333355', letterSpacing: 1
      }).setOrigin(0.5);
    }
  }

  // ── Persistência ──────────────────────────────────────────
  carregarEstado() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  // Método estático para desbloquear uma conquista de qualquer cena:
  // AchievementsScene.desbloquear('zerar_normal')
  static desbloquear(id) {
    try {
      const estado = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
      if (!estado[id]) {
        estado[id] = true;
        localStorage.setItem(SAVE_KEY, JSON.stringify(estado));
      }
    } catch { /* silencioso */ }
  }
}
