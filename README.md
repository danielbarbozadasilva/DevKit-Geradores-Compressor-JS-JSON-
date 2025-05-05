# Dev Toolbox - Conjunto de Ferramentas para Desenvolvedores

## ⚠️ Atenção Importante ⚠️

**Esta aplicação gera dados fictícios e/ou matematicamente inválidos para seus geradores (CPF, CNPJ, CNH, Contas, etc.). Os dados produzidos servem *exclusivamente* para fins de teste, demonstração, preenchimento de formulários em ambientes de desenvolvimento ou como placeholders.**

**NÃO UTILIZE OS DADOS GERADOS EM SISTEMAS DE PRODUÇÃO OU PARA QUALQUER FINALIDADE OFICIAL. ELES NÃO SÃO REAIS E NÃO POSSUEM VALIDADE LEGAL.**

---

## Funcionalidades Principais

Aqui está uma visão geral das ferramentas disponíveis nesta aplicação:

### Compressor JS/JSON
* **Descrição:** Minifica (comprime) código JavaScript ou estruturas JSON, removendo espaços, comentários e quebras de linha desnecessários.
* **Lógica:** Utiliza técnicas de remoção de whitespace e comentários.
* **Entrada:** Código JS ou JSON no editor.
* **Saída:** Código minificado.

### Corretor de Encoding JSON
* **Descrição:** Tenta corrigir problemas comuns de codificação em JSON, especialmente quando UTF-8 é mal interpretado como Latin-1/Windows-1252 (Mojibake). Garante a preservação de caracteres especiais.
* **Lógica:** Reinterpreta bytes assumindo erro comum de encoding e decodifica como UTF-8. Aplica formatação mista opcional (JSON principal formatado, partes específicas inline) e usa escapes JSON (`\uXXXX`) para garantir compatibilidade de bytes com ISO-8859-1 sem perda de dados.
* **Entrada:** JSON com encoding potencialmente quebrado.
* **Saída:** JSON com encoding corrigido e formatado, preservando 100% da informação original.

### Desminificador / Formatador (JS/JSON)
* **Descrição:** Formata código JavaScript ou JSON minificado, adicionando indentação e quebras de linha para melhor legibilidade (conhecido como "Beautifier" ou "Pretty Print").
* **Lógica:** Aplica regras de formatação e indentação padrão.
* **Entrada:** Código JS ou JSON minificado.
* **Saída:** Código formatado e legível.

### Modo Dark/Light
* **Descrição:** Alterna o tema visual da aplicação entre claro (Light) e escuro (Dark).
* **Lógica:** Aplica classes CSS diferentes ao corpo da página.
* **Entrada:** Clique no botão/ícone de alternância de tema.
* **Saída:** Interface com o tema visual alterado.

---

## Geradores de Dados (Apenas para Testes)

**Lembrete:** Todos os dados gerados abaixo são **inválidos** e destinados apenas para testes.

### Gerador de CNH (Inválida)
* **Descrição:** Gera um número de CNH (11 dígitos) formatado, com dados adicionais fictícios.
* **Lógica:** Cria 11 dígitos aleatórios. Datas e categorias são aleatórias.
* **Entrada:** Nenhuma.
* **Saída:** Número CNH formatado, Validade Fictícia, Categoria Aleatória.
* **Aviso:** **Número de CNH gerado é inválido. Apenas para testes.**

### Gerador de Conta Bancária (Inválida)
* **Descrição:** Gera dados fictícios de conta bancária (Banco, Agência, Conta com DV aleatório).
* **Lógica:** Seleciona um banco de uma lista pré-definida, gera agência (4 dígitos) e conta aleatórias, incluindo um dígito verificador aleatório (não calculado).
* **Entrada:** Nenhuma.
* **Saída:** Nome do Banco, Agência, Conta (com DV).
* **Aviso:** **Dados bancários gerados são inválidos e fictícios. Apenas para testes.**

### Gerador de CPF (Inválido)
* **Descrição:** Gera números de CPF formatados (XXX.XXX.XXX-XX) e matematicamente inválidos.
* **Lógica:** Gera 11 dígitos aleatórios e aplica formatação opcional. Não calcula dígitos verificadores.
* **Entrada:** Opção: Gerar com pontuação? (Sim/Não).
* **Saída:** Número de CPF (formatado ou não).
* **Aviso:** **Use apenas para testes. CPFs gerados são inválidos.**

### Gerador de Nomes de Usuário (Nicks)
* **Descrição:** Cria sugestões de Nomes de Usuário (nicks).
* **Lógica:** Combina uma palavra-chave (opcional) com prefixos/sufixos comuns e/ou números aleatórios.
* **Entrada:** Palavra-chave (Opcional), Quantidade de Sugestões desejada.
* **Saída:** Lista de Nicks sugeridos.

### Gerador de Nomes (Fictícios)
* **Descrição:** Gera nomes e sobrenomes brasileiros fictícios.
* **Lógica:** Combina nomes e sobrenomes de listas pré-definidas aleatoriamente.
* **Entrada:** Gênero (Opcional: Masculino/Feminino/Aleatório).
* **Saída:** Nome completo fictício.

### Gerador de Data de Nascimento
* **Descrição:** Gera uma data de nascimento aleatória dentro de um intervalo de anos especificado.
* **Lógica:** Escolhe aleatoriamente ano (no intervalo), mês (1-12) e dia (válido para o mês/ano selecionado).
* **Entrada:** Ano Mínimo, Ano Máximo.
* **Saída:** Data de Nascimento no formato DD/MM/AAAA.

### Gerador de Números Aleatórios
* **Descrição:** Gera números inteiros dentro de um intervalo mínimo e máximo especificado.
* **Lógica:** Utiliza funções de geração de números pseudoaleatórios no intervalo [Mínimo, Máximo].
* **Entrada:** Valor Mínimo, Valor Máximo, Quantidade, Opção: Permitir Repetição? (Sim/Não).
* **Saída:** Lista de números aleatórios gerados.

### Gerador de PIS/PASEP (Inválido)
* **Descrição:** Gera números no formato PIS/PASEP (XXX.XXXXX.XX-X) e inválidos.
* **Lógica:** Gera 11 dígitos aleatórios e aplica formatação opcional. Não calcula dígito verificador.
* **Entrada:** Opção: Gerar com pontuação? (Sim/Não).
* **Saída:** Número PIS/PASEP (formatado ou não).
* **Aviso:** **Número PIS/PASEP gerado é inválido. Apenas para testes.**

### Gerador de CNPJ (Inválido)
* **Descrição:** Gera números de CNPJ formatados (XX.XXX.XXX/YYYY-ZZ) e inválidos.
* **Lógica:** Gera 14 dígitos aleatórios e aplica formatação opcional. Não calcula dígitos verificadores.
* **Entrada:** Opção: Gerar com pontuação? (Sim/Não).
* **Saída:** Número de CNPJ (formatado ou não).
* **Aviso:** **Use apenas para testes. CNPJs gerados são inválidos.**

### Gerador de CEP (Não Validado)
* **Descrição:** Gera códigos postais (CEP) formatados (NNNNN-NNN).
* **Lógica:** Gera 8 números aleatórios e aplica formatação opcional.
* **Entrada:** Opção: Gerar com pontuação? (Sim/Não).
* **Saída:** Código CEP (formatado ou não).
* **Aviso:** **Não garante que o CEP exista ou seja válido.**

### Gerador de RG (Inválido - Formato Exemplo)
* **Descrição:** Gera números de RG formatados e inválidos, aplicando uma máscara baseada no estado selecionado (Exemplo: SP).
* **Lógica:** Gera dígitos aleatórios e aplica a máscara do estado selecionado (baseado em exemplos). Formato real varia muito entre UFs e pode incluir letras.
* **Entrada:** Seleção do Estado (UF) para aplicar o formato de exemplo.
* **Saída:** Número de RG formatado (inválido).
* **Aviso:** **RG gerado é inválido. Formato é apenas um exemplo e pode não corresponder exatamente a todos os estados ou regras reais.**

### Gerador de Inscrição Estadual (IE) (Inválida - Formato Exemplo)
* **Descrição:** Gera números de Inscrição Estadual (IE) formatados e inválidos, baseados em um formato de exemplo para o estado selecionado (Exemplo: SP).
* **Lógica:** Gera dígitos aleatórios e aplica máscara de exemplo para o estado. Regras reais de validação e formato são complexas e variam muito por UF.
* **Entrada:** Seleção do Estado (UF) para aplicar o formato de exemplo.
* **Saída:** Número de IE formatado (inválido).
* **Aviso:** **IE gerada é inválida e apenas para o formato de exemplo do estado selecionado. Não segue regras de validação reais.**

### Gerador de Título de Eleitor (Inválido)
* **Descrição:** Gera números de Título de Eleitor formatados (NNNN NNNN NN NN) e inválidos.
* **Lógica:** Gera 12 dígitos aleatórios e aplica a formatação opcional com espaços. Não calcula dígitos verificadores.
* **Entrada:** Opção: Gerar com espaços? (Sim/Não).
* **Saída:** Número do Título (formatado ou não).
* **Aviso:** **Título gerado é inválido. Apenas para testes.**

### Gerador de Senha Segura
* **Descrição:** Cria senhas aleatórias fortes baseadas em critérios definidos pelo usuário.
* **Lógica:** Gera aleatoriamente caracteres dos conjuntos selecionados (maiúsculas, minúsculas, números, símbolos) até atingir o comprimento desejado, garantindo a inclusão de pelo menos um de cada tipo selecionado (se possível).
* **Entrada:** Comprimento desejado (ex: 8-128), Opções: Incluir Maiúsculas (ABC), Incluir Minúsculas (abc), Incluir Números (123), Incluir Símbolos (!@#$).
* **Saída:** Senha aleatória gerada.

---

## Utilitários

### Gerador de PDF Simples
* **Descrição:** Cria um arquivo PDF básico contendo o texto fornecido pelo usuário.
* **Lógica:** Utiliza a biblioteca `jsPDF` (ou similar) para inserir o texto em um documento PDF padrão e o disponibiliza para download com um nome de arquivo sequencial ou customizado.
* **Entrada:** Texto para o conteúdo do PDF, Nome base do arquivo (opcional, sem a extensão `.pdf`).
* **Saída:** Download de um arquivo `.pdf`.

### Bloco de Anotações Local
* **Descrição:** Permite criar, editar e salvar anotações de texto simples que ficam armazenadas localmente no navegador do usuário.
* **Lógica:** Utiliza a API `localStorage` do navegador para persistir o texto das anotações entre as sessões de uso da aplicação.
* **Entrada:** Texto digitado na área de anotações.
* **Saída:** O texto é salvo localmente e recarregado ao reabrir a ferramenta.
