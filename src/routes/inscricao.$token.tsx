import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getRegistrationByToken } from "@/lib/participants.functions";

const registrationQuery = (token: string) =>
  queryOptions({
    queryKey: ["inscricao", token],
    queryFn: () => getRegistrationByToken({ data: { token } }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/inscricao/$token")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(registrationQuery(params.token)),
  head: () => ({
    meta: [
      { title: "Inscrição confirmada | Feira de Profissões 2026" },
      {
        name: "description",
        content: "Sua inscrição na Feira de Profissões 2026 foi confirmada. Guarde seu QR Code para o credenciamento.",
      },
      { property: "og:title", content: "Inscrição confirmada — Feira de Profissões 2026" },
      { property: "og:description", content: "Apresente seu QR Code na entrada do evento para fazer o credenciamento." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "stylesheet", href: "/legacy/app-extra.css" }],
  }),
  component: Confirmacao,
  errorComponent: () => (
    <div className="fx-page">
      <div className="fx-card">
        <h1>Não foi possível carregar</h1>
        <p className="fx-sub">Tente novamente em alguns instantes.</p>
        <Link to="/" className="fx-botao">
          Voltar ao site
        </Link>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="fx-page">
      <div className="fx-card">
        <h1>Inscrição não encontrada</h1>
        <Link to="/inscrever" className="fx-botao">
          Fazer inscrição
        </Link>
      </div>
    </div>
  ),
});

function Confirmacao() {
  const { token } = Route.useParams();
  const { data } = useSuspenseQuery(registrationQuery(token));
  const [qr, setQr] = useState<string>("");

  useEffect(() => {
    if (!data.ok) return;
    QRCode.toDataURL(data.participant.qr_token, {
      width: 640,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1A2876", light: "#FFFFFF" },
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, [data]);

  if (!data.ok) {
    return (
      <div className="fx-page">
        <div className="fx-card">
          <h1>Inscrição não encontrada</h1>
          <p className="fx-sub">{data.error}</p>
          <Link to="/inscrever" className="fx-botao">
            Fazer minha inscrição
          </Link>
        </div>
      </div>
    );
  }

  const p = data.participant;
  const primeiroNome = p.nome.split(" ")[0] ?? p.nome;

  return (
    <div className="fx-page">
      <div className="fx-card">
        <h1>
          Inscrição <span>confirmada!</span>
        </h1>
        <p className="fx-sub">
          {primeiroNome}, sua inscrição na Feira de Profissões 2026 foi registrada.
          <br />
          Apresente o QR Code abaixo no credenciamento, no dia 27 de setembro.
        </p>

        {p.checked_in ? (
          <div className="fx-msg fx-msg-ok">Presença já confirmada no credenciamento. Bom evento!</div>
        ) : null}

        <div className="fx-qr-box">
          {qr ? <img src={qr} alt="QR Code da sua inscrição" /> : <span style={{ fontSize: "1.4rem" }}>Gerando QR Code...</span>}
        </div>

        <div className="fx-codigo">{p.qr_token}</div>

        <div className="fx-acoes">
          {qr ? (
            <a className="fx-botao" href={qr} download={`qrcode-feira-2026-${p.qr_token}.png`}>
              Salvar QR Code
            </a>
          ) : null}
          <button type="button" className="fx-botao fx-botao-amarelo" onClick={() => window.print()}>
            Imprimir
          </button>
          <Link to="/" className="fx-botao fx-botao-claro">
            Voltar ao site
          </Link>
        </div>

        <p style={{ fontSize: "1.25rem", color: "#6b7280", marginTop: "2rem" }}>
          Guarde o link desta página para acessar seu QR Code novamente.
        </p>
      </div>
    </div>
  );
}
