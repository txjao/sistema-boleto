# Arquitetura da POC

## Recortes funcionais

Cada módulo em `src/features/<feature>` concentra `domain`, `application`, `infrastructure`, `view` e `_tests` somente quando essas camadas têm conteúdo. Pastas vazias não são criadas.

O `src/server` simula o futuro backend. Ele contém regras, contratos, permissões e repositórios sem importar React. Na migração, estas responsabilidades passam para módulos NestJS e a interface troca a implementação de `Services` por um cliente HTTP.

## MVVM aplicado

```text
Page -> Model -> Services -> domínio/repositório
  └──> View
```

- `Page` lê rota, sessão e serviços, cria o Model e entrega suas propriedades à View.
- `Model` controla estado da tela, TanStack Query, transformação e mensagens de apresentação.
- `View` renderiza as propriedades e encaminha eventos.
- `ServicesProvider` injeta o contrato dos serviços via Context API.
- Zustand mantém apenas sessão, menu e cenários da demonstração.
- TanStack Query é a fonte dos estados assíncronos e do cache de dados.

## Persistência e respostas assíncronas

O repositório grava uma estrutura versionada em `siticop:demo:v1`. A camada de cenários envolve os serviços na POC publicada e acrescenta atraso, erro ou lista vazia à próxima operação selecionada.

## Estilos

Tailwind permanece no JSX para utilitários breves. CSS Modules ficam em `styles/` dentro da superfície ou no ancestral comum do domínio quando compartilhados. Tokens e estilos globais ficam em `src/shared/ui/styles/globals.css`.
