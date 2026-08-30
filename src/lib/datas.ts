/**
 * Recortes de tempo do negócio.
 *
 * A loja abre às 17h e fecha depois da meia-noite, então "hoje" no calendário
 * corta um turno ao meio. Estes helpers usam o dia civil (00h às 24h) porque é
 * assim que o dono lê o extrato do banco; o total de um turno que cruza a
 * meia-noite é responsabilidade do fechamento de caixa, não do dia.
 */

export function inicioDoDia(referencia = new Date()): Date {
  const d = new Date(referencia);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function fimDoDia(referencia = new Date()): Date {
  const d = inicioDoDia(referencia);
  d.setDate(d.getDate() + 1);
  return d;
}

export function inicioDoMes(referencia = new Date()): Date {
  const d = new Date(referencia);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function fimDoMes(referencia = new Date()): Date {
  const d = inicioDoMes(referencia);
  d.setMonth(d.getMonth() + 1);
  return d;
}

const dataLonga = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

const horaCurta = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

export const formatarDataLonga = (d: Date) => dataLonga.format(d);
export const formatarHora = (d: Date) => horaCurta.format(d);

export function nomeDoMes(referencia = new Date()): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(referencia);
}
