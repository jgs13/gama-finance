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
- Metas financeiras com valor-alvo, valor acumulado, prazo e registro manual de aportes.
- Painel de alertas para contas e faturas vencidas ou com vencimento nos próximos sete dias, lançamentos atrasados e prazos de metas.
- Benefícios e descontos informativos, sem abatimento automático do salário líquido.
- Backup e restauração em JSON, com validação da estrutura antes de substituir os dados locais.
- Interface responsiva e suporte a instalação/offline via PWA.

## Publicação
O projeto é publicado pelo GitHub Actions no GitHub Pages. Abra a URL HTTPS no Android e use a opção de instalar/adicionar à tela inicial do navegador.

## Dados e privacidade
Os dados ficam no armazenamento local do navegador/dispositivo. Não há conta, servidor ou sincronização em nuvem. Faça backups regulares e não limpe os dados do navegador sem exportar um backup.

## Limitações desta versão
Os alertas são exibidos dentro do aplicativo quando ele é aberto; esta versão não envia notificações push em segundo plano. Os aportes das metas são controles manuais e não movimentam dinheiro nem criam despesas automaticamente. Esta entrega é um PWA, não um APK Android nativo. As previsões recorrentes são projeções: não criam recebimentos automaticamente. Contas pagas são conciliadas com lançamentos de despesa quando data, valor e descrição correspondem, independentemente do status. Para evitar duplicidade de fluxo de caixa, não cadastre a mesma obrigação simultaneamente como conta e lançamento com descrições diferentes. O valor da fatura do cartão representa o compromisso de pagamento; despesas de compras no cartão devem ser registradas de forma consistente para não contar a mesma saída duas vezes.


## Projeto Android (Capacitor)

O repositório também contém a configuração para gerar um aplicativo Android com Capacitor.

### Gerar o APK de desenvolvimento

1. Instale Node.js 22 ou superior, Android Studio e Android SDK.
2. Execute `npm install`.
3. Execute `npm run android:add` (somente na primeira configuração).
4. Execute `npm run android:sync`.
5. Abra o projeto com `npm run android:open` ou compile pelo Android Studio.

O workflow **Build GAMA FINANCE Android APK** também compila automaticamente um APK de desenvolvimento em pushes que alteram os arquivos do app e pode ser iniciado manualmente em GitHub Actions. O arquivo gerado fica disponível como artefato da execução por 14 dias.

### Atenção à migração dos dados

O armazenamento do PWA no navegador e o armazenamento do APK são separados. Antes de começar a usar o APK, exporte um backup JSON no PWA e importe esse arquivo no aplicativo Android. Não desinstale o PWA nem apague os dados do navegador até confirmar que o backup foi importado corretamente.

Esta configuração prepara um APK **debug** para instalação e testes. Uma versão de distribuição exige assinatura de release e testes adicionais. As notificações nativas serão implementadas e testadas em uma etapa própria.


## Distribuição e atualização do APK

- Página pública de download: https://jgs13.github.io/gama-finance/download/
- O app consulta `latest.json` ao abrir e mostra um aviso dentro do aplicativo quando uma versão superior estiver publicada.
- Os APKs de distribuição são publicados em GitHub Releases com o nome estável `GamaFinance.apk`.
- Para publicar uma versão, crie uma tag no formato `vMAJOR.MINOR.PATCH` (ex.: `v1.0.1`). O workflow `Release GAMA FINANCE Android` compila, assina e publica o APK e atualiza os metadados usados pelo aviso interno.
- O APK de distribuição exige os segredos `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` e `ANDROID_KEY_PASSWORD` nas configurações do repositório. A mesma chave deve ser usada em todas as versões futuras; perder ou trocar essa chave impede atualização por cima da instalação anterior.
- A primeira instalação assinada pode exigir backup e reinstalação caso o usuário já tenha instalado o APK debug. Não desinstale antes de exportar os dados. As versões seguintes poderão ser instaladas por cima, desde que mantenham o mesmo certificado e o versionCode aumente.
- O botão de atualização abre o download do APK no navegador/gerenciador do Android; o usuário confirma a instalação no Android. Não há instalação silenciosa.
