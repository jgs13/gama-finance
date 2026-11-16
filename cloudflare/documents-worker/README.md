# GAMA FINANCE — análise de documentos

Serviço separado do Firebase/Firestore de dados financeiros.

- R2 privado: `gama-finance-documentos`
- Worker: `gama-finance-documentos`
- URL: `https://gama-finance-documentos.gamafinance.workers.dev`
- Projeto Firebase autorizado: `gama-finance-teste`
- Arquivos: PDF, JPEG, PNG e WEBP, até 8 MB.
- Autorização: Firebase ID token validado por assinatura RS256, issuer, audience e expiração. Cada usuário só acessa objetos sob seu UID.
- Análise: Workers AI Markdown Conversion e `@cf/meta/llama-3.1-8b-instruct`.
- O Worker nunca grava receitas/despesas no Firestore; retorna extração para revisão no app.
- Não há URLs públicas para os arquivos nem credenciais secretas no APK.

## Rotas
- `GET /health`
- `POST /upload` multipart `file`
- `GET /documents`
- `POST /documents/:id/analyze`
- `DELETE /documents/:id`

## Configuração Cloudflare
Binding R2 `DOCUMENTS` -> bucket `gama-finance-documentos`.
Binding Workers AI `AI`.
