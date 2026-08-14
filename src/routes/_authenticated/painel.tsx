import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LeitorQrCode } from "@/components/LeitorQrCode";
import { QrCodeVisitante } from "@/components/QrCodeVisitante";
import {
  checkInParticipant,
  getAdminProfile,
  listParticipants,
  listRoomEntries,
  listRooms,
  registerRoomEntry,
  type AdminParticipant,
  type Room,
} from "@/lib/admin.functions";

type Status = "todos" | "presentes" | "ausentes";
type FiltroSala = "todos" | "entraram" | "nao-entraram";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Painel de credenciamento | Feira de Profissões 2026" },
      { name: "description", content: "Painel da organização para credenciamento e controle de entrada nas salas." },
      { property: "og:title", content: "Painel de credenciamento" },
      { property: "og:description", content: "Gestão de inscrições e entradas por sala da Feira de Profissões 2026." },
      { name: "robots", content: "noindex" },
    ],
    links: [
      { rel: "stylesheet", href: "/legacy/painel.css" },
      { rel: "stylesheet", href: "/legacy/app-extra.css" },
    ],
  }),
  component: Painel,
});

function formatarData(valor: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function Painel() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const buscar = useServerFn(listParticipants);
  const credenciar = useServerFn(checkInParticipant);
  const buscarSalas = useServerFn(listRooms);
  const buscarEntradas = useServerFn(listRoomEntries);
  const registrarSala = useServerFn(registerRoomEntry);

  const [busca, setBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [status, setStatus] = useState<Status>("todos");
  const [salaSelecionada, setSalaSelecionada] = useState<string>("");
  const [filtroSala, setFiltroSala] = useState<FiltroSala>("todos");
  const [scanner, setScanner] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "aviso" | "erro"; texto: string } | null>(null);
  const [perfil, setPerfil] = useState<{ nome: string; email: string } | null>(null);
  const [processando, setProcessando] = useState(false);
  const [qrVisitante, setQrVisitante] = useState<AdminParticipant | null>(null);
  const [confirmacao, setConfirmacao] = useState<{ nome: string; sala: string; andar: string; hora: string } | null>(
    null,
  );

  useEffect(() => {
    if (!confirmacao) return;
    const t = setTimeout(() => setConfirmacao(null), 10_000);
    return () => clearTimeout(t);
  }, [confirmacao]);

  useEffect(() => {
    const t = setTimeout(() => setBuscaAtiva(busca.trim()), 350);
    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    getAdminProfile()
      .then(setPerfil)
      .catch(() => setPerfil(null));
  }, []);

  const salas = useQuery({ queryKey: ["admin-rooms"], queryFn: () => buscarSalas() });

  const lista = useQuery({
    queryKey: ["admin-participants", buscaAtiva, status],
    queryFn: () => buscar({ data: { search: buscaAtiva, status } }),
    refetchInterval: 20_000,
  });

  const entradas = useQuery({
    queryKey: ["admin-room-entries"],
    queryFn: () => buscarEntradas(),
    refetchInterval: 20_000,
  });

  const salasPorAndar = useMemo(() => {
    const grupos: Array<{ andar: string; salas: Room[] }> = [];
    for (const sala of salas.data ?? []) {
      const grupo = grupos.find((g) => g.andar === sala.andar);
      if (grupo) grupo.salas.push(sala);
      else grupos.push({ andar: sala.andar, salas: [sala] });
    }
    return grupos;
  }, [salas.data]);

  const salaAtual = (salas.data ?? []).find((s) => s.id === salaSelecionada) ?? null;
  const entradasPorParticipante = entradas.data?.byParticipant ?? {};

  const invalidar = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-participants"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-room-entries"] }),
    ]);
  }, [queryClient]);

  const registrarEntradaSala = useCallback(
    async (args: { token?: string; participantId?: string }) => {
      if (!salaSelecionada) {
        setMensagem({ tipo: "aviso", texto: "Selecione a sala antes de registrar a entrada." });
        return;
      }
      setProcessando(true);
      try {
        const r = await registrarSala({ data: { ...args, roomId: salaSelecionada } });
        if (!r.ok) {
          setConfirmacao(null);
          setMensagem({ tipo: "erro", texto: r.error });
        } else if (r.already) {
          setConfirmacao(null);
          setMensagem({
            tipo: "aviso",
            texto: `${r.participant.nome} já havia entrado na ${r.room.nome} em ${formatarData(r.enteredAt)}.`,
          });
        } else {
          setMensagem(null);
          setConfirmacao({
            nome: r.participant.nome,
            sala: r.room.nome,
            andar: r.room.andar,
            hora: formatarData(r.enteredAt ?? new Date().toISOString()),
          });
        }
        await invalidar();
      } catch {
        setConfirmacao(null);
        setMensagem({ tipo: "erro", texto: "Falha ao registrar a entrada na sala." });
      } finally {
        setProcessando(false);
      }
    },
    [registrarSala, salaSelecionada, invalidar],
  );

  const registrarCredenciamento = useCallback(
    async (id: string, nome: string) => {
      setProcessando(true);
      try {
        const r = await credenciar({ data: { id } });
        if (!r.ok) setMensagem({ tipo: "erro", texto: r.error });
        else if (r.already) setMensagem({ tipo: "aviso", texto: `${nome} já havia sido credenciado(a).` });
        else setMensagem({ tipo: "ok", texto: `Presença confirmada: ${nome}.` });
        await invalidar();
      } catch {
        setMensagem({ tipo: "erro", texto: "Falha ao registrar o credenciamento." });
      } finally {
        setProcessando(false);
      }
    },
    [credenciar, invalidar],
  );

  const onLeitura = useCallback(
    async (texto: string) => {
      setMensagem(null);
      await registrarEntradaSala({ token: texto });
    },
    [registrarEntradaSala],
  );

  async function sair() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const todosParticipantes: AdminParticipant[] = lista.data?.participants ?? [];
  const participantes = useMemo(() => {
    if (filtroSala === "todos" || !salaSelecionada) return todosParticipantes;
    return todosParticipantes.filter((p) => {
      const entrou = (entradasPorParticipante[p.id] ?? []).some((e) => e.room_id === salaSelecionada);
      return filtroSala === "entraram" ? entrou : !entrou;
    });
  }, [todosParticipantes, filtroSala, salaSelecionada, entradasPorParticipante]);

  const stats = lista.data?.stats ?? { total: 0, presentes: 0, ausentes: 0 };
  const listaSalas = salas.data ?? [];

  return (
    <div className="fx-painel">
      <header className="fx-painel-topo">
        <div>
          <h1>Painel de credenciamento</h1>
          <p>{perfil ? `Conectado como ${perfil.nome}` : "Feira de Profissões 2026"}</p>
        </div>
        <div className="fx-acoes">
          <Link to="/config-leitor" className="fx-botao fx-botao-claro">
            Configurar leitor
          </Link>
          <Link to="/" className="fx-botao fx-botao-claro">
            Ver site
          </Link>
          <button type="button" className="fx-botao fx-botao-amarelo" onClick={sair}>
            Sair
          </button>
        </div>
      </header>

      <section className="fx-stats">
        <div className="fx-stat">
          <strong>{stats.total}</strong>
          <span>Inscritos</span>
        </div>
        <div className="fx-stat">
          <strong>{stats.presentes}</strong>
          <span>Presentes</span>
        </div>
        <div className="fx-stat">
          <strong>{stats.ausentes}</strong>
          <span>Aguardando</span>
        </div>
      </section>

      {mensagem ? (
        <div className={`fx-msg fx-msg-${mensagem.tipo}`} role="status">
          {mensagem.texto}
        </div>
      ) : null}

      <section className="fx-bloco">
        <div className="fx-bloco-topo">
          <h2>Sala do leitor</h2>
          {salaAtual ? (
            <span className="fx-sala-atual">
              Lendo em: <strong>{salaAtual.nome}</strong> · {salaAtual.andar}
            </span>
          ) : (
            <span className="fx-sala-atual fx-sala-atual-vazia">Nenhuma sala selecionada</span>
          )}
        </div>

        {salas.isLoading ? <p className="fx-vazio">Carregando salas...</p> : null}

        {salasPorAndar.map((grupo) => (
          <div key={grupo.andar} className="fx-andar">
            <h3 className="fx-andar-titulo">{grupo.andar}</h3>
            <div className="fx-salas">
              {grupo.salas.map((sala) => (
                <button
                  key={sala.id}
                  type="button"
                  className={sala.id === salaSelecionada ? "fx-sala-chip fx-sala-chip-ativa" : "fx-sala-chip"}
                  aria-pressed={sala.id === salaSelecionada}
                  onClick={() => {
                    setMensagem(null);
                    setSalaSelecionada(sala.id);
                  }}
                >
                  {sala.nome}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="fx-bloco">
        <div className="fx-bloco-topo">
          <h2>Leitor de QR Code</h2>
          <button
            type="button"
            className={scanner ? "fx-botao fx-botao-claro" : "fx-botao"}
            disabled={!salaSelecionada}
            onClick={() => {
              setMensagem(null);
              setScanner((s) => !s);
            }}
          >
            {scanner ? "Fechar câmera" : "Abrir câmera"}
          </button>
        </div>

        {confirmacao ? (
          <div className="fx-scan-ok" role="status" aria-live="polite">
            <span className="fx-scan-ok-icone" aria-hidden="true">
              ✓
            </span>
            <div className="fx-scan-ok-corpo">
              <p className="fx-scan-ok-titulo">Entrada registrada com sucesso!</p>
              <p className="fx-scan-ok-linha">
                Visitante: <strong>{confirmacao.nome}</strong>
              </p>
              <p className="fx-scan-ok-linha">
                Sala: <strong>{confirmacao.sala}</strong> · {confirmacao.andar}
              </p>
              <p className="fx-scan-ok-linha">Horário: {confirmacao.hora}</p>
            </div>
          </div>
        ) : null}

        {!salaSelecionada ? (
          <p className="fx-vazio">Selecione primeiro a sala em que o leitor está sendo usado.</p>
        ) : scanner ? (
          <>
            <div className="fx-sala-banner">
              Registrando entradas em <strong>{salaAtual?.nome}</strong> ({salaAtual?.andar})
            </div>
            <LeitorQrCode ativo={scanner} onLeitura={onLeitura} />
          </>
        ) : (
          <p className="fx-vazio">
            Abra a câmera para ler o QR Code do visitante e registrar a entrada em {salaAtual?.nome}.
          </p>
        )}
      </section>

      <section className="fx-bloco">
        <div className="fx-bloco-topo">
          <h2>Entradas por sala</h2>
        </div>
        {entradas.isLoading ? (
          <p className="fx-vazio">Carregando relatório...</p>
        ) : (
          <div className="fx-tabela-wrap">
            <table className="fx-tabela">
              <thead>
                <tr>
                  <th>Sala</th>
                  <th>Andar</th>
                  <th>Entraram</th>
                  <th>Não entraram</th>
                </tr>
              </thead>
              <tbody>
                {(entradas.data?.stats ?? []).map((s) => (
                  <tr key={s.room.id}>
                    <td>
                      <strong>{s.room.nome}</strong>
                    </td>
                    <td>{s.room.andar}</td>
                    <td>
                      <span className="fx-badge fx-badge-ok">{s.entraram}</span>
                    </td>
                    <td>
                      <span className="fx-badge">{s.naoEntraram}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="fx-bloco">
        <div className="fx-bloco-topo">
          <h2>Buscar inscrição / Recuperar QR Code</h2>
        </div>
        <div className="fx-filtros">
          <input
            type="search"
            placeholder="Buscar por nome, e-mail, telefone, código ou ID da inscrição"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            maxLength={120}
          />
          <select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
            <option value="todos">Todos</option>
            <option value="presentes">Presentes</option>
            <option value="ausentes">Aguardando</option>
          </select>
          <select
            value={filtroSala}
            onChange={(e) => setFiltroSala(e.target.value as FiltroSala)}
            disabled={!salaSelecionada}
            title={salaSelecionada ? undefined : "Selecione uma sala para filtrar"}
          >
            <option value="todos">Todas as salas</option>
            <option value="entraram">Entraram em {salaAtual?.nome ?? "sala"}</option>
            <option value="nao-entraram">Não entraram em {salaAtual?.nome ?? "sala"}</option>
          </select>
        </div>

        {lista.isError ? (
          <div className="fx-msg fx-msg-erro">Não foi possível carregar os visitantes.</div>
        ) : null}

        {lista.isLoading ? (
          <p className="fx-vazio">Carregando visitantes...</p>
        ) : participantes.length === 0 ? (
          <p className="fx-vazio">Nenhum visitante encontrado com esses filtros.</p>
        ) : (
          <div className="fx-tabela-wrap">
            <table className="fx-tabela">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Contato</th>
                  <th>Código</th>
                  <th>Salas visitadas</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {participantes.map((p) => {
                  const minhas = entradasPorParticipante[p.id] ?? [];
                  const entrouNaSala = salaSelecionada ? minhas.some((e) => e.room_id === salaSelecionada) : false;
                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.nome}</strong>
                        <br />
                        <small>Inscrito em {formatarData(p.created_at)}</small>
                      </td>
                      <td>
                        {p.email}
                        <br />
                        <small>{p.telefone}</small>
                      </td>
                      <td>
                        <code className="fx-codigo-inline">{p.qr_token}</code>
                        <br />
                        {p.checked_in ? (
                          <span className="fx-badge fx-badge-ok">Presente</span>
                        ) : (
                          <span className="fx-badge">Aguardando</span>
                        )}
                      </td>
                      <td>
                        <div className="fx-salas-status">
                          {listaSalas.map((sala) => {
                            const entrada = minhas.find((e) => e.room_id === sala.id);
                            return (
                              <span
                                key={sala.id}
                                className={entrada ? "fx-sala-tag fx-sala-tag-ok" : "fx-sala-tag"}
                                title={entrada ? `Entrou em ${formatarData(entrada.entered_at)}` : "Não entrou"}
                              >
                                {sala.nome} {entrada ? "✓" : "✗"}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        {!salaSelecionada ? (
                          <span className="fx-vazio" style={{ margin: 0 }}>
                            Selecione a sala
                          </span>
                        ) : entrouNaSala ? (
                          <span className="fx-vazio" style={{ margin: 0 }}>
                            Já entrou
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="fx-botao fx-botao-mini"
                            disabled={processando}
                            onClick={() => registrarEntradaSala({ participantId: p.id })}
                          >
                            Registrar em {salaAtual?.nome}
                          </button>
                        )}
                        {!p.checked_in ? (
                          <>
                            <br />
                            <button
                              type="button"
                              className="fx-botao fx-botao-mini fx-botao-claro"
                              disabled={processando}
                              onClick={() => registrarCredenciamento(p.id, p.nome)}
                            >
                              Credenciar
                            </button>
                          </>
                        ) : null}
                        <br />
                        <button
                          type="button"
                          className="fx-botao fx-botao-mini fx-botao-amarelo"
                          onClick={() => setQrVisitante(p)}
                        >
                          Ver QR Code
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {qrVisitante ? <QrCodeVisitante participante={qrVisitante} onFechar={() => setQrVisitante(null)} /> : null}
    </div>
  );
}
