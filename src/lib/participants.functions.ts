import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const registrationSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome completo.").max(120),
  telefone: z
    .string()
    .trim()
    .min(8, "Informe um telefone válido.")
    .max(25)
    .regex(/^[0-9()+\-\s]+$/, "Informe um telefone válido."),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(255),
  como_soube: z.string().trim().max(200).optional().default(""),
  horario_previsto: z.string().trim().max(100).optional().default(""),
  curso_interesse: z.string().trim().max(150).optional().default(""),
  aluno_frei: z.string().trim().max(100).optional().default(""),
});

export type RegistrationInput = z.input<typeof registrationSchema>;

export type RegistrationResult =
  | {
      ok: true;
      participant: { id: string; nome: string; email: string; qr_token: string; created_at: string };
    }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function generateToken(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `FP26-${out}`;
}

export const registerParticipant = createServerFn({ method: "POST" })
  .inputValidator((data: RegistrationInput) => data)
  .handler(async ({ data }): Promise<RegistrationResult> => {
    const parsed = registrationSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return { ok: false, error: "Verifique os campos destacados.", fieldErrors };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const values = parsed.data;

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("participants")
      .select("id, nome, email, qr_token, created_at")
      .eq("email", values.email)
      .maybeSingle();

    if (existingError) {
      console.error("registerParticipant lookup", existingError);
      return { ok: false, error: "Não foi possível concluir a inscrição. Tente novamente." };
    }

    if (existing) {
      return {
        ok: false,
        error: "Este e-mail já possui uma inscrição. Utilize o QR Code que já foi gerado.",
        fieldErrors: { email: "E-mail já inscrito." },
      };
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("participants")
      .insert({ ...values, qr_token: generateToken() })
      .select("id, nome, email, qr_token, created_at")
      .single();

    if (error || !inserted) {
      if (error?.code === "23505" || error?.code === "23505") {
        return { ok: false, error: "Este e-mail já possui uma inscrição." };
      }
      console.error("registerParticipant insert", error);
      return { ok: false, error: "Não foi possível concluir a inscrição. Tente novamente." };
    }

    return { ok: true, participant: inserted };
  });

export type PublicRegistration = {
  nome: string;
  qr_token: string;
  created_at: string;
  checked_in: boolean;
};

export const getRegistrationByToken = createServerFn({ method: "GET" })
  .inputValidator((data: { token: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; participant: PublicRegistration } | { ok: false; error: string }> => {
    const token = z.string().trim().min(10).max(60).safeParse(data.token);
    if (!token.success) return { ok: false, error: "Inscrição não encontrada." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: participant, error } = await supabaseAdmin
      .from("participants")
      .select("nome, qr_token, created_at, checked_in")
      .eq("qr_token", token.data)
      .maybeSingle();

    if (error) {
      console.error("getRegistrationByToken", error);
      return { ok: false, error: "Não foi possível carregar a inscrição." };
    }
    if (!participant) return { ok: false, error: "Inscrição não encontrada." };
    return { ok: true, participant };
  });
