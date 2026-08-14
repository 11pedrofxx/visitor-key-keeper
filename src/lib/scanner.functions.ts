import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type ScannerDevice = {
  id: string;
  nome: string;
  room_id: string;
  active: boolean;
  last_used_at: string | null;
  created_at: string;
  room: { id: string; nome: string; andar: string } | null;
};

export type ScannerSession = {
  device: { id: string; nome: string };
  room: { id: string; nome: string; andar: string };
};

type AdminCtx = { supabase: any; userId: string };

async function assertAdmin(context: AdminCtx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Acesso restrito a administradores.");
}

function gerarToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

const tokenSchema = z.string().trim().regex(/^[0-9a-f]{64}$/);

/* ------------------------------------------------------------------ */
/* Área administrativa                                                 */
/* ------------------------------------------------------------------ */

export const listScannerDevices = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ScannerDevice[]> => {
    await assertAdmin(context as AdminCtx);
    const { data, error } = await context.supabase
      .from("scanner_devices")
      .select("id, nome, room_id, active, last_used_at, created_at, room:rooms(id, nome, andar)")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("listScannerDevices", error);
      throw new Error("Não foi possível carregar os leitores configurados.");
    }
    return (data ?? []) as unknown as ScannerDevice[];
  });

/** Cria (ou reconfigura) o leitor deste dispositivo e devolve o token secreto. */
export const provisionScannerDevice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { nome: string; roomId: string; deviceId?: string }) => data)
  .handler(
    async ({ data, context }): Promise<{ ok: true; token: string; session: ScannerSession } | { ok: false; error: string }> => {
      await assertAdmin(context as AdminCtx);

      const parsed = z
        .object({
          nome: z.string().trim().min(2).max(60),
          roomId: z.string().uuid(),
          deviceId: z.string().uuid().optional(),
        })
        .safeParse(data);
      if (!parsed.success) return { ok: false, error: "Informe o nome do dispositivo e a sala." };

      const { data: room, error: roomError } = await context.supabase
        .from("rooms")
        .select("id, nome, andar")
        .eq("id", parsed.data.roomId)
        .maybeSingle();
      if (roomError || !room) return { ok: false, error: "Sala não encontrada." };

      const token = gerarToken();

      if (parsed.data.deviceId) {
        const { data: updated, error } = await context.supabase
          .from("scanner_devices")
          .update({ nome: parsed.data.nome, room_id: room.id, token, active: true })
          .eq("id", parsed.data.deviceId)
          .select("id, nome")
          .maybeSingle();
        if (error || !updated) {
          console.error("provisionScannerDevice update", error);
          return { ok: false, error: "Não foi possível atualizar o leitor." };
        }
        return { ok: true, token, session: { device: updated as { id: string; nome: string }, room: room as ScannerSession["room"] } };
      }

      const { data: created, error } = await context.supabase
        .from("scanner_devices")
        .insert({ nome: parsed.data.nome, room_id: room.id, token, created_by: context.userId })
        .select("id, nome")
        .maybeSingle();
      if (error || !created) {
        console.error("provisionScannerDevice insert", error);
        return { ok: false, error: "Não foi possível criar o leitor." };
      }
      return { ok: true, token, session: { device: created as { id: string; nome: string }, room: room as ScannerSession["room"] } };
    },
  );

export const setScannerDeviceActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { deviceId: string; active: boolean }) => data)
  .handler(async ({ data, context }): Promise<{ ok: boolean }> => {
    await assertAdmin(context as AdminCtx);
    const id = z.string().uuid().safeParse(data.deviceId);
    if (!id.success) return { ok: false };
    const { error } = await context.supabase
      .from("scanner_devices")
      .update({ active: !!data.active })
      .eq("id", id.data);
    if (error) {
      console.error("setScannerDeviceActive", error);
      return { ok: false };
    }
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Modo quiosque (autenticado apenas pelo token do dispositivo)         */
/* ------------------------------------------------------------------ */

async function loadDevice(token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("scanner_devices")
    .select("id, nome, active, created_by, room:rooms(id, nome, andar)")
    .eq("token", token)
    .maybeSingle();
  if (error || !data || !data.active || !data.room) return null;
  return data as unknown as {
    id: string;
    nome: string;
    active: boolean;
    created_by: string | null;
    room: { id: string; nome: string; andar: string };
  };
}

export const getScannerSession = createServerFn({ method: "POST" })
  .inputValidator((data: { deviceToken: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true; session: ScannerSession } | { ok: false; error: string }> => {
    const token = tokenSchema.safeParse(data.deviceToken);
    if (!token.success) return { ok: false, error: "Dispositivo não configurado." };
    const device = await loadDevice(token.data);
    if (!device) return { ok: false, error: "Este leitor não está autorizado. Procure a organização." };
    return { ok: true, session: { device: { id: device.id, nome: device.nome }, room: device.room } };
  });

export type ScanResult =
  | { ok: true; already: boolean; visitante: string; sala: string; andar: string; enteredAt: string }
  | { ok: false; error: string };

export const scanRoomEntry = createServerFn({ method: "POST" })
  .inputValidator((data: { deviceToken: string; qrToken: string }) => data)
  .handler(async ({ data }): Promise<ScanResult> => {
    const token = tokenSchema.safeParse(data.deviceToken);
    if (!token.success) return { ok: false, error: "Dispositivo não configurado." };
    const device = await loadDevice(token.data);
    if (!device) return { ok: false, error: "Este leitor não está autorizado. Procure a organização." };

    const qr = z.string().trim().min(6).max(80).safeParse(data.qrToken ?? "");
    if (!qr.success) return { ok: false, error: "QR Code não reconhecido." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const room = device.room;

    const { data: participant, error: participantError } = await supabaseAdmin
      .from("participants")
      .select("id, nome, checked_in")
      .eq("qr_token", qr.data)
      .maybeSingle();
    if (participantError) {
      console.error("scanRoomEntry participant", participantError);
      return { ok: false, error: "Erro ao consultar a inscrição." };
    }
    if (!participant) return { ok: false, error: "Participante não encontrado para este QR Code." };

    const { data: existing } = await supabaseAdmin
      .from("room_entries")
      .select("entered_at")
      .eq("participant_id", participant.id)
      .eq("room_id", room.id)
      .maybeSingle();

    if (existing) {
      return {
        ok: true,
        already: true,
        visitante: participant.nome,
        sala: room.nome,
        andar: room.andar,
        enteredAt: (existing as { entered_at: string }).entered_at,
      };
    }

    const enteredAt = new Date().toISOString();
    const { error: insertError } = await supabaseAdmin.from("room_entries").insert({
      participant_id: participant.id,
      room_id: room.id,
      entered_at: enteredAt,
      entered_by: device.created_by,
    });

    if (insertError) {
      const { data: retry } = await supabaseAdmin
        .from("room_entries")
        .select("entered_at")
        .eq("participant_id", participant.id)
        .eq("room_id", room.id)
        .maybeSingle();
      if (retry) {
        return {
          ok: true,
          already: true,
          visitante: participant.nome,
          sala: room.nome,
          andar: room.andar,
          enteredAt: (retry as { entered_at: string }).entered_at,
        };
      }
      console.error("scanRoomEntry insert", insertError);
      return { ok: false, error: "Não foi possível registrar a entrada na sala." };
    }

    if (!participant.checked_in) {
      await supabaseAdmin
        .from("participants")
        .update({ checked_in: true, checked_in_at: enteredAt })
        .eq("id", participant.id);
    }

    await supabaseAdmin.from("scanner_devices").update({ last_used_at: enteredAt }).eq("id", device.id);

    return { ok: true, already: false, visitante: participant.nome, sala: room.nome, andar: room.andar, enteredAt };
  });
