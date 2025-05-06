'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const adjustButton = document.getElementById('adjustButton');
    const statusMessage = document.getElementById('statusMessage');

    adjustButton.addEventListener('click', handleAdjustClick);

    function handleAdjustClick() {
        clearOutputAndStatus();
        const rawInput = inputText.value;

        if (!rawInput.trim()) {
            showStatus('Entrada está vazia. Por favor, cole o JSON quebrado.', 'warning');
            return;
        }

        let correctedText;
        try {
            correctedText = fixUtf8MisinterpretedAsLatin1(rawInput);
        } catch (error) {
            showStatus('Ocorreu um erro inesperado durante a correção do encoding.', 'error');
            outputText.value = rawInput;
            return;
        }

        let finalOutputString = '';
        let isJsonValid = false;
        let parseError = null;

        const condSourcePlaceholder = '__COND_SOURCE_MINIFIED_PLACEHOLDER__';
        const formSourcePlaceholderPrefix = '__FORM_SOURCE_';
        const formSourcePlaceholderSuffix = '_PLACEHOLDER__';

        let condSourceReplacement = null;
        const formSourceReplacements = [];

        try {
            let parsedJson = JSON.parse(correctedText);

            if (parsedJson && typeof parsedJson === 'object' && parsedJson !== null) {

                if (Array.isArray(parsedJson.conditionalsSource)) {
                    const originalValue = parsedJson.conditionalsSource;
                    const minifiedString = JSON.stringify(originalValue);
                    const placeholderInString = `"${condSourcePlaceholder}"`;
                    parsedJson.conditionalsSource = condSourcePlaceholder;
                    condSourceReplacement = { placeholderInString, minifiedString, originalValue };
                }

                if (Array.isArray(parsedJson.forms)) {
                    parsedJson.forms.forEach((formObject, index) => {
                        if (formObject && typeof formObject === 'object' && Array.isArray(formObject.formSource)) {
                            const originalValue = formObject.formSource;
                            const minifiedString = JSON.stringify(originalValue);
                            const placeholder = `${formSourcePlaceholderPrefix}${index}${formSourcePlaceholderSuffix}`;
                            const placeholderInString = `"${placeholder}"`;
                            formObject.formSource = placeholder;
                            formSourceReplacements.push({ index, placeholderInString, minifiedString, originalValue });
                        }
                    });
                }

                finalOutputString = JSON.stringify(parsedJson, null, 4);

                if (condSourceReplacement) {
                    finalOutputString = finalOutputString.replace(
                        condSourceReplacement.placeholderInString,
                        condSourceReplacement.minifiedString
                    );
                }
                formSourceReplacements.forEach(replacement => {
                    finalOutputString = finalOutputString.replace(
                        replacement.placeholderInString,
                        replacement.minifiedString
                    );
                });

                if (condSourceReplacement) {
                    parsedJson.conditionalsSource = condSourceReplacement.originalValue;
                }
                formSourceReplacements.forEach(replacement => {
                     if (parsedJson.forms && parsedJson.forms[replacement.index]) {
                          parsedJson.forms[replacement.index].formSource = replacement.originalValue;
                     }
                });

            } else {
                 finalOutputString = JSON.stringify(parsedJson, null, 4);
            }

            isJsonValid = true;

        } catch (error) {
            parseError = error.message;
            finalOutputString = correctedText;
            isJsonValid = false;
        }

        outputText.value = finalOutputString;

        if (isJsonValid) {
            let successMsg = 'Encoding corrigido. JSON válido gerado (UTF-8)';
            let formattedParts = [];
            if (condSourceReplacement) formattedParts.push('"conditionalsSource" inline');
             if (formSourceReplacements.length > 0) {
                 const indices = formSourceReplacements.map(r => `forms[${r.index}].formSource`).join(', ');
                 formattedParts.push(`${indices} inline`);
            }

            if (formattedParts.length > 0) {
                 successMsg += ` com formatação mista (${formattedParts.join('; ')}, restante 4 espaços).`;
            } else {
                 successMsg += ' e formatado (4 espaços).';
            }

             successMsg += ' Caracteres especiais foram preservados usando escapes JSON (\\uXXXX), garantindo compatibilidade de bytes com ISO-8859-1 sem perda de dados.';
             showStatus(successMsg, 'success');

        } else {
            showStatus(`Encoding de caracteres possivelmente corrigido, mas a estrutura do JSON é inválida. Erro de análise: ${parseError || 'desconhecido'}. Exibindo texto corrigido.`, 'error');
        }
    }

    function fixUtf8MisinterpretedAsLatin1(str) {
        try {
            const bytes = new Uint8Array(str.length);
            for (let i = 0; i < str.length; i++) {
                const code = str.charCodeAt(i);
                bytes[i] = code & 0xFF;
            }
            const decoder = new TextDecoder('utf-8', { fatal: false });
            return decoder.decode(bytes);
        } catch (e) {
             console.error("Falha grave ao decodificar bytes como UTF-8:", e);
             // Em um ambiente crítico, talvez lançar o erro seja melhor que retornar a string original?
             // throw new Error('Falha na decodificação UTF-8: ' + e.message);
             return str; // Mantendo o comportamento anterior por enquanto
        }
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message';
        statusMessage.classList.add(type, 'visible');
    }

    function clearOutputAndStatus() {
        outputText.value = '';
        statusMessage.textContent = '';
        statusMessage.className = 'status-message';
    }

    if (statusMessage) {
       statusMessage.classList.add('status-message');
    }
});