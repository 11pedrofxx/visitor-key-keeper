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
    const reader = new BrowserMultiFormatReader();
    setErro("");
    setIniciando(true);

    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setErro("Este dispositivo ou navegador não permite o uso da câmera. Use a busca manual pelo código.");
          return;
        }
        const video = videoRef.current;
        if (!video) return;

        controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          video,
          (result) => {
            if (!result || bloqueioRef.current) return;
            bloqueioRef.current = true;
            setTimeout(() => (bloqueioRef.current = false), 2500);
            onLeitura(result.getText().trim());
          },
        );
        if (cancelado) controls.stop();
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
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
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
