import {
  FormularioAbrirCaixa,
  FormularioFecharCaixa,
  FormularioMovimento,
} from "@/components/formularios-caixa";
import { Linha, Painel } from "@/components/ui";
import { exigirSessao } from "@/lib/autenticacao";
import {
  buscarCaixaAberto,
  resumirCaixa,
  ROTULO_PAGAMENTO,
  ultimosCaixasFechados,
  type ResumoCaixa,
} from "@/lib/caixa";
import { formatarHora } from "@/lib/datas";
import { formatarCentavos } from "@/lib/dinheiro";

export const metadata = { title: "Caixa" };
export const dynamic = "force-dynamic";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function Diferenca({ centavos }: { centavos: number }) {
  if (centavos === 0) {
    return <span className="text-ok">Conferiu certinho</span>;
  }
  return (
    <span className={centavos > 0 ? "text-alerta" : "text-perigo"}>
      {centavos > 0 ? "Sobrou " : "Faltou "}
      {formatarCentavos(Math.abs(centavos))}
    </span>
  );
}

function ExtratoDoTurno({ resumo }: { resumo: ResumoCaixa }) {
  const {
    caixa,
    vendasPorForma,
    faturamentoCentavos,
    quantidadeVendas,
    sangriasCentavos,
    suprimentosCentavos,
    esperadoNaGavetaCentavos,
  } = resumo;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-1 text-xs font-medium tracking-wide text-ink-fraco">
          Vendas do turno
        </h3>
        {quantidadeVendas === 0 ? (
          <p className="py-1.5 text-sm text-ink-medio">
            Nenhuma venda registrada neste turno ainda.
          </p>
        ) : (
          <>
            {vendasPorForma
              .filter((v) => v.quantidade > 0)
              .map((v) => (
                <Linha
                  key={v.forma}
                  rotulo={ROTULO_PAGAMENTO[v.forma]}
                  apoio={`${v.quantidade}×`}
                  valor={formatarCentavos(v.totalCentavos)}
                />
              ))}
            <div className="mt-1 border-t border-borda pt-1">
              <Linha
                rotulo="Faturamento do turno"
                valor={formatarCentavos(faturamentoCentavos)}
                destaque
              />
            </div>
          </>
        )}
      </div>

      <div className="border-t border-borda pt-4">
        <h3 className="mb-1 text-xs font-medium tracking-wide text-ink-fraco">
          O que deve estar na gaveta
        </h3>
        <Linha
          rotulo="Troco inicial"
          valor={formatarCentavos(caixa.valorAberturaCentavos)}
        />
        <Linha
          rotulo="Vendas em dinheiro"
          valor={formatarCentavos(resumo.emDinheiroCentavos)}
        />
        {suprimentosCentavos > 0 && (
          <Linha
            rotulo="Suprimentos"
            valor={formatarCentavos(suprimentosCentavos)}
          />
        )}
        {sangriasCentavos > 0 && (
          <Linha
            rotulo="Sangrias"
            valor={`− ${formatarCentavos(sangriasCentavos)}`}
          />
        )}
        <div className="mt-1 border-t border-borda pt-1">
          <Linha
            rotulo="Esperado em espécie"
            valor={formatarCentavos(esperadoNaGavetaCentavos)}
            destaque
          />
        </div>
        {/* Pix e cartão entram no faturamento mas não na gaveta. Não dizer
            isso em voz alta é o que faz operador achar que o caixa quebrou. */}
        <p className="mt-2 text-xs text-ink-fraco">
          Pix, débito e crédito contam no faturamento, mas não na gaveta.
        </p>
      </div>
    </div>
  );
}

export default async function PaginaCaixa() {
  await exigirSessao();

  const aberto = await buscarCaixaAberto();
  const resumo = aberto ? await resumirCaixa(aberto.id) : null;
  const historico = await ultimosCaixasFechados(5);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Caixa</h1>
        <p className="mt-1 text-sm text-ink-medio">
          {resumo
            ? `Aberto às ${formatarHora(resumo.caixa.abertoEm)} por ${resumo.caixa.usuarioAbertura.nome}.`
            : "Nenhum caixa aberto no momento."}
        </p>
      </header>

      {resumo ? (
        <>
          <Painel titulo="Turno em andamento">
            <ExtratoDoTurno resumo={resumo} />
          </Painel>

          <div className="grid gap-6 md:grid-cols-2">
            <Painel titulo="Sangria">
              <p className="mb-3 text-sm text-ink-medio">
                Retirada de dinheiro da gaveta — depósito, pagamento de
                fornecedor, guarda no cofre.
              </p>
              <FormularioMovimento tipo="SANGRIA" />
            </Painel>

            <Painel titulo="Suprimento">
              <p className="mb-3 text-sm text-ink-medio">
                Entrada de dinheiro que não veio de venda, como reforço de
                troco.
              </p>
              <FormularioMovimento tipo="SUPRIMENTO" />
            </Painel>
          </div>

          {resumo.movimentos.length > 0 && (
            <Painel titulo="Movimentos do turno">
              <ul className="divide-y divide-borda">
                {resumo.movimentos.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0"
                  >
                    <div>
                      <p className="text-sm">
                        {m.tipo === "SANGRIA" ? "Sangria" : "Suprimento"} ·{" "}
                        <span className="text-ink-medio">{m.motivo}</span>
                      </p>
                      <p className="text-xs text-ink-fraco">
                        {formatarHora(m.criadoEm)} · {m.usuario.nome}
                      </p>
                    </div>
                    <span data-numerico className="text-sm">
                      {m.tipo === "SANGRIA" ? "− " : "+ "}
                      {formatarCentavos(m.valorCentavos)}
                    </span>
                  </li>
                ))}
              </ul>
            </Painel>
          )}

          <Painel titulo="Fechar o turno">
            <FormularioFecharCaixa
              esperadoNaGavetaCentavos={resumo.esperadoNaGavetaCentavos}
            />
          </Painel>
        </>
      ) : (
        <Painel titulo="Abrir caixa">
          <p className="mb-4 max-w-prose text-sm text-ink-medio">
            O caixa separa o dinheiro de um turno do de outro. Sem ele aberto
            não é possível registrar venda, porque não haveria a qual turno
            atribuí-la.
          </p>
          <FormularioAbrirCaixa />
        </Painel>
      )}

      {historico.length > 0 && (
        <Painel titulo="Turnos anteriores">
          <ul className="divide-y divide-borda">
            {historico.map((h) => (
              <li
                key={h.caixa.id}
                className="flex flex-wrap items-baseline justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    {h.caixa.fechadoEm
                      ? dataHora.format(h.caixa.fechadoEm)
                      : "—"}
                  </p>
                  <p className="text-xs text-ink-fraco">
                    {h.caixa.usuarioAbertura.nome} · {h.quantidadeVendas}{" "}
                    {h.quantidadeVendas === 1 ? "venda" : "vendas"}
                  </p>
                </div>
                <div className="text-right">
                  <p data-numerico className="text-sm">
                    {formatarCentavos(h.faturamentoCentavos)}
                  </p>
                  <p className="text-xs">
                    {h.diferencaCentavos === null ? (
                      <span className="text-ink-fraco">Sem conferência</span>
                    ) : (
                      <Diferenca centavos={h.diferencaCentavos} />
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Painel>
      )}
    </div>
  );
}
