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

## Limite desta etapa
A autenticação e o vínculo familiar estão preparados, mas os lançamentos financeiros ainda não foram migrados/sincronizados no Firestore. O app permanece no modo local quando `firebase-config.js` está vazio. A próxima etapa é integrar os perfis financeiros ao Firestore, importar os dados locais de forma explícita e registrar auditoria de cada alteração. Não publique esta branch como versão oficial antes de concluir os testes e a sincronização.
