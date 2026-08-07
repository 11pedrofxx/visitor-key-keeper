import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { AdminParticipant } from "@/lib/admin.functions";

function formatarData(valor: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/**
 * Exibe o QR Code JÁ EXISTENTE da inscrição (participants.qr_token).
 * Nenhum código novo é gerado: apenas a imagem do mesmo token é renderizada,
 * exatamente como na página pública /inscricao/$token.
 */
export function QrCodeVisitante({
  participante,
  onFechar,
}: {
  participante: AdminParticipant;
  onFechar: () => void;
}) {
  const [qr, setQr] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL(participante.qr_token, {
      width: 640,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1A2876", light: "#FFFFFF" },
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, [participante.qr_token]);

  function imprimir() {
    if (!qr) return;
    const janela = window.open("", "_blank", "width=720,height=900");
    if (!janela) return;
    janela.document.write(
      `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><title>QR Code — ${participante.nome}</title>` +
        `<style>body{font-family:Montserrat,Arial,sans-serif;text-align:center;padding:32px;color:#1A2876}` +
        `img{width:420px;max-width:100%}h1{font-size:22px}p{font-size:15px;margin:4px 0}` +
        `code{font-size:18px;letter-spacing:1px}</style></head><body>` +
        `<h1>Feira de Profissões 2026</h1><p>${participante.nome}</p><p>${participante.email}</p>` +
        `<img src="${qr}" alt="QR Code" /><p><code>${participante.qr_token}</code></p>` +
        `</body></html>`,
    );
    janela.document.close();
    janela.focus();
    janela.onload = () => janela.print();
    setTimeout(() => janela.print(), 400);
  }

  return (
    <div className="fx-modal-fundo" role="dialog" aria-modal="true" onClick={onFechar}>
      <div className="fx-modal" onClick={(e) => e.stopPropagation()}>
        <h2>QR Code da inscrição</h2>

        <div className="fx-detalhe-grid">
          <p className="fx-detalhe">
            <strong>Visitante</strong>
            {participante.nome}
          </p>
          <p className="fx-detalhe">
            <strong>E-mail</strong>
            {participante.email}
          </p>
          <p className="fx-detalhe">
            <strong>Telefone</strong>
            {participante.telefone}
          </p>
          <p className="fx-detalhe">
            <strong>Inscrição</strong>
            {formatarData(participante.created_at)}
          </p>
        </div>

        <div className="fx-qr-box">
          {qr ? (
            <img src={qr} alt={`QR Code da inscrição de ${participante.nome}`} />
          ) : (
            <span style={{ fontSize: "1.4rem" }}>Carregando QR Code...</span>
          )}
        </div>

        <div className="fx-codigo">{participante.qr_token}</div>

        <div className="fx-acoes">
          {qr ? (
            <a className="fx-botao" href={qr} download={`qrcode-feira-2026-${participante.qr_token}.png`}>
              Baixar QR Code
            </a>
          ) : null}
          <button type="button" className="fx-botao fx-botao-amarelo" onClick={imprimir} disabled={!qr}>
            Imprimir
          </button>
          <button type="button" className="fx-botao fx-botao-claro" onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
