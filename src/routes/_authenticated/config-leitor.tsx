import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { listRooms, type Room } from "@/lib/admin.functions";
import { listScannerDevices, provisionScannerDevice, setScannerDeviceActive } from "@/lib/scanner.functions";
import { DEVICE_STORAGE_KEY } from "@/lib/scanner-device";

export const Route = createFileRoute("/_authenticated/config-leitor")({
  head: () => ({
    meta: [
      { title: "Configuração do leitor | Feira de Profissões 2026" },
      { name: "description", content: "Área administrativa para vincular um dispositivo leitor de QR Code a uma sala." },
      { property: "og:title", content: "Configuração do leitor de QR Code" },
      { property: "og:description", content: "Vincule o dispositivo de entrada a uma sala da Feira de Profissões." },
      { name: "robots", content: "noindex" },
    ],
    links: [
      { rel: "stylesheet", href: "/legacy/painel.css" },
      { rel: "stylesheet", href: "/legacy/app-extra.css" },
    ],
  }),
  component: ConfigLeitor,
});

function ConfigLeitor() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const buscarSalas = useServerFn(listRooms);
  const buscarDispositivos = useServerFn(listScannerDevices);
  const provisionar = useServerFn(provisionScannerDevice);
  const alternarAtivo = useServerFn(setScannerDeviceActive);

  const [andar, setAndar] = useState("");
  const [salaId, setSalaId] = useState("");
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [pronto, setPronto] = useState<{ sala: string; andar: string } | null>(null);

  const salas = useQuery({ queryKey: ["admin-rooms"], queryFn: () => buscarSalas() });
  const dispositivos = useQuery({ queryKey: ["scanner-devices"], queryFn: () => buscarDispositivos() });

  const andares = useMemo(() => {
    const lista: string[] = [];
    for (const s of salas.data ?? []) if (!lista.includes(s.andar)) lista.push(s.andar);
    return lista;
  }, [salas.data]);

  const salasDoAndar: Room[] = useMemo(
    () => (salas.data ?? []).filter((s) => s.andar === andar),
    [salas.data, andar],
  );

  async function salvar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem(null);
    if (!salaId) {
      setMensagem({ tipo: "erro", texto: "Selecione o andar e a sala." });
      return;
    }
    setSalvando(true);
    try {
      const r = await provisionar({ data: { nome: nome.trim() || "Leitor de entrada", roomId: salaId } });
      if (!r.ok) {
        setMensagem({ tipo: "erro", texto: r.error });
        return;
      }
      localStorage.setItem(DEVICE_STORAGE_KEY, r.token);
      setPronto({ sala: r.session.room.nome, andar: r.session.room.andar });
      setMensagem({ tipo: "ok", texto: `Dispositivo vinculado à ${r.session.room.nome}.` });
      await queryClient.invalidateQueries({ queryKey: ["scanner-devices"] });
    } catch {
      setMensagem({ tipo: "erro", texto: "Não foi possível salvar a configuração." });
    } finally {
      setSalvando(false);
    }
  }

  async function iniciarModoScanner() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/scanner", replace: true });
  }

  return (
    <div className="fx-painel">
      <header className="fx-painel-topo">
        <div>
          <h1>Configuração do leitor</h1>
          <p>Vincule este dispositivo a uma sala e ative o modo quiosque.</p>
        </div>
        <div className="fx-acoes">
          <Link to="/painel" className="fx-botao fx-botao-claro">
            Voltar ao painel
          </Link>
        </div>
      </header>

      {mensagem ? (
        <div className={`fx-msg fx-msg-${mensagem.tipo}`} role="status">
          {mensagem.texto}
        </div>
      ) : null}

      <section className="fx-bloco">
        <div className="fx-bloco-topo">
          <h2>Este dispositivo</h2>
        </div>
        <form onSubmit={salvar} className="fx-filtros" style={{ flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="Nome do dispositivo (ex.: Tablet entrada Sala 17)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={60}
          />
          <select
            value={andar}
            onChange={(e) => {
              setAndar(e.target.value);
              setSalaId("");
            }}
          >
            <option value="">Selecione o andar</option>
            {andares.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <select value={salaId} onChange={(e) => setSalaId(e.target.value)} disabled={!andar}>
            <option value="">Selecione a sala</option>
            {salasDoAndar.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
          <button type="submit" className="fx-botao" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar sala"}
          </button>
        </form>

        {pronto ? (
          <div className="fx-sala-banner" style={{ marginTop: "1rem" }}>
            Dispositivo pronto para <strong>{pronto.sala}</strong> ({pronto.andar}).
            <button
              type="button"
              className="fx-botao fx-botao-amarelo"
              style={{ marginLeft: "1rem" }}
              onClick={iniciarModoScanner}
            >
              Iniciar modo scanner
            </button>
          </div>
        ) : (
          <p className="fx-vazio">
            Ao iniciar o modo scanner, a sessão administrativa é encerrada neste dispositivo e ele passa a exibir
            apenas o leitor de QR Code.
          </p>
        )}
      </section>

      <section className="fx-bloco">
        <div className="fx-bloco-topo">
          <h2>Leitores configurados</h2>
        </div>
        {dispositivos.isLoading ? (
          <p className="fx-vazio">Carregando...</p>
        ) : (dispositivos.data ?? []).length === 0 ? (
          <p className="fx-vazio">Nenhum leitor configurado ainda.</p>
        ) : (
          <div className="fx-tabela-wrap">
            <table className="fx-tabela">
              <thead>
                <tr>
                  <th>Dispositivo</th>
                  <th>Sala</th>
                  <th>Situação</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {(dispositivos.data ?? []).map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong>{d.nome}</strong>
                    </td>
                    <td>
                      {d.room?.nome ?? "—"}
                      <br />
                      <small>{d.room?.andar ?? ""}</small>
                    </td>
                    <td>
                      {d.active ? (
                        <span className="fx-badge fx-badge-ok">Ativo</span>
                      ) : (
                        <span className="fx-badge">Revogado</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="fx-botao fx-botao-mini fx-botao-claro"
                        onClick={async () => {
                          await alternarAtivo({ data: { deviceId: d.id, active: !d.active } });
                          await queryClient.invalidateQueries({ queryKey: ["scanner-devices"] });
                        }}
                      >
                        {d.active ? "Revogar acesso" : "Reativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
