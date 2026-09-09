# Produto

<!-- impeccable:product-schema 1 -->

## Plataforma

web

## Stack

React, Vite e TypeScript. Escolha confirmada para uma POC estática com evolução posterior para um backend NestJS.

## Usuários

Administradores, diretores financeiros e operadores do SITICOP-MG que acompanham contribuições, mantêm cadastros e emitem boletos.

## Objetivo

Permitir que o cliente experimente os fluxos e valide a usabilidade antes do desenvolvimento da persistência, autenticação e integrações reais.

## Capacidades e restrições

- Acompanhamento por competência, CNPJ, empresa, cidade e situação.
- Cadastros de empresas, usuários e convenções.
- Cálculo e emissão simulada de boletos mensais ou agrupados.
- Perfis e visibilidade simulados.
- Dados fictícios persistidos somente no navegador.
- Sem autenticação, banco, Caixa, Receita Federal ou envio de e-mail.

## Princípios

- Uma discrepância é um indício para auditoria, não uma conclusão de irregularidade.
- Regras financeiras permanecem fora das Views e preparadas para migração ao NestJS.
- Valores de demonstração devem ser reconhecíveis como fictícios.
