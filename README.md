# GAMA FINANCE

Aplicativo web instalável (PWA) para controle financeiro pessoal e profissional.

## Recursos
- Painel mensal com saldo realizado, receitas, despesas, pendências líquidas e saldo projetado.
- Lançamentos de receitas e despesas, com status recebido/pago ou pendente.
- Fontes de renda com previsões semanais, quinzenais e mensais. A recorrência mensal preserva o dia original, ajustando para o último dia quando o mês for menor.
- Calendário com lançamentos, contas, previsões de renda e vencimentos de faturas.
- Cartões com limite total, limite utilizado, valor e vencimento da fatura atual, e controle de fatura paga/em aberto.
- Contas a pagar e acompanhamento de vencimentos.
- Análise por categoria e comparativo dos últimos seis meses, incluindo contas pagas sem duplicar lançamentos equivalentes.
- Benefícios e descontos informativos, sem abatimento automático do salário líquido.
- Backup e restauração em JSON, com validação da estrutura antes de substituir os dados locais.
- Interface responsiva e suporte a instalação/offline via PWA.

## Publicação
O projeto é publicado pelo GitHub Actions no GitHub Pages. Abra a URL HTTPS no Android e use a opção de instalar/adicionar à tela inicial do navegador.

## Dados e privacidade
Os dados ficam no armazenamento local do navegador/dispositivo. Não há conta, servidor ou sincronização em nuvem. Faça backups regulares e não limpe os dados do navegador sem exportar um backup.

## Limitações desta versão
Esta entrega é um PWA, não um APK Android nativo. As previsões recorrentes são projeções: não criam recebimentos automaticamente. Contas pagas são conciliadas com lançamentos de despesa quando data, valor e descrição correspondem, independentemente do status. Para evitar duplicidade de fluxo de caixa, não cadastre a mesma obrigação simultaneamente como conta e lançamento com descrições diferentes. O valor da fatura do cartão representa o compromisso de pagamento; despesas de compras no cartão devem ser registradas de forma consistente para não contar a mesma saída duas vezes.
