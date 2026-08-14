import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { LeitorQrCode } from "@/components/LeitorQrCode";
import { getScannerSession, scanRoomEntry, type ScannerSession } from "@/lib/scanner.functions";
import { lerTokenDispositivo } from "@/lib/scanner-device";

export const Route = createFileRoute("/scanner")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Leitor de QR Code | Feira de Profissões 2026" },
      { name: "description", content: "Terminal de leitura de QR Code para registrar a entrada de visitantes na sala." },
      { property: "og:title", content: "Leitor de QR Code — Feira de Profissões 2026" },
      { property: "og:description", content: "Terminal de check-in de visitantes por sala." },
      { name: "robots", content: "noindex" },
    ],
    links: [
      { rel: "stylesheet", href: "/legacy/painel.css" },
      { rel: "stylesheet", href: "/legacy/app-extra.css" },
    ],
  }),
  component: ScannerKiosk,
});

function hora(valor: string) {
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

type Resultado =
  | { tipo: "ok"; visitante: string; sala: string; andar: string; hora: string }
  | { tipo: "aviso"; texto: string }
  | { tipo: "erro"; texto: string };

function ScannerKiosk() {
  const carregarSessao = useServerFn(getScannerSession);
  const registrar = useServerFn(scanRoomEntry);

  const [sessao, setSessao] = useState<ScannerSession | null>(null);
  const [erroSessao, setErroSessao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    const token = lerTokenDispositivo();
    if (!token) {
      setErroSessao("Este dispositivo ainda não foi configurado por um administrador.");
      setCarregando(false);
      return;
    }
    let ativo = true;
    carregarSessao({ data: { deviceToken: token } })
      .then((r) => {
        if (!ativo) return;
        if (r.ok) setSessao(r.session);
        else setErroSessao(r.error);
      })
      .catch(() => ativo && setErroSessao("Não foi possível validar este leitor."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [carregarSessao]);

  useEffect(() => {
    if (!resultado) return;
    const t = setTimeout(() => setResultado(null), 8_000);
    return () => clearTimeout(t);
  }, [resultado]);

  const onLeitura = useCallback(
    async (texto: string) => {
      const token = lerTokenDispositivo();
      if (!token || processando) return;
      setProcessando(true);
      try {
        const r = await registrar({ data: { deviceToken: token, qrToken: texto } });
        if (!r.ok) {
          setResultado({ tipo: "erro", texto: r.error });
        } else if (r.already) {
          setResultado({
            tipo: "aviso",
            texto: `${r.visitante} já registrou entrada nesta sala em ${hora(r.enteredAt)}.`,
          });
        } else {
          setResultado({
            tipo: "ok",
            visitante: r.visitante,
            sala: r.sala,
            andar: r.andar,
            hora: hora(r.enteredAt),
          });
        }
      } catch {
        setResultado({ tipo: "erro", texto: "Falha ao registrar a entrada. Tente novamente." });
      } finally {
        setProcessando(false);
      }
    },
    [registrar, processando],
  );

  if (carregando) {
    return (
      <div className="fx-kiosk">
        <p className="fx-vazio">Verificando este leitor...</p>
      </div>
    );
  }

  if (!sessao) {
    return (
      <div className="fx-kiosk">
        <div className="fx-kiosk-cabecalho">
          <h1>Leitor de QR Code</h1>
        </div>
        <div className="fx-msg fx-msg-erro" role="alert">
          {erroSessao} Procure a organização da Feira de Profissões.
        </div>
      </div>
    );
  }

  return (
    <div className="fx-kiosk">
      <div className="fx-kiosk-cabecalho">
        <h1>Leitor de QR Code</h1>
        <p className="fx-kiosk-sala">
          {sessao.room.nome} <span>· {sessao.room.andar}</span>
        </p>
      </div>

      <div className="fx-kiosk-camera">
        <LeitorQrCode ativo onLeitura={onLeitura} />
      </div>

      <p className="fx-kiosk-instrucao">Aponte o QR Code do visitante para a câmera.</p>

      {resultado?.tipo === "ok" ? (
        <div className="fx-scan-ok fx-kiosk-feedback" role="status" aria-live="polite">
          <span className="fx-scan-ok-icone" aria-hidden="true">
            ✓
          </span>
          <div className="fx-scan-ok-corpo">
            <p className="fx-scan-ok-titulo">Entrada registrada com sucesso!</p>
            <p className="fx-scan-ok-linha">
              Visitante: <strong>{resultado.visitante}</strong>
            </p>
            <p className="fx-scan-ok-linha">
              Sala: <strong>{resultado.sala}</strong> · {resultado.andar}
            </p>
            <p className="fx-scan-ok-linha">Horário: {resultado.hora}</p>
          </div>
        </div>
      ) : resultado ? (
        <div className={`fx-msg fx-msg-${resultado.tipo} fx-kiosk-feedback`} role="status" aria-live="polite">
          {resultado.texto}
        </div>
      ) : null}
    </div>
  );
}
