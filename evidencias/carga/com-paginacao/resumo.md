# Resumo do teste de carga (k6)

- Alvo: http://localhost:3333
- Listagem no mock: paginada (correção proposta)
- Carga: 500 usuários simultâneos, rampa de 30s, 5m sustentados
- Duração total: 347 s
- Requisições: 322266 (929.6 por segundo)
- Jornadas completas: 107255; reservas criadas: 107255
- Falhas HTTP: 0.00%; checks aprovados: 100.00%
- Tempo de resposta geral: média 2.1 ms, p95 5.5 ms, p99 23.8 ms, máximo 261.1 ms
- Tempo da jornada (sem o tempo de pensar): p95 18.0 ms
- Tamanho da resposta da listagem: de 0.8 KB a 1.7 KB

## Tempo de resposta por endpoint

| Endpoint | Média | Mediana | p95 | p99 | Máximo |
|---|---|---|---|---|---|
| POST /auth | 1.1 ms | 0.7 ms | 1.8 ms | 3.8 ms | 94.6 ms |
| GET /booking | 2.3 ms | 1.0 ms | 5.7 ms | 27.0 ms | 261.1 ms |
| GET /booking/:id | 2.0 ms | 0.8 ms | 5.6 ms | 23.2 ms | 224.3 ms |
| POST /booking | 2.0 ms | 1.0 ms | 5.4 ms | 21.4 ms | 252.9 ms |

## Critérios de aceite (thresholds)

| Métrica | Regra | Resultado |
|---|---|---|
| `http_req_duration` | `p(95)<500` | OK |
| `http_req_duration` | `p(99)<1000` | OK |
| `http_req_duration{endpoint:GET /booking/:id}` | `p(95)<300` | OK |
| `http_req_duration{endpoint:GET /booking}` | `p(95)<500` | OK |
| `http_req_duration{endpoint:POST /booking}` | `p(95)<300` | OK |
| `http_req_failed` | `rate<0.01` | OK |
| `http_req_duration{endpoint:POST /auth}` | `p(95)<300` | OK |
| `checks` | `rate>0.99` | OK |
