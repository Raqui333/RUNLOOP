# AGENTS.md — Diretrizes do Projeto

## 1. Visão do projeto

Este projeto é um jogo **IDLE / incremental para navegador**, desenvolvido com **Next.js**.

O jogo deve ser completamente baseado em **interface gráfica**, sem depender de:

* personagens;
* mapas;
* sprites;
* combate visual;
* animações 2D;
* modelos 3D;
* movimentação de personagens;
* exploração espacial tradicional.

A experiência deve acontecer através de **painéis, números, logs, gráficos, botões, menus, árvores de progressão e elementos de interface**.

O jogador deve sentir que está administrando e evoluindo um sistema tecnológico cada vez mais poderoso.

### Tema central

O tema do jogo é voltado para **desenvolvedores, programação, infraestrutura, sistemas e tecnologia**.

A fantasia do jogador é algo próximo de:

> "Comecei como um desenvolvedor em uma máquina simples e estou construindo um sistema absurdamente poderoso."

O jogador deve evoluir continuamente através de conceitos como:

* código;
* CPU;
* memória;
* processamento;
* servidores;
* bancos de dados;
* APIs;
* workers;
* filas;
* cache;
* containers;
* cloud;
* redes;
* automação;
* IA;
* clusters;
* sistemas distribuídos;
* infraestrutura;
* observabilidade;
* segurança;
* escalabilidade.

O jogo não precisa representar programação de forma tecnicamente perfeita. Os conceitos devem ser utilizados principalmente como **fantasia e linguagem temática para sistemas de progressão**.

---

# 2. Filosofia do jogo

O jogo deve seguir a filosofia de um **incremental/idle de progressão praticamente infinita**.

Não existe um "fim" tradicional.

O jogador deve sempre ter algum próximo objetivo:

```text
aumentar produção
    ↓
comprar upgrade
    ↓
desbloquear sistema
    ↓
aumentar eficiência
    ↓
automatizar
    ↓
escalar
    ↓
desbloquear uma nova camada
    ↓
recomeçar uma camada em escala maior
```

A progressão deve continuar indefinidamente através de:

* upgrades;
* multiplicadores;
* automações;
* novas camadas de progressão;
* prestígio;
* sistemas de meta-progressão;
* números cada vez maiores;
* desafios;
* especializações;
* otimização.

O jogo deve ser simples de entender inicialmente, mas possuir profundidade suficiente para continuar interessante por muito tempo.

---

# 3. Regra principal de design

## Simples de começar, profundo de dominar.

Nos primeiros minutos, o jogador deve entender o jogo praticamente sozinho.

A interface inicial deve responder claramente:

1. O que estou produzindo?
2. Quanto estou produzindo?
3. O que posso comprar?
4. O que meu próximo upgrade faz?
5. Como avanço para a próxima etapa?

Não introduzir sistemas complexos imediatamente.

Novos sistemas devem ser desbloqueados gradualmente.

Exemplo:

```text
Código
  ↓
CPU
  ↓
Automação
  ↓
Servidor
  ↓
API
  ↓
Banco de dados
  ↓
Cluster
  ↓
Cloud
  ↓
IA
  ↓
Sistemas distribuídos
  ↓
Infraestrutura global
  ↓
...
```

A complexidade deve crescer conforme o jogador progride.

---

# 4. Interface

A interface é o principal elemento visual do jogo.

Ela deve parecer uma mistura de:

* terminal;
* IDE;
* dashboard de infraestrutura;
* painel de monitoramento;
* console administrativo;
* sistema operacional futurista;
* ferramenta de desenvolvedor.

Não transformar o jogo em um terminal puro.

O jogador deve conseguir interagir facilmente através de botões, cards, abas, barras de progresso e componentes visuais.

## Direção visual

Utilizar uma estética:

* dark;
* hacker;
* tecnológica;
* minimalista;
* profissional;
* inspirada em ferramentas de desenvolvimento;
* com aparência de software real;
* levemente futurista.

Evitar exageros.

O jogo não deve parecer um site de anime, um cassino ou um jogo mobile genérico.

---

# 5. Identidade visual

A interface deve utilizar principalmente:

* fundo muito escuro;
* tons de preto/grafite;
* verde terminal;
* ciano;
* azul tecnológico;
* branco/cinza para textos;
* pequenas áreas de destaque para estados importantes.

Usar cores de destaque com moderação.

Evitar transformar toda a interface em neon.

O visual deve passar a sensação de:

> "Estou olhando para uma ferramenta de infraestrutura extremamente avançada."

---

# 6. Tipografia

Priorizar fontes monoespaçadas para:

* números;
* logs;
* métricas;
* código;
* nomes de processos;
* identificadores;
* informações técnicas.

Textos explicativos podem utilizar uma fonte sans-serif convencional para facilitar leitura.

A hierarquia visual deve ser muito clara.

Exemplo:

```text
PROCESSING POWER

1.82M FLOPS/s

+12.4% efficiency

[ UPGRADE CPU ]

Next:
Unlock distributed workers
```

---

# 7. Layout

A interface deve funcionar muito bem em desktop e possuir responsividade razoável para telas menores.

Uma estrutura possível:

```text
┌─────────────────────────────────────────────────────────┐
│ SYSTEM STATUS       CPU       MEMORY       NETWORK      │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│ NAVIGATION   │             MAIN DASHBOARD               │
│              │                                          │
│ Overview     │                                          │
│ Compute      │                                          │
│ Automation   │                                          │
│ Infrastructure│                                         │
│ Research     │                                          │
│ Upgrades     │                                          │
│              │                                          │
├──────────────┴──────────────────────────────────────────┤
│ SYSTEM LOG                                               │
└─────────────────────────────────────────────────────────┘
```

A estrutura exata pode mudar conforme o jogo evolui.

Não adicionar elementos apenas para preencher espaço.

---

# 8. Mecânica principal

O jogo deve possuir um recurso principal que representa a capacidade produtiva do sistema.

Exemplos:

```text
Compute
Processing Power
Execution Units
Cycles
Throughput
Compute Units
```

Escolha um conceito consistente e utilize-o como recurso central.

O jogador começa produzindo uma quantidade pequena:

```text
12 cycles/s
```

E gradualmente chega a:

```text
12K cycles/s
12M cycles/s
12B cycles/s
12T cycles/s
...
```

A escala pode continuar indefinidamente.

---

# 9. Idle

O jogo precisa continuar produzindo recursos enquanto o jogador estiver ausente.

Exemplo:

```text
Last active:
3h 42m ago

Offline production:
+82.4M Compute

Efficiency:
87%

[ COLLECT ]
```

O cálculo offline deve ser determinístico.

Não depender de simplesmente executar milhares de ticks enquanto o jogador estiver ausente.

Preferir:

```text
elapsedTime × productionPerSecond × modifiers
```

com eventuais limites ou regras específicas de balanceamento.

---

# 10. Progressão

A progressão deve possuir múltiplas camadas.

## Camada 1 — Produção

Aumentar a quantidade de recurso produzido por segundo.

Exemplo:

```text
CPU
+10% production

RAM
+5% production

Compiler
+25% production
```

## Camada 2 — Automação

Permitir que ações antes manuais sejam automatizadas.

Exemplo:

```text
Manual execution
      ↓
Worker
      ↓
Worker pool
      ↓
Auto scaling
```

## Camada 3 — Infraestrutura

Adicionar sistemas maiores:

```text
Machine
Server
Cluster
Datacenter
Region
Cloud
Global infrastructure
```

## Camada 4 — Pesquisa

Uma árvore de tecnologia deve desbloquear novas mecânicas.

Exemplo:

```text
Efficient Compiler
       │
       ├── JIT
       │
       └── Parallel Compilation
                │
                └── Distributed Build System
```

## Camada 5 — Prestígio

Após atingir determinados marcos, o jogador pode reiniciar parte da progressão em troca de um recurso permanente.

Tema:

```text
Refactor
Migration
Rewrite
Architecture Reset
System Rebuild
```

O prestígio deve representar uma evolução arquitetural.

Exemplo:

```text
Current system:

42.8B Compute/s

[ REFACTOR SYSTEM ]

Reset current infrastructure.

Gain:
+284 Architecture Points

Permanent bonus:
+2.5% production
```

---

# 11. Progressão infinita

Não criar um ponto artificial onde o jogador simplesmente "vence".

O sistema deve permitir crescimento contínuo.

Isso pode ser obtido através de:

* upgrades com custo crescente;
* multiplicadores;
* tiers;
* prestígio;
* meta-upgrades;
* desafios;
* árvores de pesquisa;
* níveis de infraestrutura;
* escalas numéricas grandes;
* sistemas que desbloqueiam outros sistemas.

Exemplo:

```text
Server I
Server II
Server III
...
Server X
...
Server 100
...
Server 1000
...
```

Não é necessário criar manualmente centenas de upgrades.

Criar sistemas matemáticos capazes de gerar progressão proceduralmente.

---

# 12. Números

O jogo deve ser preparado para números muito grandes.

Evitar depender exclusivamente de `number` quando isso resultar em perda significativa de precisão.

Criar uma camada central para:

* formatação;
* operações;
* comparação;
* multiplicação;
* divisão;
* escalas;
* números científicos;
* números extremamente grandes.

A apresentação deve ser agradável:

```text
1.25K
8.42M
91.3B
4.82T
7.11Qa
...
```

ou uma notação equivalente.

Não exibir números gigantes sem formatação.

---

# 13. Feedback visual

Toda ação importante deve gerar feedback.

Exemplos:

```text
+1,240 Compute
+2.4% efficiency
Upgrade purchased
Automation unlocked
New architecture available
```

Utilizar animações pequenas e rápidas.

Evitar animações exageradas.

O jogo deve parecer responsivo, mas não barulhento.

---

# 14. Logs

Logs são uma ferramenta importante para reforçar o tema.

Exemplo:

```text
[02:41:18] Worker #42 completed job
[02:41:19] Cache hit ratio: 94.2%
[02:41:20] Autoscaling: +2 workers
[02:41:21] Pipeline completed
[02:41:23] New research available
```

Os logs devem ser principalmente cosméticos.

Não transformar o jogo em uma simulação real de infraestrutura.

---

# 15. Sistemas que podem existir

Os seguintes conceitos podem ser utilizados ao longo da progressão:

### Computação

* CPU
* GPU
* RAM
* threads
* processes
* execution units
* parallelism

### Desenvolvimento

* compiler
* build
* tests
* CI/CD
* deployments
* repositories
* branches
* releases

### Backend

* API
* database
* cache
* queue
* workers
* jobs
* load balancing

### Infraestrutura

* containers
* servers
* clusters
* regions
* cloud
* autoscaling
* networking

### Dados

* storage
* indexing
* replication
* sharding
* pipelines
* analytics

### IA

* models
* inference
* embeddings
* vector databases
* agents
* training
* inference clusters

### Escala avançada

* distributed systems
* global clusters
* fault tolerance
* self-healing systems
* autonomous infrastructure

Esses conceitos devem ser utilizados como linguagem de progressão, não como obrigação de implementar sistemas reais equivalentes.

---

# 16. Next.js

O projeto deve ser implementado utilizando Next.js.

Priorizar:

* TypeScript;
* componentes React;
* arquitetura simples;
* componentes reutilizáveis;
* estado previsível;
* separação entre lógica do jogo e UI;
* código fácil de modificar.

A lógica do jogo não deve ficar espalhada pelos componentes React.

Preferir uma estrutura semelhante a:

```text
src/
├── app/
├── components/
├── game/
│   ├── engine/
│   ├── economy/
│   ├── progression/
│   ├── upgrades/
│   ├── prestige/
│   ├── numbers/
│   └── save/
├── hooks/
├── lib/
└── types/
```

A estrutura pode ser adaptada quando necessário.

Não criar abstrações apenas por criar.

---

# 17. Engine do jogo

A lógica central deve ser independente da interface.

A engine deve ser responsável por coisas como:

```text
production
upgrades
costs
multipliers
offline progress
prestige
unlock conditions
research
automation
```

A UI apenas apresenta e modifica o estado através de ações bem definidas.

Evitar lógica de economia diretamente dentro de componentes visuais.

---

# 18. Game loop

O jogo deve possuir um loop controlado para atualizar o estado.

Não utilizar atualizações excessivamente frequentes sem necessidade.

Uma frequência na ordem de dezenas de atualizações por segundo é suficiente para a maioria dos elementos.

O cálculo da produção deve levar em consideração o tempo real decorrido quando apropriado.

Não assumir que:

```text
1 tick = exatamente 1/60 segundo
```

O navegador pode sofrer:

* throttling;
* perda de foco;
* suspensão da aba;
* queda de FPS;
* computadores lentos.

A engine deve ser resistente a isso.

---

# 19. Persistência

O progresso do jogador deve ser salvo localmente.

Utilizar uma estratégia apropriada, como:

```text
localStorage
```

ou IndexedDB caso a quantidade de dados justifique.

O save deve conter apenas dados necessários para reconstruir o estado do jogo.

Não salvar estado transitório desnecessariamente.

Exemplo:

```text
resources
upgrades
research
prestige
timestamps
settings
```

Ao carregar o jogo:

```text
currentTime - lastSaveTime
```

deve ser utilizado para calcular a progressão offline.

---

# 20. Segurança do save

Não assumir que o estado do cliente é confiável.

Como o jogo é single-player e executado no navegador, não existe necessidade de implementar segurança pesada contra cheats.

Porém, a estrutura deve evitar corrupção fácil do save.

Validar:

* versões;
* tipos;
* valores negativos inesperados;
* NaN;
* Infinity;
* dados incompatíveis com versões antigas.

Criar um sistema de versionamento do save:

```text
saveVersion: 1
```

Permitir futuras migrações.

---

# 21. UX

O jogador deve sempre entender:

* o que está acontecendo;
* quanto está produzindo;
* quanto falta para o próximo objetivo;
* o que cada upgrade faz;
* por que algo está bloqueado;
* qual é o próximo grande desbloqueio.

Evitar menus escondidos demais.

Evitar tooltips obrigatórios para entender mecânicas básicas.

Tooltips podem fornecer detalhes avançados.

---

# 22. Tooltips

Tooltips são especialmente úteis para explicar conceitos técnicos.

Exemplo:

```text
AUTOSCALING

Automatically increases the number of workers
when system load exceeds the configured threshold.

Effect:
+1 worker capacity per level
```

O texto deve ser curto e útil.

---

# 23. Upgrades

Upgrades devem possuir:

```text
Nome
Descrição
Custo
Efeito
Nível atual
Próximo efeito
```

Exemplo:

```text
┌────────────────────────────────────┐
│ JIT COMPILER                       │
│                                    │
│ Optimizes frequently executed code │
│                                    │
│ Level: 24                          │
│ +48% production                    │
│                                    │
│ Cost: 8.4M Compute                 │
│                                    │
│ [ UPGRADE ]                        │
└────────────────────────────────────┘
```

Os upgrades devem ser satisfatórios de comprar.

---

# 24. Progressão procedural

Sempre que possível, utilizar fórmulas em vez de criar centenas de objetos manualmente.

Exemplo conceitual:

```text
cost(level) = baseCost × growthRate^level
```

ou outras curvas adequadas ao balanceamento.

Isso permite que o sistema continue crescendo indefinidamente.

Entretanto, não utilizar crescimento exponencial indiscriminadamente.

Balanceamento deve priorizar:

* sensação de progresso;
* decisões;
* objetivos de curto prazo;
* objetivos de médio prazo;
* objetivos de longo prazo.

---

# 25. Prestígio

Prestígio deve ser uma decisão interessante.

Não deve simplesmente significar:

```text
Reset → ganhar bônus → repetir
```

Sempre que possível, introduzir escolhas.

Exemplo:

```text
REFACTOR

Reset infrastructure and lose:
- current servers
- current workers
- current upgrades

Gain:
+ Architecture Points

Choose specialization:

[ PERFORMANCE ]
+ production

[ RELIABILITY ]
+ offline efficiency

[ AUTOMATION ]
+ automation speed
```

Isso cria diferentes caminhos de progressão.

---

# 26. Sensação de escala

O jogo deve transmitir uma evolução clara:

```text
Developer workstation
        ↓
Powerful workstation
        ↓
Server
        ↓
Server farm
        ↓
Cluster
        ↓
Datacenter
        ↓
Cloud infrastructure
        ↓
Global infrastructure
        ↓
Distributed intelligence
        ↓
...
```

A interface deve mudar sutilmente conforme a escala aumenta.

Não é necessário mudar completamente o layout.

Podem ser alterados:

* métricas;
* nomenclatura;
* painéis;
* indicadores;
* logs;
* efeitos;
* novas abas;
* informações apresentadas.

---

# 27. Evitar

Não transformar o projeto em:

* RPG tradicional;
* clicker visual genérico;
* simulador de terminal real;
* dashboard empresarial sem personalidade;
* jogo cheio de popups;
* jogo baseado em animações;
* interface excessivamente neon;
* cópia visual de um jogo específico;
* sistema excessivamente complexo desde o início.

Também evitar:

* microserviços;
* backend;
* banco de dados;
* autenticação;
* infraestrutura externa;

a menos que exista uma necessidade real do jogo.

O objetivo é criar um jogo de navegador simples de executar e manter.

---

# 28. Princípios de implementação

Antes de adicionar uma funcionalidade, perguntar:

1. Isso melhora a experiência do jogador?
2. Isso cria uma decisão ou progressão interessante?
3. Isso reforça o tema de desenvolvimento/tecnologia?
4. Isso é necessário ou é complexidade gratuita?
5. Isso pode continuar funcionando em uma escala muito maior?

Preferir sempre a solução mais simples que preserve a experiência.

---

# 29. Princípios de UI

A interface deve seguir:

* alta densidade de informação sem ficar poluída;
* espaçamento consistente;
* hierarquia visual clara;
* feedback imediato;
* poucos elementos decorativos;
* contraste adequado;
* componentes reutilizáveis;
* estados vazios bem definidos;
* estados bloqueados claramente explicados.

O visual deve parecer intencional.

Não utilizar componentes genéricos simplesmente porque são fáceis de implementar.

---

# 30. Princípios de código

Escrever código:

* simples;
* legível;
* modular;
* tipado;
* testável;
* previsível.

Evitar:

* abstrações prematuras;
* overengineering;
* componentes gigantes;
* lógica duplicada;
* números mágicos espalhados;
* estado global desnecessário;
* dependências externas sem justificativa.

Se uma solução simples resolver o problema, utilizar a solução simples.

---

# 31. Prioridade durante o desenvolvimento

Ao implementar o jogo, seguir aproximadamente esta ordem:

### Fase 1

Criar:

* layout principal;
* recurso principal;
* produção automática;
* upgrades;
* save local;
* progressão offline.

### Fase 2

Adicionar:

* automação;
* pesquisa;
* desbloqueios;
* logs;
* métricas;
* novas camadas de produção.

### Fase 3

Adicionar:

* prestígio;
* meta-progressão;
* especializações;
* progressão procedural;
* números muito grandes.

### Fase 4

Adicionar:

* balanceamento;
* polimento;
* animações sutis;
* feedback;
* melhorias de UX;
* otimização.

Não tentar construir todos os sistemas simultaneamente.

---

# 32. Regra para decisões ambíguas

Quando houver uma decisão de implementação não especificada neste documento:

1. Priorizar a experiência de jogo.
2. Priorizar simplicidade.
3. Manter o tema tecnológico.
4. Evitar dependências desnecessárias.
5. Preferir sistemas que permitam expansão futura.
6. Não adicionar complexidade apenas para parecer "mais profissional".

Se duas soluções forem equivalentes, escolher a mais simples.

---

# 33. Objetivo final

O resultado deve parecer um **incremental game que um desenvolvedor realmente gostaria de deixar aberto em uma segunda tela**.

Deve ser:

* simples;
* elegante;
* técnico;
* viciante;
* progressivo;
* altamente escalável;
* fácil de entender;
* difícil de "esgotar".

A sensação desejada é:

```text
"Comecei compilando um projeto."

        ↓

"Agora tenho dezenas de workers."

        ↓

"Agora tenho um cluster."

        ↓

"Agora estou gerenciando infraestrutura global."

        ↓

"Agora preciso refatorar toda minha arquitetura."

        ↓

"Agora meu sistema está operando em uma escala absurda."

        ↓

"...e ainda existe outro nível."
```

A progressão nunca deve parecer completamente encerrada.

Sempre deve existir um próximo sistema, upgrade, arquitetura ou escala para alcançar.
