# Resumo do teste de carga (k6)

- Alvo: http://localhost:3333
- Listagem no mock: sem paginação, como a API real
- Carga: 500 usuários simultâneos, rampa de 30s, 5m sustentados
- Duração total: 346 s
- Requisições: 190452 (550.1 por segundo)
- Jornadas completas: 63317; reservas criadas: 63317
- Falhas HTTP: 0.00%; checks aprovados: 100.00%
- Tempo de resposta geral: média 352.2 ms, p95 1583.8 ms, p99 2196.2 ms, máximo 2609.6 ms
- Tempo da jornada (sem o tempo de pensar): p95 3337.0 ms
- Tamanho da resposta da listagem: de 0.8 KB a 1226.8 KB

## Tempo de resposta por endpoint

| Endpoint | Média | Mediana | p95 | p99 | Máximo |
|---|---|---|---|---|---|
| POST /auth | 0.7 ms | 0.6 ms | 1.6 ms | 2.1 ms | 3.9 ms |
| GET /booking | 417.5 ms | 92.0 ms | 1731.5 ms | 2247.6 ms | 2609.6 ms |
| GET /booking/:id | 426.1 ms | 95.9 ms | 1751.0 ms | 2251.3 ms | 2604.6 ms |
| POST /booking | 216.0 ms | 52.7 ms | 1053.3 ms | 1918.8 ms | 2605.0 ms |

## Critérios de aceite (thresholds)

| Métrica | Regra | Resultado |
|---|---|---|
| `http_req_duration{endpoint:POST /booking}` | `p(95)<300` | VIOLADO |
| `http_req_duration` | `p(95)<500` | VIOLADO |
| `http_req_duration` | `p(99)<1000` | VIOLADO |
| `http_req_duration{endpoint:GET /booking}` | `p(95)<500` | VIOLADO |
| `checks` | `rate>0.99` | OK |
| `http_req_duration{endpoint:GET /booking/:id}` | `p(95)<300` | VIOLADO |
| `http_req_duration{endpoint:POST /auth}` | `p(95)<300` | OK |
| `http_req_failed` | `rate<0.01` | OK |
