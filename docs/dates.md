# 📅 Manipulação de Datas

Utilitários em `dateTime/`. Regra de ouro: **a natureza do valor decide o tratamento de fuso**, e ela é sempre **explícita** via `hasTimeStamp` — nunca adivinhada por formato de string.

- **Dia de calendário** — representa um _dia_, sem hora útil (nascimento, vencimento, competência, data de recebimento). Use `hasTimeStamp: false`. Gravado/exibido **sem fuso** (UTC), pra não "andar" para frente/trás na virada da meia-noite.
- **Instante** — um _momento_ no tempo (`createdAt`/`updatedAt`, agendamento com hora). Use `hasTimeStamp: true`. Gravado/exibido respeitando o **fuso local** do usuário.

> ⚠️ A mesma flag `hasTimeStamp` que decide a **gravação** decide a **exibição**. Misturar (ex.: salvar como dia de calendário e exibir como instante) faz o dia pular ±1.

> **Contrato de entrada:** as funções de transformação recebem **string ISO** (`YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm[...]`) — valor de `<input type="date">` / `<input type="datetime-local">` ou ISO vinda do backend. Formatos locais (`31/03/2026`, `2026/03/31`) **lançam erro** (fail loud), não silenciam num `Invalid Date`.

## Utilitários

- Utilitários em [`src/lib/dateTime/`](../src/lib/dateTime) cobrem parsing/formatação para inputs e queries (`transformIntoInputDate`, `transformIntoDatabaseDate`, `transformIntoDatabaseQueryDate`, `dateFormatter`). Reaproveite — não importe `date-fns` direto em telas.

## Resumo

| Função                           | Uso                                        |
| -------------------------------- | ------------------------------------------ |
| `dateFormatter`                  | Exibir data para o usuário                 |
| `transformIntoInputDate`         | Preencher inputs `date` / `datetime-local` |
| `transformIntoDatabaseDate`      | Persistir via body                         |
| `transformIntoDatabaseQueryDate` | Filtros/buscas via query                   |

## `dateFormatter` — exibição

Função única que cobre os 3 casos via flags:

```ts
dateFormatter({ date, hasTimeStamp, showHours });
```

| Flags                                  | Natureza          | Resultado                       |
| -------------------------------------- | ----------------- | ------------------------------- |
| `hasTimeStamp: false`                  | dia de calendário | `31/03/2026` (sem fuso, UTC)    |
| `hasTimeStamp: true, showHours: false` | instante          | `31/03/2026` (fuso local)       |
| `hasTimeStamp: true, showHours: true`  | instante          | `31/03/2026 11:35` (fuso local) |

`date` nulo/indefinido → `"-"`.

## `transformIntoInputDate` — preencher inputs

```ts
transformIntoInputDate({ date, hasTimeStamp });
```

- `hasTimeStamp: true` → `"YYYY-MM-DDTHH:mm"` (data e hora locais, para `datetime-local`)
- `hasTimeStamp: false` → `"YYYY-MM-DD"` (para `date`)
- `null | undefined` → `""`

## `transformIntoDatabaseDate` — persistir via body

```ts
transformIntoDatabaseDate({ date, hasTimeStamp, databaseDateHasTimeStamp });
```

- `hasTimeStamp: true` → instante exato em UTC (`toISOString`)
- `hasTimeStamp: false` + `databaseDateHasTimeStamp: false` → **dia de calendário**: meia-noite **UTC** (`2026-03-31T00:00:00.000Z`)
- `hasTimeStamp: false` + `databaseDateHasTimeStamp: true` → meia-noite no **fuso local** (banco guarda datetime)
- `null | undefined` → `null`

`databaseDateHasTimeStamp` (default `false`) = o backend espera data com hora? Data pura (nascimento etc.) quase sempre `false`.

## `transformIntoDatabaseQueryDate` — filtros via query

```ts
transformIntoDatabaseQueryDate({
  date,
  type,
  hasTimeStamp,
  databaseDateHasTimeStamp,
});
```

- `type: "start" | "end"` → borda inicial ou final do dia.
- `hasTimeStamp: true` → instante exato em UTC (`type` é ignorado)
- `hasTimeStamp: false` + banco `date` → bordas em **UTC** (`start` = `00:00:00.000Z`, `end` = `23:59:59.999Z`)
- `hasTimeStamp: false` + banco `datetime` → bordas no **fuso local**
- `null | undefined` → `""`

## Como escolher (decisão rápida)

1. O valor é um **dia** ou um **momento**? → define `hasTimeStamp`.
2. Vou **exibir**? → `dateFormatter`. **Preencher input**? → `transformIntoInputDate`. **Salvar**? → `transformIntoDatabaseDate`. **Filtrar**? → `transformIntoDatabaseQueryDate`.
3. Mantenha a **mesma** `hasTimeStamp` em toda a vida do dado (input → gravação → exibição).
