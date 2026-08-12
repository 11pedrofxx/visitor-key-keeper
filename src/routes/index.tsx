import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Feira de Profissões 2026 | Instituto Social Nossa Senhora de Fátima" },
      {
        name: "description",
        content:
          "Feira de Profissões 2026: 19 de setembro, das 10h às 16h, no Instituto Social Nossa Senhora de Fátima. Evento gratuito — faça sua inscrição e receba seu QR Code.",
      },
      { property: "og:title", content: "Feira de Profissões 2026 — Instituto Nossa Senhora de Fátima" },
      {
        property: "og:description",
        content: "Onde o conhecimento encontra as oportunidades. Inscreva-se gratuitamente e garanta seu QR Code de entrada.",
      },
    ],
    links: [
      { rel: "stylesheet", href: "/legacy/site.css" },
      { rel: "stylesheet", href: "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
      },
    ],
  }),
  component: Home,
});

function Home() {
  useEffect(() => {
    const menuButton = document.querySelector<HTMLButtonElement>(".menu-mobile");
    const menu = document.querySelector<HTMLUListElement>(".menu-principal");
    if (!menuButton || !menu) return;
    const onClick = () => {
      const aberto = menu.classList.toggle("menu-aberto");
      menuButton.setAttribute("aria-expanded", String(aberto));
      menuButton.innerHTML = aberto ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    };
    menuButton.addEventListener("click", onClick);
    return () => menuButton.removeEventListener("click", onClick);
  }, []);

  return (
    <>
      <header>
        <img
          className="logoo"
          src="/pictures/Logo_Feira_das_Profissoes_2026_-_PNG_Vetor_-_FINAL.webp"
          alt="Logo Feira das Profissões 2026"
        />

        <button className="menu-mobile" aria-label="Abrir menu" aria-expanded="false" type="button">
          <i className="fas fa-bars"></i>
        </button>

        <ul className="menu-principal">
          <li>inicio</li>
          <a href="#programacaoo">
            <li>programações</li>
          </a>
          <a href="#cursos">
            <li>cursos</li>
          </a>
          <Link to="/inscrever">
            <li>inscrição</li>
          </Link>
          <a href="#contato">
            <li>contato</li>
          </a>
        </ul>

        <Link to="/auth">
          <button className="botao">Acesso Administrativo</button>
        </Link>
      </header>

      <div className="espacofrase">
        <h1 className="fraseefeito">
          <span className="spandiferente">Feira Das Profissões:</span> Onde o <br />
          <span>conhecimento</span> encontra as <br />
          <span>oportunidades.</span>
        </h1>

        <div className="botoes">
          <br />
          <a href="#programacaoo">
            <button className="botao1">Ver programação</button>
          </a>
          <Link to="/inscrever">
            <button className="botao2">Fazer minha inscrição</button>
          </Link>
        </div>
      </div>

      <div className="conheca">
        <h1 className="fraseefeito1">Conheça Nossa Instituição:</h1>
        <h2 className="frasefrei">
          Conheça a história, a missão e o compromisso do Instituto Social Nossa Senhora de Fátima com a educação, a
          qualificação profissional e a transformação de vidas.
        </h2>
      </div>

      <div className="paii">
        <div className="fraseleft">
          <h1>Nossa História</h1>
          <p>
            A Escola Profissional Nossa Senhora de Fátima oferece ensino de qualidade, infraestrutura moderna e cursos
            alinhados às demandas do mercado de trabalho. Com salas equipadas, laboratórios, oficinas, biblioteca e
            auditório, proporcionamos uma formação completa, unindo teoria e prática.
          </p>
          <p>
            Nossa missão é preparar jovens e adultos com conhecimento, autonomia e confiança para construir um futuro com
            mais oportunidades.
          </p>
          <a href="https://www.acaonsfatima.org.br/sobre-n%C3%B3s" target="_blank" rel="noreferrer">
            <button className="botao-veja-mais">VEJA MAIS</button>
          </a>
        </div>

        <div className="freiright">
          <img
            className="fotoo"
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRwluqahWaDmjYGC-e102yHpQthdFZfim8XpCwaGO4zcaBrd-BsTmZijpvd&s=10"
            alt="Frei Xavier"
          />
          <h2>Frei Xavier</h2>
          <h3>Fundador do Instituto Social Nossa Senhora de Fátima</h3>
        </div>
      </div>

      <div className="espacoo">
        <h1 className="Fraseestru">Nossa Estrutura</h1>
        <p className="frasesalas">
          Conheça nossas salas <span>moderna</span> e espaços de <span>aprendizado</span>
        </p>
      </div>

      <div className="quadrados">
        <div className="boxleft">
          <nav className="topo">
            <img src="/pictures/tecnologia.png" alt="Ícone de tecnologia" />
            <h1>Laboratórios de Informática</h1>
          </nav>
          <p>
            Equipados com computadores <span>modernos</span> e softwares atualizados, ideais para práticas, pesquisas e
            desenvolvimento de <span>projetos.</span>
          </p>
        </div>

        <div className="boxright">
          <nav className="topo">
            <img src="/pictures/salas.png" alt="Ícone de salas de aula" />
            <h1>Salas com Espaço Amplo</h1>
          </nav>
          <p>
            Ambientes <span>confortáveis,</span> bem iluminados e organizados, garantindo mais <span>liberdade</span> e
            interação nas atividades.
          </p>
        </div>

        <br />
        <br />
      </div>

      <nav className="Modric">
        <img className="wfrei" src="/pictures/frei.jpg" alt="Instituto Nossa Senhora de Fátima" />

        <br />
        <br />
        <br />

        <div className="boxbaixa">
          <nav className="topo">
            <img src="/pictures/vecteezy_auditorium-vector-icon-design_16952346.jpg" alt="Ícone de auditório" />
            <h1>Salas com Espaço Amplo</h1>
          </nav>
          <p>
            Ambientes <span>confortáveis,</span> bem iluminados e organizados, garantindo mais <span>liberdade</span> e
            interação nas atividades.
          </p>
        </div>
      </nav>

      <br />
      <br />
      <br />

      <div className="espacoo">
        <h1 className="Fraseestru">Depoimentos</h1>
        <h3 className="frasedep">
          Conheça as histórias de <span>sucesso</span> de quem <span>transformou</span> sua vida profissional{" "}
          <span>conosco</span>
        </h3>
      </div>

      <section className="banner">
        <div className="conteudo">
          <div className="fotodep">
            <img src="/pictures/bruno-remove-bg-io.png" alt="Bruno de Oliveira" />
          </div>

          <div className="textos">
            <h3>
              Atualmente, além de executivo de TI, sou professor no Instituto onde nossa missão é{" "}
              <span>EDUCAR, PREPARAR OS JOVENS PARA O MERCADO DE TRABALHO</span> com habilidades técnicas, humanas e
              conceituais.
            </h3>
            <p>Bruno de Oliveira - Cursos de Informática 2005 e Inglês 2006</p>
          </div>
        </div>
      </section>

      <section className="secao-como-chegar">
        <div className="conheca">
          <h1 className="fraseefeito1">Como Chegar na Feira de Profissões:</h1>
          <h2 className="frasefrei">Veja aqui as informações necessárias para chegar na Feira de Profissões</h2>
        </div>

        <div className="container-localizacao">
          <div className="mapa-feira">
            <img src="/pictures/Captura_de_tela_2026-07-24_101710.png" alt="Mapa de localização do Instituto"/>
          </div>




          <div className="card-infos">
            <h1>Feira de Profissões 2026</h1>
            <h3 className="subtitulo-card">Evento Gratuito e Aberto ao Público</h3>

            <div className="bloco-info">
              <img src="/pictures/clock-regular.png" alt="Ícone Relógio" />
              <div className="texto-info">
                <h4>19 de Setembro</h4>
                <p>Sábado, das 10:00 às 16:00</p>
              </div>
            </div>

            <div className="bloco-info">
              <img src="/pictures/loc-remove-bg-io.png" alt="Ícone Localização" />
              <div className="texto-info">
                <h4>Localização</h4>
                <p>Av. Cel. Octaviano de Freitas Costa, 463</p>
                <p>Veleiros, São Paulo - SP</p>
              </div>
            </div>

            <div className="endereco-completo">
              <address>
                Instituto Social Nossa Senhora de Fátima
                <br />
                CEP: 04773-000
              </address>
            </div>
          </div>
        </div>
      </section>



      <section id="cronograma" className="secao-cronograma">
        <div className="container-cronograma">
          <header id="programacaoo" className="cabecalho-cronograma">
            <h2 className="titulo-cronograma">Como será o dia do evento</h2>
            <p className="subtitulo-cronograma">
              Programação completa das 10h às 16h — participe de quantas atividades quiser.
            </p>
          </header>

          <div className="timeline-wrapper">
            <div className="lista-atividades">
              {[
                { icon: "fas fa-clipboard-list", hora: "10:00", nome: "Credenciamento" },
                { icon: "fas fa-flag", hora: "10:30", nome: "Abertura oficial" },
                { icon: "fas fa-tools", hora: "11:00", nome: "Oficinas práticas" },
                { icon: "fas fa-microscope", hora: "12:00", nome: "Visitação aos laboratórios" },
                { icon: "fas fa-microphone", hora: "13:30", nome: "Palestras" },
                { icon: "fas fa-handshake", hora: "15:00", nome: "Rodada com empresas" },
                { icon: "fas fa-glass-cheers", hora: "16:00", nome: "Encerramento" },
              ].map((item) => (
                <article className="atividade-item" key={item.hora}>
                  <div className="marcador-timeline">
                    <i className={`${item.icon} icone-atividade`}></i>
                  </div>
                  <div className="card-atividade">
                    <h3>{item.hora}</h3>
                    <p>{item.nome}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="cursos" className="cs-secao">
        <div className="cs-container">
          <header className="cs-header-principal">
            <h2 className="cs-titulo-principal">Cursos e Qualificações Profissionais</h2>
            <p className="cs-subtitulo-principal">
              Conheça os cursos oferecidos pelo Instituto Social Nossa Senhora de Fátima, projetados para capacitar
              jovens e adultos para as demandas do mercado de trabalho.
            </p>
          </header>

          <div className="cs-categorias-wrapper">
            {[
              {
                categoria: "Cursos Técnicos",
                extraClass: "",
                cursos: [
                  {
                    titulo: "Curso Técnico em Administração",
                    horas: "1.000 horas",
                    duracao: "1 ano (Seg à Sex)",
                    terceiro: { icon: "far fa-sun", texto: "Manhã / Tarde" },
                    resumo:
                      "Capacita para apoio administrativo em áreas como controle de estoques, gestão de RH, logística, marketing e operações contábeis. Exige ética e boa comunicação.",
                  },
                  {
                    titulo: "Curso Técnico em Comunicação Visual",
                    horas: "880 horas",
                    duracao: "1 ano (Seg à Sex)",
                    terceiro: { icon: "far fa-sun", texto: "Manhã / Tarde" },
                    resumo:
                      "Desenvolvimento de projetos gráficos, criação de peças publicitárias, marketing digital, fotografia e edição de vídeo para campanhas criativas e gestão de redes sociais.",
                  },
                  {
                    titulo: "Curso Técnico em Informática",
                    horas: "1.000 horas",
                    duracao: "1 ano (Seg à Sex)",
                    terceiro: { icon: "far fa-sun", texto: "Manhã / Tarde" },
                    resumo:
                      "Formação nas áreas de Hardware (suporte, manutenção e redes) e Software (desenvolvimento de sistemas, programas e banco de dados com linguagens de programação).",
                  },
                ],
              },
              {
                categoria: "Cursos de Qualificação",
                extraClass: "",
                cursos: [
                  {
                    titulo: "Qualificação Profissional em Eletromecânica de Autos",
                    horas: "880 horas",
                    duracao: "1 ano (Seg à Sex)",
                    terceiro: { icon: "far fa-sun", texto: "Manhã / Tarde" },
                    resumo:
                      "Capacita para manutenções preventivas e corretivas em veículos automotores, abrangendo elétrica, eletrônica e mecânica automotiva com responsabilidade e iniciativa.",
                  },
                  {
                    titulo: "Qualificação Profissional em Automação Residencial e Robótica",
                    horas: "880 horas",
                    duracao: "1 ano (Seg à Sex)",
                    terceiro: { icon: "far fa-sun", texto: "Manhã / Tarde" },
                    resumo:
                      "Instalação e manutenção de sistemas de iluminação, segurança e IOT (Domótica), além de programar robôs para aplicações comerciais e industriais.",
                  },
                ],
              },
              {
                categoria: "Cursos Livres (Inglês)",
                extraClass: " cs-card-ingles",
                cursos: [
                  {
                    titulo: "Curso Livre de Inglês Básico ao Pré-Intermediário (Diurno)",
                    horas: "400 horas",
                    duracao: "1 ano - Superintensivo (Seg à Sex)",
                    terceiro: { icon: "fas fa-id-card", texto: "15 a 25 anos (Ensino Médio)" },
                    resumo:
                      'Curso "English in Action", foca no desenvolvimento das quatro habilidades: fala, escrita, leitura e audição. Dividido em módulos Beginners, Elementary e Pre-Intermediate.',
                  },
                  {
                    titulo: "Curso Livre de Inglês Intermediário (Sábados)",
                    horas: "160 horas",
                    duracao: "1 ano (Sábado das 8h às 12h)",
                    terceiro: { icon: "fas fa-id-card", texto: "A partir de 15 anos" },
                    resumo:
                      "Focado no nível intermediário para conversação, escrita, leitura e audição, preparando o aluno para o curso avançado. Requer dedicação e proficiência básica.",
                  },
                ],
              },
            ].map((bloco) => (
              <div className="cs-categoria-bloco" key={bloco.categoria}>
                <h3 className="cs-subtitulo-categoria">{bloco.categoria}</h3>
                <div className="cs-grid-cursos">
                  {bloco.cursos.map((curso) => (
                    <article className={`cs-card${bloco.extraClass}`} key={curso.titulo}>
                      <h4 className="cs-card-titulo">{curso.titulo}</h4>
                      <div className="cs-info-rapida">
                        <div className="cs-info-item">
                          <i className="far fa-clock"></i>
                          <span className="cs-texto-negrito">{curso.horas}</span>
                        </div>
                        <div className="cs-info-item">
                          <i className="far fa-calendar-alt"></i>
                          <span>{curso.duracao}</span>
                        </div>
                        <div className="cs-info-item">
                          <i className={curso.terceiro.icon}></i>
                          <span>{curso.terceiro.texto}</span>
                        </div>
                      </div>
                      <p className="cs-perfil-resumo">{curso.resumo}</p>
                      <a
                        href="https://www.acaonsfatima.org.br/escola-prof-nossa-senhora-de-f%C3%A1tima"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <button className="cs-btn-detalhes">Ver Detalhes</button>
                      </a>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="parceiros" className="np-secao">
        <div className="np-container">
          <header className="np-header">
            <h2 className="np-titulo">Nossos Parceiros</h2>
          </header>

          <div className="np-grade-logos">
            <div className="np-logo-card">
              <img src="/pictures/opengraph.jpg" alt="Logotipo CM Comandos Lineares" className="np-logo-img" />
            </div>
            <div className="np-logo-card">
              <img src="/pictures/unnamed.jpg" alt="Logotipo PWI Sistemas" className="np-logo-img" />
            </div>
            <div className="np-logo-card">
              <img src="/pictures/MWM__Brazil__logo.svg.webp" alt="Logotipo MWM" className="np-logo-img" />
            </div>
          </div>
        </div>
      </section>

      <footer id="contato" className="ro-rodape">
        <div className="ro-container">
          <div className="ro-grid">
            <div className="ro-coluna ro-coluna-sobre">
              <img
                src="/pictures/logofrei-removebg-preview.png"
                alt="Logotipo Instituto Social Nossa Senhora de Fátima"
                className="ro-logo-instituto"
              />
              <h3 className="ro-titulo-instituto">Instituto Social Nossa Senhora de Fátima</h3>
              <p className="ro-texto-sobre">
                Descubra seu <span className="ro-destaque">futuro</span> na Feira de Profissões 2026 — conecte-se com o{" "}
                <span className="ro-destaque">mercado</span> e encontre o caminho ideal para sua carreira!
              </p>
            </div>

            <div className="ro-coluna ro-coluna-info">
              <h4 className="ro-titulo-coluna">Horários e Endereço</h4>
              <p className="ro-texto-info">
                <strong>19 de Setembro das 10h às 16h</strong>
              </p>
              <p className="ro-texto-info">
                Instituto Social Nossa Senhora de Fátima,
                <br />
                Av. Cel. Octaviano de Freitas Costa, 463
                <br />
                Veleiros - São Paulo - SP
                <br />
                CEP: 04773-000
              </p>
            </div>

            <nav className="ro-coluna ro-coluna-links">
              <h4 className="ro-titulo-coluna">Links Rápidos</h4>
              <ul className="ro-lista-links">
                <li>
                  <a href="#inicio" className="ro-link">
                    Início
                  </a>
                </li>
                <li>
                  <a href="#cursos" className="ro-link">
                    Nossos Cursos
                  </a>
                </li>
                <li>
                  <Link to="/inscrever" className="ro-link">
                    Inscrição
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="ro-link">
                    Acesso Administrativo
                  </Link>
                </li>
                <li>
                  <a href="#contato" className="ro-link">
                    Contato
                  </a>
                </li>
              </ul>
            </nav>

            <div className="ro-coluna ro-coluna-contato">
              <h4 className="ro-titulo-coluna">Contato</h4>
              <p className="ro-texto-info">(11) 96398-6252 - secretaria - whatsapp</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
