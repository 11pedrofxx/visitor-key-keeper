import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminSetupStatus, createFirstAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin-setup")({
  head: () => ({
    meta: [
      { title: "Primeiro acesso administrativo | Feira de Profissões 2026" },
      { name: "description", content: "Criação da primeira conta administrativa do sistema da Feira de Profissões 2026." },
      { property: "og:title", content: "Primeiro acesso administrativo" },
      { property: "og:description", content: "Configuração inicial do sistema de credenciamento." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "stylesheet", href: "/legacy/app-extra.css" }],
  }),
  component: AdminSetup,
});

function AdminSetup() {
  const navigate = useNavigate();
  const [liberado, setLiberado] = useState<boolean | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    adminSetupStatus()
      .then((r) => setLiberado(r.needsSetup))
      .catch(() => setLiberado(false));
  }, []);

  async function criar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    if (nome.trim().length < 3) return setErro("Informe o nome do administrador.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setErro("Informe um e-mail válido.");
    if (senha.length < 8) return setErro("A senha deve ter ao menos 8 caracteres.");

    setEnviando(true);
    try {
      const r = await createFirstAdmin({ data: { nome: nome.trim(), email: email.trim(), password: senha } });
      if (!r.ok) {
        setErro(r.error);
        return;
      }
      setOk(true);
      setTimeout(() => navigate({ to: "/auth" }), 1500);
    } catch {
      setErro("Não foi possível concluir a configuração. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fx-page">
      <div className="fx-card">
        <h1>
          Primeiro <span>acesso</span>
        </h1>

        {liberado === null ? <p className="fx-sub">Carregando...</p> : null}

        {liberado === false ? (
          <>
            <p className="fx-sub">O sistema já possui um administrador cadastrado.</p>
            <Link to="/auth" className="fx-botao">
              Ir para o login
            </Link>
          </>
        ) : null}

        {liberado === true ? (
          ok ? (
            <>
              <div className="fx-msg fx-msg-ok">Administrador criado com sucesso. Redirecionando para o login...</div>
              <Link to="/auth" className="fx-botao">
                Entrar agora
              </Link>
            </>
          ) : (
            <>
              <p className="fx-sub">Crie a conta do administrador responsável pelo credenciamento do evento.</p>
              {erro ? (
                <div className="fx-msg fx-msg-erro" role="alert">
                  {erro}
                </div>
              ) : null}
              <form onSubmit={criar} noValidate style={{ textAlign: "left" }}>
                <div className="fx-filtros" style={{ flexDirection: "column" }}>
                  <input placeholder="Nome do administrador" value={nome} onChange={(e) => setNome(e.target.value)} />
                  <input
                    type="email"
                    placeholder="E-mail de acesso"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    type="password"
                    placeholder="Senha (mínimo 8 caracteres)"
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <div className="fx-acoes">
                  <button type="submit" className="fx-botao" disabled={enviando}>
                    {enviando ? "Criando..." : "Criar administrador"}
                  </button>
                  <Link to="/" className="fx-botao fx-botao-claro">
                    Voltar
                  </Link>
                </div>
              </form>
            </>
          )
        ) : null}
      </div>
    </div>
  );
}
