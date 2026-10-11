## Links oficiais preenchidos (2026-09-21)

- Pré-matrícula e matrícula (mesmo link): https://app.tecnofit.com.br/ng/customer-register/MjAwNjgz
- Venda de planos: https://app.tecnofit.com.br/ng/online-sale/MjAwNjgz
- WhatsApp: https://wa.me/5527999685202
- Localização: https://maps.app.goo.gl/1AKjBqYy1Pa4gNkj7?g_st=ic

# Academia BFIT — Landing Page

Landing page estática de produção para a **Academia BFIT** (Brasil), em português.
Academia **aberta** — CTAs de pré-matrícula, matrícula e WhatsApp (sem countdown / “em breve”).

## Como abrir localmente

### Opção 1 — arquivo direto
Abra `index.html` no navegador (duplo clique ou arraste para o Chrome/Firefox/Safari/Edge).

```bash
# Linux / macOS
xdg-open index.html   # ou: open index.html
```

### Opção 2 — servidor local (recomendado)
Evita restrições de alguns browsers com `file://`:

```bash
cd /workspace/bfit-landing
python3 -m http.server 8080
# abra http://localhost:8080
```

Arquivos:
- `index.html` — estrutura e conteúdo
- `styles.css` — visual dark / gold
- `app.js` — menu, abas, formulário, links WhatsApp
- `logo.svg` — marca textual BFIT

## Placeholders que você DEVE editar

### 1. Números de WhatsApp (`app.js`)
No topo de `app.js`, objeto `WHATSAPP`:

```js
const WHATSAPP = {
  geral: "55XXXXXXXXXXX",     // EDITME — Atendimento geral
  comercial: "55XXXXXXXXXXX", // EDITME — Comercial / matrículas
  suporte: "55XXXXXXXXXXX",   // EDITME — Suporte
};
```

Formato: código do país + DDD + número, **sem** `+` ou espaços.  
Exemplo: `5511999999999` → link `https://wa.me/5511999999999`

Todos os botões com `data-wa="geral|comercial|suporte"` usam esses valores automaticamente (incluindo o botão flutuante).

### 2. E-mail do formulário (`app.js`)
```js
const EMAIL_MATRICULA = "contato@[SEU-DOMINIO].com.br"; // EDITME
```

### 3. Links de Pré-matrícula e Matrícula (`index.html`)
Na seção `#matricula`, botões:

- `#pre-matricula` — troque `href="#pre-matricula"` pelo URL real (Google Forms, sistema, etc.)
- `#matricula-link` — troque `href="#matricula-link"` pelo URL real de matrícula

Procure comentários `EDITME` no HTML.

### 4. Parcerias
Cards em `#parcerias` usam iniciais (AP, MK, NT…). Substitua nomes, textos e, se quiser, as iniciais por logos reais (`<img>`).

### 5. O que NÃO inventar
Não há endereço, telefone exibido como texto fixo, nem preços no site — só placeholders. Preencha com dados oficiais da academia.

## Seções (abas / âncoras)

| Nav        | ID           | Conteúdo                                      |
|------------|--------------|-----------------------------------------------|
| Início     | `#inicio`    | Hero + CTAs Matricule-se / WhatsApp           |
| Vantagens  | `#vantagens` | 6 cards (estrutura, motivação, etc.)          |
| História   | `#historia`  | Narrativa origem → propósito → evolução       |
| Cultura    | `#cultura`   | Abas: Valores, Lifestyle, Superação, Eventos  |
| WhatsApp   | `#whatsapp`  | 3 canais (geral, comercial, suporte)          |
| Matrícula  | `#matricula` | CTAs + formulário (WA / e-mail)               |
| Parcerias  | `#parcerias` | Cards de parceiros (placeholders)             |
| Clube      | `#clube`     | Clube de Vantagens BFIT                       |
| FAQ        | `#faq`       | Perguntas frequentes                          |

Navegação sticky com scroll suave + menu hamburger no mobile. Instagram: [@bfitacademias](https://instagram.com/bfitacademias).

## Responsividade
Testado para ~375px (mobile) e desktop. Nav compacta vira hamburger abaixo de ~980px.

## Acessibilidade
HTML semântico, `aria` nas abas de Cultura, labels no formulário, foco visível nos botões, botão flutuante com `aria-label`.

## Deploy
Qualquer host estático: Netlify, Vercel, GitHub Pages, S3, ou pasta no servidor Apache/Nginx. Não há build step.
