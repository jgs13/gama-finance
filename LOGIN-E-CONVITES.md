# Login e convites — GAMA FINANCE (teste)

Esta etapa adiciona autenticação por e-mail/senha e vínculo familiar por convite individual. O Gama Drive não é alterado e não deve compartilhar o mesmo projeto Firebase.

## Preparar o Firebase
1. Crie um projeto Firebase exclusivo para o GAMA FINANCE.
2. Ative Authentication > Sign-in method > E-mail/senha.
3. Registre um aplicativo Web e copie a configuração pública para `firebase-config.js`.
4. Crie o banco Firestore em modo de produção.
5. Publique as regras com `firebase deploy --only firestore:rules`.

A configuração Web do Firebase contém identificadores públicos do app; não coloque senhas de serviço, chaves privadas ou arquivos de service account no repositório.

## Fluxo implementado
- Cadastro e login individual por e-mail/senha.
- Recuperação de senha por e-mail.
- Criação do espaço familiar pelo primeiro usuário.
- Convite direcionado ao e-mail da segunda pessoa, por link exclusivo com validade de sete dias.
- Aceitação somente pela conta autenticada com o mesmo e-mail convidado.
- Listagem de membros e saída da conta.

## Sincronização financeira
- Cada perfil é armazenado em `families/{familyId}/profiles/{uid}`.
- Os membros da família podem consultar os dois perfis e editar dados compartilhados; cada gravação registra o UID e o e-mail do autor em `families/{familyId}/audit`.
- O app mantém uma cópia local e acompanha atualizações do Firestore em tempo real.
- Na primeira conexão, os dados locais são preservados em uma cópia local chamada `gama-finance-pre-cloud-backup-v1`; dados locais e remotos são combinados por identificador antes de continuar.

## Antes de liberar
Esta branch ainda precisa ser testada com um projeto Firebase de testes real: cadastro em dois aparelhos, convite, aceitação, sincronização simultânea, edição/exclusão, regras e recuperação de senha. O Firebase não está conectado enquanto `firebase-config.js` estiver vazio. Não publique esta branch como versão oficial antes desses testes.
