# GAMA FINANCE — login familiar (ambiente de testes)

O projeto Firebase do GAMA FINANCE deve ser separado do projeto usado pelo Gama Drive. A autenticação e os dados financeiros não devem ser misturados.

## Modelo ativo
- Uma conta individual por pessoa, com e-mail e senha.
- Um espaço familiar com no máximo duas contas vinculadas.
- O primeiro usuário cria a família e gera um convite por link para o e-mail da segunda pessoa.
- O convite expira em sete dias e só pode ser aceito por uma conta autenticada com o mesmo e-mail convidado.
- Cada membro pode consultar e editar os dois perfis financeiros compartilhados.
- O Firestore registra o autor e o horário de cada gravação de perfil em uma trilha de auditoria append-only.
- O app mantém dados locais e sincroniza os perfis da família em tempo real.

## Configuração necessária
1. Criar um projeto Firebase separado para o GAMA FINANCE.
2. Ativar Authentication > Sign-in method > E-mail/senha.
3. Criar o banco Firestore em modo de produção.
4. Registrar um aplicativo Web e copiar a configuração pública para o arquivo raiz `firebase-config.js`.
5. Publicar as regras do arquivo raiz `firestore.rules` no Firestore.
6. Adicionar o domínio do site de testes em Authentication > Settings > Authorized domains.

A configuração Web contém identificadores públicos do app. Nunca coloque senhas, chaves privadas ou arquivos de service account no repositório.

## Coleções
- `users/{uid}`: e-mail e vínculo familiar do usuário.
- `families/{familyId}`: proprietário e contagem de membros.
- `families/{familyId}/members/{uid}`: membros autorizados.
- `families/{familyId}/profiles/{uid}`: dados financeiros do perfil.
- `families/{familyId}/audit/{eventId}`: autor, perfil alterado e horário.
- `invitations/{inviteId}`: convite de uso único com e-mail destinatário e validade.

## Estado
A interface, o fluxo de convite e a integração de sincronização estão implementados na branch de testes. A configuração Firebase ainda está vazia e a integração não foi testada contra um projeto real. Antes de qualquer publicação, validar cadastro, login, convite nos dois aparelhos, sincronização simultânea, regras, recuperação de senha e preservação dos dados locais.
