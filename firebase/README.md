# GAMA FINANCE — autenticação e nuvem (ambiente de testes)

Esta pasta é a base do ambiente isolado `teste-login-familiar`. Não configure nem publique estes recursos no projeto oficial antes da validação.

## Modelo previsto
- Firebase Authentication com e-mail e senha: uma conta independente para cada pessoa.
- Firestore: um documento de família, no máximo dois membros, um documento de perfil por UID e uma trilha de auditoria somente de acréscimo.
- Cada membro pode ler os dois perfis da família, mas só pode gravar o próprio perfil.
- A tela Família agrega os perfis; Meu perfil e Perfil dela continuam separados.
- Cada gravação registra UID, e-mail, ação, perfil e horário do servidor.

## Configuração necessária
1. Criar um projeto Firebase separado para testes.
2. Ativar Authentication > Sign-in method > Email/Password.
3. Criar o banco Firestore em modo produção.
4. Publicar `firestore.rules` nas regras do banco.
5. Registrar um aplicativo Web e copiar a configuração pública para `firebase/firebase-config.js`, usando `firebase/firebase-config.example.js` como modelo. Esse arquivo real não deve conter service-account/private keys e não deve ser enviado ao repositório.
6. Configurar o domínio autorizado do site de testes no Firebase Authentication.

## Estrutura Firestore
- `families/{familyId}`: ownerUid, memberUids (máximo 2), invitedEmails, createdAt, updatedAt.
- `families/{familyId}/profiles/{uid}`: nome, dados financeiros e updatedAt.
- `families/{familyId}/audit/{eventId}`: actorUid, actorEmail, action, profileUid, createdAt e resumo sem dados sensíveis desnecessários.

O convite será por e-mail: o primeiro membro cadastra a conta e cria a família; adiciona o e-mail da segunda pessoa em invitedEmails. A segunda conta só entra se o e-mail autenticado corresponder ao convite. O aceite precisa ocorrer em transação Firestore, com validação adicional nas regras antes de habilitar o uso real.

## Estado
Esta pasta contém configuração-modelo e regras iniciais. A integração com a interface e o sincronismo bidirecional ainda precisam ser conectados e testados antes de considerar o login ativo. Não instalar como atualização oficial.
