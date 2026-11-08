# Clareira

City builder isométrico que roda direto no navegador. O mapa começa só com mata nativa e uma rodovia; você abre ruas, marca lotes e vê a cidade crescer.

**Jogar:** https://agigor.github.io/Clareira-Game/

Todos os gráficos são desenhados por código em canvas, sem nenhuma imagem.

## O que tem

- Mata com araucárias, jerivás, capoeira, pedras e ipês que florescem de julho a setembro
- Ruas, zonas residencial, comercial e industrial, praças, limpar terreno e demolir
- Lotes crescem conforme a demanda (barras R C I) e valorizam com praças e mata por perto
- Ciclo de dia e noite com janelas, postes e faróis acesos
- Estações do hemisfério sul (grama seca no inverno), chuva, garoa e temporais de verão
- Economia mensal, carros nas ruas, fumaça das fábricas, salvamento automático

## Controles

| Ação | Mouse / teclado | Toque |
| --- | --- | --- |
| Aplicar ferramenta | arrastar com o botão esquerdo | arrastar com um dedo |
| Mover o mapa | botão direito, WASD ou setas | dois dedos, ou ferramenta Mover |
| Zoom | roda do mouse, + e − | pinça |
| Trocar ferramenta | teclas 1 a 8 | barra inferior |
| Pausar | espaço | botão ▮▮ |

## Rodar localmente

O jogo usa módulos JavaScript, então precisa ser servido por HTTP (abrir o arquivo direto não funciona):

```
python3 -m http.server 8000
```

Depois abra http://localhost:8000.

## Estrutura

```
index.html            página e painéis
css/style.css         visual da interface
js/main.js            inicialização e laço do jogo
js/world.js           estado do mapa e da cidade, geração, salvamento
js/sim.js             crescimento, finanças, clima
js/tools.js           ferramentas; toda mudança no mapa é uma ação serializável
js/agents.js          carros, fumaça, chuva
js/render.js          câmera, desenho e camada de luz noturna
js/tiles.js           ladrilhos do chão
js/iso.js             geometria isométrica e primitivas
js/sprites/           árvores e edificações desenhadas por código
js/ui.js              painel, ferramentas, mouse, toque e teclado
```

As mudanças no mapa passam por `perform(action)` em `tools.js`. No multiplayer, essas ações serão enviadas ao anfitrião, que aplica e repassa para todos.

No console do navegador, `clareira.G` mostra o estado da cidade (por exemplo, `clareira.G.tod = 0.9` vira noite).
