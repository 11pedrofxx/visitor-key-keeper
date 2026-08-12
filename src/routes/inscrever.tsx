import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { registerParticipant, type RegistrationInput } from "@/lib/participants.functions";

export const Route = createFileRoute("/inscrever")({
  head: () => ({
    meta: [
      { title: "Inscrição gratuita | Feira de Profissões 2026" },
      {
        name: "description",
        content:
          "Preencha o formulário de inscrição da Feira de Profissões 2026 e receba seu QR Code de credenciamento por acesso imediato.",
      },
      { property: "og:title", content: "Inscrição — Feira de Profissões 2026" },
      { property: "og:description", content: "Garanta sua vaga na Feira de Profissões 2026 e receba seu QR Code." },
    ],
    links: [
      { rel: "stylesheet", href: "/legacy/inscrever.css" },
      { rel: "stylesheet", href: "/legacy/app-extra.css" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Saira+Semi+Condensed:wght@500;600;700;800&display=swap",
      },
    ],
  }),
  component: Inscrever,
});

const camposIniciais: RegistrationInput = {
  nome: "",
  telefone: "",
  email: "",
  como_soube: "",
  horario_previsto: "",
  curso_interesse: "",
  aluno_frei: "",
};

function Inscrever() {
  const navigate = useNavigate();
  const enviar = useServerFn(registerParticipant);
  const [valores, setValores] = useState<RegistrationInput>(camposIniciais);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState("");
  const [enviando, setEnviando] = useState(false);

  function atualizar(campo: keyof RegistrationInput, valor: string) {
    setValores((v) => ({ ...v, [campo]: valor }));
    setErros((e) => {
      if (!e[campo]) return e;
      const copia = { ...e };
      delete copia[campo];
      return copia;
    });
  }

  function validarLocalmente(): Record<string, string> {
    const e: Record<string, string> = {};
    if (valores.nome.trim().length < 3) e['nome'] = "Informe seu nome completo.";
    if (!/^[0-9()+\-\s]{8,25}$/.test(valores.telefone.trim())) e['telefone'] = "Informe um telefone válido.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valores.email.trim())) e['email'] = "Informe um e-mail válido.";
    return e;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErroGeral("");
    const locais = validarLocalmente();
    if (Object.keys(locais).length > 0) {
      setErros(locais);
      setErroGeral("Verifique os campos destacados antes de enviar.");
      return;
    }

    setEnviando(true);
    try {
      const resultado = await enviar({ data: valores });
      if (!resultado.ok) {
        setErros(resultado.fieldErrors ?? {});
        setErroGeral(resultado.error);
        return;
      }
      navigate({ to: "/inscricao/$token", params: { token: resultado.participant.qr_token } });
    } catch {
      setErroGeral("Não foi possível enviar sua inscrição agora. Verifique sua conexão e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  const campo = (nome: keyof RegistrationInput) => (erros[nome] ? "fx-input-invalido" : "");

  return (
    <main className="page-content">
      <section className="form-container-wrapper">
        <div className="form-card">
          <h1 className="tituloo">
            Formulário de <span>Inscrição</span>
          </h1>

          <p className="form-subtitle">
            Preencha suas informações para concluir sua inscrição na Feira de Profissões
          </p>

          {erroGeral ? (
            <div className="fx-msg fx-msg-erro" role="alert">
              {erroGeral}
            </div>
          ) : null}

          <form className="inscricao-form" onSubmit={onSubmit} noValidate>
            <div className="input-group">
              <label htmlFor="nome">Nome completo</label>
              <input
                type="text"
                id="nome"
                name="nome"
                className={campo("nome")}
                placeholder="Digite seu nome completo"
                value={valores.nome}
                onChange={(e) => atualizar("nome", e.target.value)}
                maxLength={120}
                required
              />
              {erros['nome'] ? <span className="fx-erro-campo">{erros['nome']}</span> : null}
            </div>

            <div className="input-group">
              <label htmlFor="telefone">Telefone</label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                className={campo("telefone")}
                placeholder="(00) 00000-0000"
                value={valores.telefone}
                onChange={(e) => atualizar("telefone", e.target.value)}
                maxLength={25}
                required
              />
              {erros['telefone'] ? <span className="fx-erro-campo">{erros['telefone']}</span> : null}
            </div>

            <div className="input-group">
              <label htmlFor="email">E-mail</label>
              <input
                type="email"
                id="email"
                name="email"
                className={campo("email")}
                placeholder="seusmail@dominio.com"
                value={valores.email}
                onChange={(e) => atualizar("email", e.target.value)}
                maxLength={255}
                required
              />
              {erros['email'] ? <span className="fx-erro-campo">{erros['email']}</span> : null}
            </div>

            <div className="input-group">
              <label htmlFor="como-soube">Como ficou sabendo sobre a Feira?</label>
              <select
                id="como-soube"
                name="como_soube"
                value={valores.como_soube}
                onChange={(e) => atualizar("como_soube", e.target.value)}
              >
                <option value="">Selecione uma opção</option>
                {OPCOES_COMO_SOUBE.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="horario">Horário previsto de chegada</label>
              <input
                type="text"
                id="horario"
                name="horario_previsto"
                placeholder="Digite sua previsão de chegada"
                value={valores.horario_previsto}
                onChange={(e) => atualizar("horario_previsto", e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="input-group">
              <label htmlFor="curso">Você possui interesse em algum curso?</label>
              <select
                id="curso"
                name="curso_interesse"
                value={valores.curso_interesse}
                onChange={(e) => atualizar("curso_interesse", e.target.value)}
              >
                <option value="">Selecione um curso</option>
                {OPCOES_CURSOS.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="aluno-frei">Você é ou já foi aluno do Frei?</label>
              <select
                id="aluno-frei"
                name="aluno_frei"
                value={valores.aluno_frei}
                onChange={(e) => atualizar("aluno_frei", e.target.value)}
              >
                <option value="">Selecione uma opção</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>

            <button type="submit" className="botaao btn-enviar" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar inscrição"}
            </button>
          </form>

          <Link to="/" className="fx-link-voltar">
            ← Voltar para o site
          </Link>
        </div>
      </section>
    </main>
  );
}
