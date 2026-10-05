# Gradient Studio

Gerador de gradientes animados com WebGL e painel de parâmetros.

**Site:** https://gradientstudio-eight.vercel.app

## Estrutura

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Estrutura da página |
| `style.css` | Estilos |
| `app.js` | Parâmetros, WebGL, painel e botões |
| `shader.frag` | Shader GLSL do gradiente |

## Rodar localmente

O shader é carregado com `fetch`, então é preciso um servidor local:

```bash
python3 -m http.server 8080
```

Depois abra http://localhost:8080.
