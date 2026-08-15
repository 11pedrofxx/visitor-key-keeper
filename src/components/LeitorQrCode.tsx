import { useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";

type Props = {
  ativo: boolean;
  onLeitura: (texto: string) => void;
};

export function LeitorQrCode({ ativo, onLeitura }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bloqueioRef = useRef(false);
  const [erro, setErro] = useState("");
  const [iniciando, setIniciando] = useState(false);

  useEffect(() => {
    if (!ativo) return;
    let controls: { stop: () => void } | undefined;
    let cancelado = false;
    let stream: MediaStream | undefined;
    const hints = new Map();
    hints.set(DecodeHintType.TRY_HARDER, false);
    const reader = new BrowserQRCodeReader(hints, { delayBetweenScanAttempts: 80 });
    setErro("");
    setIniciando(true);

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setErro("Este dispositivo ou navegador não permite o uso da câmera. Use a busca manual pelo código.");
          setIniciando(false);
          return;
        }
        const video = videoRef.current;
        if (!video) return;

        // Pede a câmera imediatamente e mostra a imagem antes de iniciar a decodificação.
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (cancelado) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play().catch(() => undefined);
        setIniciando(false);

        controls = await reader.decodeFromStream(stream, video, (result) => {
          if (!result || bloqueioRef.current) return;
          bloqueioRef.current = true;
          setTimeout(() => (bloqueioRef.current = false), 2500);
          onLeitura(result.getText().trim());
        });
        if (cancelado) controls?.stop();
      } catch (e) {
        const nome = (e as { name?: string })?.name ?? "";
        if (nome === "NotAllowedError" || nome === "SecurityError") {
          setErro(
            "Permissão de câmera negada. Toque no ícone de cadeado (ou de câmera) na barra de endereço do navegador, escolha “Permitir câmera” e recarregue a página. No iPhone: Ajustes → Safari → Câmera → Permitir.",
          );
        } else if (nome === "NotFoundError" || nome === "OverconstrainedError") {
          setErro("Nenhuma câmera compatível foi encontrada neste dispositivo.");
        } else {
          setErro("Não foi possível iniciar a câmera. Verifique se outro aplicativo está usando-a e tente novamente.");
        }
      } finally {
        setIniciando(false);
      }
    })();

    return () => {
      cancelado = true;
      controls?.stop();
      stream?.getTracks().forEach((t) => t.stop());
      const atual = videoRef.current?.srcObject as MediaStream | null;
      atual?.getTracks().forEach((t) => t.stop());
    };
  }, [ativo, onLeitura]);

  return (
    <div>
      {erro ? (
        <div className="fx-msg fx-msg-aviso" role="alert">
          {erro}
        </div>
      ) : null}
      <video ref={videoRef} className="fx-scanner-video" muted playsInline />
      {iniciando ? <p className="fx-vazio">Iniciando câmera...</p> : null}
    </div>
  );
}
