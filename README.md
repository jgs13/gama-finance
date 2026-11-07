# GAMA FINANCE

Aplicativo web instalável (PWA) para controle financeiro pessoal e profissional.

## Recursos
- Painel mensal com saldo realizado, receitas, despesas, pendências líquidas e saldo projetado.
- Lançamentos de receitas e despesas, com status recebido/pago ou pendente.
- Fontes de renda com previsões semanais, quinzenais e mensais. A recorrência mensal preserva o dia original, ajustando para o último dia quando o mês for menor.
- Calendário com lançamentos, contas, previsões de renda e vencimentos de faturas.
- Cartões com limite total, limite utilizado, valor e vencimento da fatura atual, e controle de fatura paga/em aberto.
- Contas a pagar e acompanhamento de vencimentos.
- Análise por categoria e comparativo dos últimos seis meses.
- Benefícios e descontos informativos, sem abatimento automático do salário líquido.
- Backup e restauração em JSON.
- Interface responsiva e suporte a instalação/offline via PWA.

## Publicação
O projeto é publicado pelo GitHub Actions no GitHub Pages. Abra a URL HTTPS no Android e use a opção de instalar/adicionar à tela inicial do navegador.

## Dados e privacidade
Os dados ficam no armazenamento local do navegador/dispositivo. Não há conta, servidor ou sincronização em nuvem. Faça backups regulares e não limpe os dados do navegador sem exportar um backup.

## Limitações desta versão
Esta entrega é um PWA, não um APK Android nativo. As previsões recorrentes são projeções: não criam recebimentos automaticamente. Para evitar duplicidade, não cadastre o mesmo compromisso simultaneamente como conta e como lançamento, a menos que queira acompanhar os dois registros separadamente.
