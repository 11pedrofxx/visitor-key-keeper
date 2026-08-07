import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { adminSetupStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso administrativo | Feira de Profissões 2026" },
      {
        name: "description",
        content: "Área restrita da organização da Feira de Profissões 2026: credenciamento e gestão de visitantes.",
      },
      { property: "og:title", content: "Acesso administrativo — Feira de Profissões 2026" },
      { property: "og:description", content: "Área restrita da equipe organizadora do evento." },
      { name: "robots", content: "noindex" },
    ],
    links: [
      { rel: "stylesheet", href: "/legacy/menu1.css" },
      { rel: "stylesheet", href: "/legacy/app-extra.css" },
    ],
  }),
  component: LoginAdmin,
});

function LoginAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [precisaSetup, setPrecisaSetup] = useState(false);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (ativo && data.session) navigate({ to: "/painel", replace: true });
    });
    adminSetupStatus()
      .then((r) => ativo && setPrecisaSetup(r.needsSetup))
      .catch(() => undefined);
    return () => {
      ativo = false;
    };
  }, [navigate]);

  async function entrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErro("Informe um e-mail válido.");
      return;
    }
    if (senha.length < 6) {
      setErro("Informe sua senha de acesso.");
      return;
    }

    setCarregando(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });
      if (error || !data.user) {
        setErro("E-mail ou senha inválidos.");
        return;
      }

      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: data.user.id,
        _role: "admin",
      });
      if (!isAdmin) {
        await supabase.auth.signOut();
        setErro("Esta conta não possui permissão administrativa.");
        return;
      }

      navigate({ to: "/painel", replace: true });
    } catch {
      setErro("Não foi possível entrar agora. Verifique sua conexão e tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="pai">
      <img src="/pictures/Logo_Feira_das_Profissoes_2026_-_PNG_Vetor_-_FINAL.webp" alt="Logo Feira das Profissões" />

      <form onSubmit={entrar} style={{ width: "100%" }} noValidate>
        {erro ? (
          <div className="fx-msg fx-msg-erro" role="alert">
            {erro}
          </div>
        ) : null}

        <h1>E-mail de acesso</h1>

        <div className="campo">
          <input
            type="email"
            placeholder="Digite seu e-mail"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <h1>Senha</h1>

        <div className="campo">
          <input
            type="password"
            placeholder="Digite sua senha"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>

        <div className="Sistema">
          <button
            type="submit"
            disabled={carregando}
            style={{
              all: "unset",
              cursor: carregando ? "not-allowed" : "pointer",
              width: "100%",
              textAlign: "center",
            }}
          >
            <h1>{carregando ? "Entrando..." : "Acessar Sistema"}</h1>
          </button>
        </div>
      </form>

      <Link to="/" style={{ width: "100%", textDecoration: "none" }}>
        <div className="voltar">
          <h1>Voltar</h1>
        </div>
      </Link>

      {precisaSetup ? (
        <Link to="/admin-setup" className="fx-link-voltar">
          Primeiro acesso? Criar conta de administrador
        </Link>
      ) : null}
    </div>
  );
}
