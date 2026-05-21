// ── Configurações compartilhadas do GameScene ───────────────────

export const PERSONAGENS_CONFIG = {
  vini:   { nome: 'Vini',   funcao: 'Policial S.P.D.', cor: 0x3399ff, custo: 20, dano: 26, hp: 110, passiva: '+20% de dano\nc/ arma principal' },
  helena: { nome: 'Helena', funcao: 'Garçonete',        cor: 0xff66aa, custo: 20, dano: 15, hp: 80,  passiva: 'Cura aliados\nem raio (+10HP/10s)' },
  daniel: { nome: 'Daniel', funcao: 'Mecânico',         cor: 0xffaa33, custo: 20, dano: 20, hp: 95,  passiva: 'Chave de rosca:\nknockback em inimigos' }
};

export const CORES_ROUPAS = [0x27ae60, 0x2980b9, 0xc0392b, 0xe67e22, 0x8e44ad];

// personagem: 'avatar' | 'vini' | 'helena' | 'daniel' | 'base'
export const LOJA_ITENS = [
  // ── Avatar (jogador) ──────────────────────────────────────────
  { id: 'danoGlobal',   personagem: 'avatar', label: '+5 Dano Global',
    descricao: 'Todas as torres causam\n+5 de dano.',
    custos: [20], maxNivel: 1 },
  { id: 'cooldownMult', personagem: 'avatar', label: 'Cadência +25%',
    descricao: 'Todas as torres atiram\n25% mais rápido.',
    custos: [35], maxNivel: 1 },
  { id: 'avatarHP',     personagem: 'avatar', label: 'Colete Balístico',
    descricao: '+60 HP máximo\nno seu avatar.',
    custos: [40], maxNivel: 1 },
  // ── Vini ──────────────────────────────────────────────────────
  { id: 'viniDano',     personagem: 'vini',   label: 'Precisão',
    descricao: 'Nv1: +10% dano\nNv2: +20% | Nv3: +30%',
    custos: [30, 50, 80], maxNivel: 3 },
  // ── Helena ────────────────────────────────────────────────────
  { id: 'helenaCura',   personagem: 'helena', label: 'Alcance de Cura',
    descricao: 'Nv1: raio 400→500px\nNv2: raio 500→600px',
    custos: [30, 50], maxNivel: 2 },
  // ── Daniel ────────────────────────────────────────────────────
  { id: 'danielKnockback', personagem: 'daniel', label: 'Chave de Rosca',
    descricao: 'Nv1: 10% knockback\nNv2: 20% | Nv3: 30%',
    custos: [25, 40, 65], maxNivel: 3 },
  // ── Base ──────────────────────────────────────────────────────
  { id: 'baseReforco',  personagem: 'base',   label: 'Reforço Estrutural',
    descricao: '+20 HP máximo\nna base.',
    custos: [25], maxNivel: 1 },
];

// spot: área a destacar (x, y, w, h) | cx/cy: centro do callout de texto
export const TUTORIAL_PASSOS = [
  {
    titulo: 'SUA BASE',
    texto:  'Esta parede verde é sua base.\nSe os infectados chegarem aqui,\nvocê perde vida.\nHP = 0 → fim de jogo!',
    spot:   { x: 718, y: 0,   w: 82,  h: 450 },
    cx: 310, cy: 225
  },
  {
    titulo: 'SLOTS DE DEFESA',
    texto:  'Posicione aliados nestes slots.\nCada slot ataca inimigos dentro\ndo seu raio (círculo azul).\nArraste um aliado até um slot.',
    spot:   { x: 158, y: 108, w: 400, h: 234 },
    cx: 648, cy: 225
  },
  {
    titulo: 'SEUS ALIADOS',
    texto:  'Seus aliados ficam aqui embaixo.\nArraste um deles até um slot livre\npara posicioná-lo na defesa.\nCada personagem tem uma passiva única.',
    spot:   { x: 80,  y: 382, w: 640, h: 50  },
    cx: 400, cy: 284
  },
  {
    titulo: 'SP E MELHORIAS',
    texto:  'SP = Suprimentos, sua moeda.\nGanhe SP eliminando infectados.\nClique num aliado posicionado\npara acessar as melhorias dele.',
    spot:   { x: 0,   y: 5,   w: 730, h: 96  },
    cx: 400, cy: 218
  }
];
