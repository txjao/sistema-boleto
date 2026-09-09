# Regras e hipóteses da POC

## Implementado

- Contribuição por trabalhador: 1% do piso salarial anual configurado, arredondado para centavos.
- Estimativa de trabalhadores: piso da divisão entre valor principal mensal e contribuição individual.
- Vários meses: contribuição mensal multiplicada pela quantidade de competências.
- Multa agrupada: 20% do piso por trabalhador, limitada ao débito das competências atrasadas.
- Multa mensal: percentual configurável, limitado ao principal.
- Desconto menor que o total antes do desconto.
- Valor principal aberto para substituição manual.
- Correção apenas quando houver competência atrasada.
- Operador vê somente boletos criados pela persona operadora; administrador e diretor veem todos.
- Apenas administrador gerencia usuários; administrador e diretor confirmam pagamentos e alteram convenções.

## Hipóteses que precisam de validação

- A POC fixa a data operacional em 08/09/2026 para produzir resultados reproduzíveis.
- O vencimento original ocorre no mesmo mês da competência, no dia configurado. O dia é limitado a 28.
- Competências de anos diferentes exigem emissões separadas.
- O valor principal substituído vale para o total dos meses selecionados.
- A correção é informada manualmente porque a fórmula não foi fornecida.
- Juros de mora não aparecem nem são calculados.
- O rateio mensal de um boleto agrupado usa o principal antes de multa, correção e desconto.
- Confirmações da Caixa e notificações por e-mail são registradas como simulação imediata.

As regras deste arquivo devem ser revisadas com a convenção anual antes de migrarem ao NestJS.
