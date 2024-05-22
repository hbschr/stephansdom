```mermaid
flowchart LR;
  h[html parser] --dom tree--> s[style];
  c[css parser] --style rules--> s;
  s --style tree--> l[layout];
  l --layout tree--> p[paint];
```
