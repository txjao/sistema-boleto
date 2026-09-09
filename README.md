# Sistema de boletos · SITICOP-MG

POC navegável para validar funcionalidades e usabilidade do acompanhamento e da emissão de contribuições negociais. Toda persistência ocorre no `localStorage`; integrações bancárias, Receita Federal e e-mail são simuladas.

## Executar

Requisitos: Node.js 22 e pnpm 11.

```bash
pnpm install
pnpm start
```

O painel flutuante de cenários faz parte da POC. Ele permite simular respostas normais, lentas, com erro ou vazias e restaurar os dados locais.

```bash
pnpm build
pnpm preview
```

O projeto gera uma SPA estática em `dist/`, pronta para importação na Vercel. Consulte [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para as fronteiras e [docs/BUSINESS_RULES.md](docs/BUSINESS_RULES.md) para as hipóteses da POC.
