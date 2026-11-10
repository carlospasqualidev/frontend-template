import { describe, expect, it } from 'vitest';

import {
  sortRows,
  type SortAccessors,
} from '@/components/global/dataTable/sortRows';

interface IRow {
  name: string;
  amount: number;
}

const ACCESSORS: SortAccessors<IRow> = new Map<
  string,
  (row: IRow) => string | number
>([
  ['name', (row) => row.name],
  ['amount', (row) => row.amount],
]);

const ROWS: IRow[] = [
  { name: 'Ótimo', amount: 10 },
  { name: 'ab', amount: 2 },
  { name: 'Ana', amount: 100 },
];

/** Comparador em memória das tabelas que recebem a lista inteira. */
describe('sortRows', () => {
  it('sem ordenação ativa, devolve a lista como veio do servidor', () => {
    expect(sortRows(ROWS, [], ACCESSORS)).toBe(ROWS);
  });

  it('coluna sem acessor não inventa ordem', () => {
    expect(
      sortRows(ROWS, [{ id: 'inexistente', desc: false }], ACCESSORS)
    ).toBe(ROWS);
  });

  it('número ordena por grandeza, e não pelo texto dele', () => {
    const ascending = sortRows(
      ROWS,
      [{ id: 'amount', desc: false }],
      ACCESSORS
    );

    // Por texto, '100' viria antes de '2'.
    expect(ascending.map((row) => row.amount)).toEqual([2, 10, 100]);
  });

  it('texto ordena em pt-BR: acento e caixa não jogam a linha para o fim', () => {
    const ascending = sortRows(ROWS, [{ id: 'name', desc: false }], ACCESSORS);

    expect(ascending.map((row) => row.name)).toEqual(['ab', 'Ana', 'Ótimo']);
  });

  it('`desc` inverte a ordem', () => {
    const decrescente = sortRows(
      ROWS,
      [{ id: 'amount', desc: true }],
      ACCESSORS
    );

    expect(decrescente.map((row) => row.amount)).toEqual([100, 10, 2]);
  });

  it('acessor que mistura número e texto não os compara: número vem antes', () => {
    const mixed: SortAccessors<IRow> = new Map([
      ['name', (row) => (row.amount > 5 ? row.amount : row.name)],
    ]);
    const result = sortRows(ROWS, [{ id: 'name', desc: false }], mixed);

    expect(result.map((row) => row.name)).toEqual(['Ótimo', 'Ana', 'ab']);
  });

  it('misto em desc: o texto vem antes dos números (inverte o crescente)', () => {
    const mixed: SortAccessors<IRow> = new Map([
      ['name', (row) => (row.amount > 5 ? row.amount : row.name)],
    ]);
    const result = sortRows(ROWS, [{ id: 'name', desc: true }], mixed);

    expect(result.map((row) => row.name)).toEqual(['ab', 'Ana', 'Ótimo']);
  });

  it('vazio (null/undefined) vai para o fim nos dois sentidos', () => {
    const rows = [
      { name: 'x', amount: 2 },
      { name: 'vazio', amount: NaN },
      { name: 'y', amount: 1 },
      { name: 'indef', amount: NaN },
    ];
    const accessors: SortAccessors<IRow> = new Map([
      [
        'amount',
        (row) =>
          row.name === 'vazio'
            ? null
            : row.name === 'indef'
              ? undefined
              : row.amount,
      ],
    ]);
    const asc = sortRows(rows, [{ id: 'amount', desc: false }], accessors);
    const desc = sortRows(rows, [{ id: 'amount', desc: true }], accessors);

    expect(asc.map((row) => row.name)).toEqual(['y', 'x', 'vazio', 'indef']);
    expect(desc.map((row) => row.name)).toEqual(['x', 'y', 'vazio', 'indef']);
  });

  it('empate mantém a ordem de entrada, também em desc', () => {
    const rows = [
      { name: 'a', amount: 1 },
      { name: 'b', amount: 1 },
      { name: 'c', amount: 1 },
    ];
    const asc = sortRows(rows, [{ id: 'amount', desc: false }], ACCESSORS);
    const desc = sortRows(rows, [{ id: 'amount', desc: true }], ACCESSORS);

    expect(asc.map((row) => row.name)).toEqual(['a', 'b', 'c']);
    expect(desc.map((row) => row.name)).toEqual(['a', 'b', 'c']);
  });

  it('não muta a lista recebida', () => {
    const original = [...ROWS];
    sortRows(ROWS, [{ id: 'amount', desc: true }], ACCESSORS);

    expect(ROWS).toEqual(original);
  });
});
