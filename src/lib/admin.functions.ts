import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type AdminParticipant = {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  como_soube: string | null;
  horario_previsto: string | null;
  curso_interesse: string | null;
  aluno_frei: string | null;
  qr_token: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
};

type AdminCtx = { supabase: any; userId: string };

async function assertAdmin(context: AdminCtx) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Acesso restrito a administradores.");
}

export const listParticipants = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { search?: string; status?: "todos" | "presentes" | "ausentes" }) => data ?? {})
  .handler(
    async ({
      data,
      context,
    }): Promise<{
      participants: AdminParticipant[];
      stats: { total: number; presentes: number; ausentes: number };
    }> => {
      await assertAdmin(context as AdminCtx);
      const search = (data?.search ?? "").trim().slice(0, 120);
      const status = data?.status ?? "todos";

      let query = context.supabase
        .from("participants")
        .select("*")
        .order("created_at", { ascending: false });

      if (search) {
        const safe = search.replace(/[%,()]/g, " ");
        query = query.or(
          `nome.ilike.%${safe}%,email.ilike.%${safe}%,telefone.ilike.%${safe}%,qr_token.ilike.%${safe}%,id.eq.${
            /^[0-9a-f-]{36}$/i.test(safe) ? safe : "00000000-0000-0000-0000-000000000000"
          }`,
        );
      }
      if (status === "presentes") query = query.eq("checked_in", true);
      if (status === "ausentes") query = query.eq("checked_in", false);

      const { data: rows, error } = await query;
      if (error) {
        console.error("listParticipants", error);
        throw new Error("Não foi possível carregar os visitantes.");
      }

      const { data: allRows, error: statsError } = await context.supabase
        .from("participants")
        .select("checked_in");
      if (statsError) {
        console.error("listParticipants stats", statsError);
        throw new Error("Não foi possível carregar os totais.");
      }

      const total = allRows.length;
      const presentes = allRows.filter((r: { checked_in: boolean }) => r.checked_in).length;

      return {
        participants: (rows ?? []) as AdminParticipant[],
        stats: { total, presentes, ausentes: total - presentes },
      };
    },
  );

export const findParticipantByToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { token: string }) => data)
  .handler(
    async ({ data, context }): Promise<{ ok: true; participant: AdminParticipant } | { ok: false; error: string }> => {
      await assertAdmin(context as AdminCtx);
      const token = z.string().trim().min(6).max(80).safeParse(data.token);
      if (!token.success) return { ok: false, error: "QR Code não reconhecido." };

      const { data: participant, error } = await context.supabase
        .from("participants")
        .select("*")
        .eq("qr_token", token.data)
        .maybeSingle();

      if (error) {
        console.error("findParticipantByToken", error);
        return { ok: false, error: "Erro ao consultar a inscrição." };
      }
      if (!participant) return { ok: false, error: "Participante não encontrado para este QR Code." };
      return { ok: true, participant: participant as AdminParticipant };
    },
  );

export const checkInParticipant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(
    async ({
      data,
      context,
    }): Promise<{ ok: true; participant: AdminParticipant; already: boolean } | { ok: false; error: string }> => {
      await assertAdmin(context as AdminCtx);
      const id = z.string().uuid().safeParse(data.id);
      if (!id.success) return { ok: false, error: "Participante inválido." };

      const { data: current, error: findError } = await context.supabase
        .from("participants")
        .select("*")
        .eq("id", id.data)
        .maybeSingle();

      if (findError) {
        console.error("checkInParticipant find", findError);
        return { ok: false, error: "Erro ao consultar a inscrição." };
      }
      if (!current) return { ok: false, error: "Participante não encontrado." };
      if (current.checked_in) {
        return { ok: true, participant: current as AdminParticipant, already: true };
      }

      const { data: updated, error } = await context.supabase
        .from("participants")
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
          checked_in_by: context.userId,
        })
        .eq("id", id.data)
        .eq("checked_in", false)
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("checkInParticipant update", error);
        return { ok: false, error: "Não foi possível registrar o credenciamento." };
      }
      if (!updated) return { ok: true, participant: current as AdminParticipant, already: true };
      return { ok: true, participant: updated as AdminParticipant, already: false };
    },
  );

export const getAdminProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ nome: string; email: string } | null> => {
    await assertAdmin(context as AdminCtx);
    const { data } = await context.supabase
      .from("admin_profiles")
      .select("nome, email")
      .eq("id", context.userId)
      .maybeSingle();
    return (data as { nome: string; email: string } | null) ?? null;
  });

/** Only works while no administrator exists yet (first-run setup). */
export const adminSetupStatus = createServerFn({ method: "GET" }).handler(async (): Promise<{ needsSetup: boolean }> => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) {
    console.error("adminSetupStatus", error);
    return { needsSetup: false };
  }
  return { needsSetup: (count ?? 0) === 0 };
});

export const createFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((data: { nome: string; email: string; password: string }) => data)
  .handler(async ({ data }): Promise<{ ok: true } | { ok: false; error: string }> => {
    const parsed = z
      .object({
        nome: z.string().trim().min(3).max(120),
        email: z.string().trim().toLowerCase().email().max(255),
        password: z.string().min(8, "A senha deve ter ao menos 8 caracteres.").max(72),
      })
      .safeParse(data);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) {
      return { ok: false, error: "Já existe um administrador cadastrado." };
    }

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
    });
    if (error || !created.user) {
      console.error("createFirstAdmin", error);
      return { ok: false, error: "Não foi possível criar o administrador." };
    }

    const userId = created.user.id;
    await supabaseAdmin.from("admin_profiles").insert({
      id: userId,
      nome: parsed.data.nome,
      email: parsed.data.email,
    });
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });
    if (roleError) {
      console.error("createFirstAdmin role", roleError);
      return { ok: false, error: "Não foi possível concluir a configuração." };
    }
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Controle de entrada por sala                                        */
/* ------------------------------------------------------------------ */

export type Room = {
  id: string;
  code: string;
  nome: string;
  andar: string;
  ordem: number;
};

export type RoomEntryInfo = {
  room_id: string;
  entered_at: string;
};

export type RoomStat = {
  room: Room;
  entraram: number;
  naoEntraram: number;
};

export const listRooms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Room[]> => {
    await assertAdmin(context as AdminCtx);
    const { data, error } = await context.supabase
      .from("rooms")
      .select("id, code, nome, andar, ordem")
      .order("ordem", { ascending: true });
    if (error) {
      console.error("listRooms", error);
      throw new Error("Não foi possível carregar as salas.");
    }
    return (data ?? []) as Room[];
  });

export const listRoomEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{ byParticipant: Record<string, RoomEntryInfo[]>; stats: RoomStat[] }> => {
      await assertAdmin(context as AdminCtx);

      const [roomsRes, entriesRes, totalRes] = await Promise.all([
        context.supabase.from("rooms").select("id, code, nome, andar, ordem").order("ordem", { ascending: true }),
        context.supabase.from("room_entries").select("participant_id, room_id, entered_at"),
        context.supabase.from("participants").select("id", { count: "exact", head: true }),
      ]);

      if (roomsRes.error || entriesRes.error) {
        console.error("listRoomEntries", roomsRes.error ?? entriesRes.error);
        throw new Error("Não foi possível carregar as entradas por sala.");
      }

      const rooms = (roomsRes.data ?? []) as Room[];
      const entries = (entriesRes.data ?? []) as Array<{
        participant_id: string;
        room_id: string;
        entered_at: string;
      }>;
      const totalParticipantes = totalRes.count ?? 0;

      const byParticipant: Record<string, RoomEntryInfo[]> = {};
      const perRoom: Record<string, number> = {};
      for (const e of entries) {
        (byParticipant[e.participant_id] ??= []).push({ room_id: e.room_id, entered_at: e.entered_at });
        perRoom[e.room_id] = (perRoom[e.room_id] ?? 0) + 1;
      }

      const stats: RoomStat[] = rooms.map((room) => {
        const entraram = perRoom[room.id] ?? 0;
        return { room, entraram, naoEntraram: Math.max(totalParticipantes - entraram, 0) };
      });

      return { byParticipant, stats };
    },
  );

export const registerRoomEntry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { token?: string; participantId?: string; roomId: string }) => data)
  .handler(
    async ({
      data,
      context,
    }): Promise<
      | { ok: true; participant: AdminParticipant; room: Room; already: boolean; enteredAt: string }
      | { ok: false; error: string }
    > => {
      await assertAdmin(context as AdminCtx);

      const roomId = z.string().uuid().safeParse(data.roomId);
      if (!roomId.success) return { ok: false, error: "Selecione a sala antes de registrar a entrada." };

      const { data: room, error: roomError } = await context.supabase
        .from("rooms")
        .select("id, code, nome, andar, ordem")
        .eq("id", roomId.data)
        .maybeSingle();
      if (roomError || !room) return { ok: false, error: "Sala não encontrada." };

      let participantQuery = context.supabase.from("participants").select("*");
      if (data.participantId) {
        const id = z.string().uuid().safeParse(data.participantId);
        if (!id.success) return { ok: false, error: "Participante inválido." };
        participantQuery = participantQuery.eq("id", id.data);
      } else {
        const token = z.string().trim().min(6).max(80).safeParse(data.token ?? "");
        if (!token.success) return { ok: false, error: "QR Code não reconhecido." };
        participantQuery = participantQuery.eq("qr_token", token.data);
      }

      const { data: participant, error: participantError } = await participantQuery.maybeSingle();
      if (participantError) {
        console.error("registerRoomEntry participant", participantError);
        return { ok: false, error: "Erro ao consultar a inscrição." };
      }
      if (!participant) return { ok: false, error: "Participante não encontrado para este QR Code." };

      const { data: existing } = await context.supabase
        .from("room_entries")
        .select("entered_at")
        .eq("participant_id", participant.id)
        .eq("room_id", room.id)
        .maybeSingle();

      if (existing) {
        return {
          ok: true,
          participant: participant as AdminParticipant,
          room: room as Room,
          already: true,
          enteredAt: (existing as { entered_at: string }).entered_at,
        };
      }

      const enteredAt = new Date().toISOString();
      const { error: insertError } = await context.supabase.from("room_entries").insert({
        participant_id: participant.id,
        room_id: room.id,
        entered_at: enteredAt,
        entered_by: context.userId,
      });

      if (insertError) {
        // corrida: registro criado em outra leitura simultânea
        const { data: retry } = await context.supabase
          .from("room_entries")
          .select("entered_at")
          .eq("participant_id", participant.id)
          .eq("room_id", room.id)
          .maybeSingle();
        if (retry) {
          return {
            ok: true,
            participant: participant as AdminParticipant,
            room: room as Room,
            already: true,
            enteredAt: (retry as { entered_at: string }).entered_at,
          };
        }
        console.error("registerRoomEntry insert", insertError);
        return { ok: false, error: "Não foi possível registrar a entrada na sala." };
      }

      // Mantém o credenciamento geral do evento na primeira sala visitada.
      if (!participant.checked_in) {
        await context.supabase
          .from("participants")
          .update({ checked_in: true, checked_in_at: enteredAt, checked_in_by: context.userId })
          .eq("id", participant.id);
      }

      return { ok: true, participant: participant as AdminParticipant, room: room as Room, already: false, enteredAt };
    },
  );
