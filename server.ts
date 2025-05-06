import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xssClean from 'xss-clean';
import BpmnModdle from 'bpmn-moddle';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente .env
dotenv.config();

/** Leitura de variáveis de ambiente com fallback */
const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const BASE_URL: string = process.env.BASE_URL || `http://localhost:${PORT}`;

/** Cria a instância do Express */
const app = express();

/** Middlewares de segurança e boas práticas */
app.use(helmet());
app.use(xssClean());
app.use(cors({
    origin: [BASE_URL],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

/** Rate limit: 100 reqs a cada 15 min */
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});
app.use(limiter);

/** Suporte a JSON grande */
app.use(express.json({ limit: '10mb' }));

/** Página HTML que serve o front-end do validador/corretor BPMN */
const htmlPage = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Validador e Corretor de BPMN 2.0 (Activiti)</title>
  <link 
    rel="stylesheet" 
    href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css">

  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    #bpmnCanvas { width: 100%; height: 600px; border: 1px solid #ccc; }
    .error { color: red; font-weight: bold; }
    .warning { color: orange; font-weight: bold; }
    .info { color: green; }
  </style>

  <!-- bpmn-js e bpmn-moddle via CDN para renderização no front-end -->
  <script src="https://unpkg.com/bpmn-js@11.5.0/dist/bpmn-viewer.development.js"></script>
  <script src="https://unpkg.com/bpmn-moddle@8.3.0/dist/index.js"></script>
</head>
<body>
<div class="container">
  <h1 class="my-4">Validador e Corretor de BPMN 2.0 (Activiti)</h1>

  <div class="mb-3">
    <label for="inputBPMN" class="form-label"><strong>Entrada BPMN</strong></label>
    <textarea class="form-control" id="inputBPMN" rows="6" placeholder="Cole aqui seu XML BPMN possivelmente com erros..."></textarea>
  </div>
  
  <button id="btnValidate" class="btn btn-primary mb-4">Validar/Corigir BPMN</button>

  <div class="row">
    <div class="col-md-6">
      <h2>Versão Corrigida (XML)</h2>
      <textarea class="form-control" id="outputBPMN" rows="10" placeholder="Aqui será exibido o BPMN corrigido..."></textarea>
      
      <h2 class="mt-4">Erros e Avisos</h2>
      <div id="issuesList"></div>
    </div>

    <div class="col-md-6">
      <h2>Visualização do Diagrama Corrigido</h2>
      <div id="bpmnCanvas"></div>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>

<script>
document.getElementById('btnValidate').addEventListener('click', async () => {
  const inputBPMN = (document.getElementById('inputBPMN').value || '').trim();
  const issuesContainer = document.getElementById('issuesList');
  issuesContainer.innerHTML = '';

  if (!inputBPMN) {
    issuesContainer.innerHTML = '<p class="error">Nenhum BPMN fornecido.</p>';
    return;
  }

  try {
    const response = await fetch('/validate-correct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bpmnXml: inputBPMN })
    });

    if (!response.ok) {
      const errorData = await response.json();
      issuesContainer.innerHTML = '<p class="error">Falha ao validar: ' 
        + (errorData.error || response.statusText) + '</p>';
      return;
    }

    const result = await response.json();
    document.getElementById('outputBPMN').value = result.correctedXml || '';

    if (!result.issues || result.issues.length === 0) {
      issuesContainer.innerHTML = '<p class="info">Nenhum problema detectado ou BPMN já estava válido.</p>';
    } else {
      const ul = document.createElement('ul');
      result.issues.forEach(iss => {
        const li = document.createElement('li');
        li.textContent = iss.message;
        li.className = iss.type;
        ul.appendChild(li);
      });
      issuesContainer.appendChild(ul);
    }

    renderDiagram(result.correctedXml);

  } catch (err) {
    issuesContainer.innerHTML = '<p class="error">Erro de conexão ou exceção: ' + err.message + '</p>';
  }
});

function renderDiagram(xml) {
  if (!xml) return;
  const viewer = new window.BpmnJS({ container: '#bpmnCanvas' });
  viewer.importXML(xml, function(err) {
    if (err) {
      console.error('Erro ao renderizar BPMN:', err);
      document.getElementById('issuesList').innerHTML +=
        '<p class="error">Erro ao carregar diagrama corrigido no visualizador: ' + err.message + '</p>';
      return;
    }
    const canvas = viewer.get('canvas');
    canvas.zoom('fit-viewport');
  });
}
</script>
</body>
</html>
`;

/** GET / => Retorna a página HTML do validador/corretor BPMN (separada do DevKit) */
app.get('/', (_req: Request, res: Response): any => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(htmlPage);
});

/** Interface para o body da rota /validate-correct */
interface ValidateRequestBody {
    bpmnXml: string;
}

/**
 * Função de validação/correção de extensões Activiti.
 */
function validateActivitiExtensions(
    element: any,
    issues: Array<{ type: string; message: string }>,
    moddle: any
) {
    // Exemplo: checando UserTask
    if (element.$type === 'bpmn:UserTask') {
        if (element.assignee === '') {
            issues.push({
                type: 'warning',
                message: `UserTask "${element.id || 'sem ID'}" tem assignee vazio. Removendo.`,
            });
            delete element.assignee;
        }
        if (element.formKey && !element['activiti:formKey']) {
            element['activiti:formKey'] = element.formKey;
            delete element.formKey;
            issues.push({
                type: 'info',
                message: `UserTask "${element.id || 'sem ID'}" - Corrigido formKey sem prefixo activiti:.`,
            });
        } else if (element['activiti:formKey'] === '') {
            delete element['activiti:formKey'];
            issues.push({
                type: 'warning',
                message: `UserTask "${element.id || 'sem ID'}" tem activiti:formKey vazio. Removendo.`,
            });
        }
    }

    // Exemplo: StartEvent
    if (element.$type === 'bpmn:StartEvent') {
        if (element.formKey && !element['activiti:formKey']) {
            element['activiti:formKey'] = element.formKey;
            delete element.formKey;
            issues.push({
                type: 'info',
                message: `StartEvent "${element.id || 'sem ID'}" - Corrigido formKey sem prefixo activiti:.`,
            });
        } else if (element['activiti:formKey'] === '') {
            delete element['activiti:formKey'];
            issues.push({
                type: 'warning',
                message: `StartEvent "${element.id || 'sem ID'}" tem activiti:formKey vazio. Removendo.`,
            });
        }

        if (element.initiator && !element['activiti:initiator']) {
            element['activiti:initiator'] = element.initiator;
            delete element.initiator;
            issues.push({
                type: 'info',
                message: `StartEvent "${element.id || 'sem ID'}" - Corrigido initiator sem prefixo activiti:.`,
            });
        } else if (element['activiti:initiator'] === '') {
            delete element['activiti:initiator'];
            issues.push({
                type: 'warning',
                message: `StartEvent "${element.id || 'sem ID'}" tem activiti:initiator vazio. Removendo.`,
            });
        }
    }

    // Exemplo: ScriptTask
    if (element.$type === 'bpmn:ScriptTask') {
        if (element.autoStoreVariables !== undefined && element['activiti:autoStoreVariables'] === undefined) {
            element['activiti:autoStoreVariables'] = String(element.autoStoreVariables).toLowerCase();
            delete element.autoStoreVariables;
            if (
                element['activiti:autoStoreVariables'] !== 'true' &&
                element['activiti:autoStoreVariables'] !== 'false'
            ) {
                element['activiti:autoStoreVariables'] = 'false';
                issues.push({
                    type: 'warning',
                    message: `ScriptTask "${element.id || 'sem ID'}" - Valor inválido para autoStoreVariables, configurado para 'false'.`,
                });
            } else {
                issues.push({
                    type: 'info',
                    message: `ScriptTask "${element.id || 'sem ID'}" - Corrigido autoStoreVariables sem prefixo activiti:.`,
                });
            }
        } else if (element['activiti:autoStoreVariables'] !== undefined) {
            const val = String(element['activiti:autoStoreVariables']).toLowerCase();
            if (val !== 'true' && val !== 'false') {
                element['activiti:autoStoreVariables'] = 'false';
                issues.push({
                    type: 'warning',
                    message: `ScriptTask "${element.id || 'sem ID'}" - Valor inválido para activiti:autoStoreVariables, configurado para 'false'.`,
                });
            }
        }
    }

    // Exemplo: extensionElements -> taskListeners
    if (element.extensionElements && element.extensionElements.values) {
        const validListeners: any[] = [];
        let listenerRemoved = false;

        element.extensionElements.values.forEach((extValue: any) => {
            const isTaskListener =
                extValue.$type === 'activiti:TaskListener' ||
                (extValue.$descriptor && extValue.$descriptor.name === 'activiti:TaskListener');

            if (isTaskListener) {
                let isValid = true;
                if (!extValue.event || !['create', 'assignment', 'complete', 'delete'].includes(extValue.event)) {
                    issues.push({
                        type: 'error',
                        message: `TaskListener em "${element.id || 'sem ID'}" possui 'event' inválido ou ausente ("${extValue.event || 'ausente'
                            }").`,
                    });
                    isValid = false;
                }
                if (!extValue.class && !extValue.expression && !extValue.delegateExpression) {
                    issues.push({
                        type: 'error',
                        message: `TaskListener (event="${extValue.event}") em "${element.id || 'sem ID'
                            }" sem class, expression ou delegateExpression.`,
                    });
                    isValid = false;
                }

                if (isValid) {
                    validListeners.push(extValue);
                } else {
                    listenerRemoved = true;
                }
            } else {
                validListeners.push(extValue);
            }
        });

        if (listenerRemoved) {
            issues.push({
                type: 'warning',
                message: `Um ou mais TaskListeners inválidos foram removidos do elemento "${element.id || 'sem ID'}".`,
            });
        }

        element.extensionElements.values = validListeners;
        if (element.extensionElements.values.length === 0) {
            delete element.extensionElements;
            issues.push({
                type: 'info',
                message: `Tag <extensionElements> vazia removida do elemento "${element.id || 'sem ID'}".`,
            });
        }
    }
}

/**
 * Valida e corrige um BPMN passado como string.
 * Retorna o XML corrigido e a lista de issues (erros, avisos, infos).
 */
async function validateAndCorrectBPMN(
    bpmnXml: string
): Promise<{ bpmnXmlCorrigido: string; issues: Array<{ type: string; message: string }> }> {
    const issues: Array<{ type: string; message: string }> = [];
    const moddle = new BpmnModdle();

    let definitions: any;
    try {
        const parseResult = await moddle.fromXML(bpmnXml.trim());
        definitions = parseResult.rootElements;

        if (!definitions || definitions.$type !== 'bpmn:Definitions') {
            issues.push({
                type: 'error',
                message: `Erro Crítico: Raiz não é <bpmn:Definitions>. Tipo encontrado: ${definitions?.$type || 'desconhecido'
                    }.`,
            });
            return { bpmnXmlCorrigido: bpmnXml, issues };
        }

        // Garante ID, namespaces, etc.
        if (!definitions.id) {
            definitions.id = `Definitions_${Date.now()}`;
            issues.push({
                type: 'info',
                message: `Elemento <definitions> sem ID. Adicionado id="${definitions.id}".`,
            });
        }

        definitions.$attrs = definitions.$attrs || {};
        definitions.$attrs['xmlns:bpmn'] =
            definitions.$attrs['xmlns:bpmn'] || 'http://www.omg.org/spec/BPMN/20100524/MODEL';
        definitions.$attrs['xmlns:bpmndi'] =
            definitions.$attrs['xmlns:bpmndi'] || 'http://www.omg.org/spec/BPMN/20100524/DI';
        definitions.$attrs['xmlns:dc'] = definitions.$attrs['xmlns:dc'] || 'http://www.omg.org/spec/DD/20100524/DC';
        definitions.$attrs['xmlns:di'] = definitions.$attrs['xmlns:di'] || 'http://www.omg.org/spec/DD/20100524/DI';
        definitions.$attrs['xmlns:activiti'] =
            definitions.$attrs['xmlns:activiti'] || 'http://activiti.org/bpmn';
        definitions.$attrs['xmlns:xsi'] =
            definitions.$attrs['xmlns:xsi'] || 'http://www.w3.org/2001/XMLSchema-instance';

        if (!definitions.targetNamespace) {
            definitions.targetNamespace = 'http://bpmn.io/schema/bpmn';
            issues.push({
                type: 'info',
                message: `Adicionado targetNamespace="${definitions.targetNamespace}".`,
            });
        }
    } catch (err: any) {
        issues.push({
            type: 'error',
            message: `Erro Crítico ao fazer parse do XML BPMN: ${err.message}.`,
        });
        return { bpmnXmlCorrigido: bpmnXml, issues };
    }

    // Se não houver BPMNDiagram, cria um
    if (!definitions.diagrams || definitions.diagrams.length === 0) {
        definitions.diagrams = [moddle.create('bpmndi:BPMNDiagram', { id: 'BPMNDiagram_1' })];
        issues.push({
            type: 'info',
            message: 'Nenhum <bpmndi:BPMNDiagram> encontrado. Criado diagrama vazio com id="BPMNDiagram_1".',
        });
        if (definitions.diagrams[0]) {
            definitions.diagrams[0].plane = moddle.create('bpmndi:BPMNPlane', { id: 'BPMNPlane_1' });
            issues.push({
                type: 'info',
                message: 'Adicionado <bpmndi:BPMNPlane> vazio ao diagrama.',
            });
        }
    }

    // Garante ao menos 1 <bpmn:Process>
    const processes = (definitions.rootElements || []).filter((el: any) => el.$type === 'bpmn:Process');
    if (processes.length === 0) {
        const newProcess = moddle.create('bpmn:Process', {
            id: 'Process_AutoCreated_1',
            isExecutable: true,
            name: 'Processo Criado Automaticamente',
        });
        definitions.rootElements = definitions.rootElements || [];
        definitions.rootElements.push(newProcess);
        processes.push(newProcess);
        issues.push({
            type: 'info',
            message: 'Nenhum <bpmn:Process> encontrado. Criado processo mínimo com id="Process_AutoCreated_1".',
        });

        const plane = definitions.diagrams[0]?.plane;
        if (plane) {
            plane.bpmnElement = newProcess;
        }
    }

    // Para cada processo, valida e corrige
    processes.forEach((proc: any, idx: number) => {
        if (!proc.id) {
            proc.id = `Process_AutoID_${idx + 1}`;
            issues.push({
                type: 'info',
                message: `Processo na posição ${idx} sem ID. Atribuído "${proc.id}".`,
            });
        }
        if (proc.isExecutable !== true) {
            proc.isExecutable = true;
            issues.push({
                type: 'info',
                message: `Processo "${proc.id}" marcado como isExecutable="true".`,
            });
        }
        if (!proc.flowElements) {
            proc.flowElements = [];
        }

        // Garante StartEvent
        let startEvent = proc.flowElements.find((e: any) => e.$type === 'bpmn:StartEvent');
        if (!startEvent) {
            startEvent = moddle.create('bpmn:StartEvent', {
                id: `StartEvent_Auto_${proc.id}`,
                name: 'Início (Auto)',
            });
            proc.flowElements.push(startEvent);
            issues.push({
                type: 'info',
                message: `Nenhum StartEvent no processo "${proc.id}". Adicionado ${startEvent.id}.`,
            });
        }

        // Garante EndEvent
        let endEvent = proc.flowElements.find((e: any) => e.$type === 'bpmn:EndEvent');
        if (!endEvent) {
            endEvent = moddle.create('bpmn:EndEvent', {
                id: `EndEvent_Auto_${proc.id}`,
                name: 'Fim (Auto)',
            });
            proc.flowElements.push(endEvent);
            issues.push({
                type: 'info',
                message: `Nenhum EndEvent no processo "${proc.id}". Adicionado ${endEvent.id}.`,
            });
        }

        const elementIds = new Set<string>();
        const sequenceFlows: any[] = [];

        proc.flowElements.forEach((element: any) => {
            if (element.id) {
                if (elementIds.has(element.id)) {
                    issues.push({
                        type: 'error',
                        message: `ID duplicado "${element.id}" no processo "${proc.id}".`,
                    });
                } else {
                    elementIds.add(element.id);
                }
            } else {
                const autoId = `${element.$type.replace('bpmn:', '')}_AutoID_${Math.random()
                    .toString(36)
                    .substring(2, 9)}`;
                element.id = autoId;
                issues.push({
                    type: 'warning',
                    message: `Elemento do tipo "${element.$type}" sem ID no processo "${proc.id}". Atribuído "${autoId}".`,
                });
                elementIds.add(autoId);
            }

            // Valida extensões do Activiti
            validateActivitiExtensions(element, issues, moddle);

            // Conectividade
            const isFlow = element.$type === 'bpmn:SequenceFlow';
            const isStart = element.$type === 'bpmn:StartEvent';
            const isEnd = element.$type === 'bpmn:EndEvent';
            const isBoundary = element.$type === 'bpmn:BoundaryEvent';

            if (!isStart && !isFlow && !isBoundary) {
                if (!element.incoming || element.incoming.length === 0) {
                    const parent = element.$parent;
                    const isEventSub = parent && parent.$type === 'bpmn:SubProcess' && parent.triggeredByEvent;
                    if (!isEventSub) {
                        issues.push({
                            type: 'warning',
                            message: `Elemento "${element.id}" (${element.$type}) no processo "${proc.id}" sem incoming.`,
                        });
                    }
                }
            }

            if (!isEnd && !isFlow) {
                if (!element.outgoing || element.outgoing.length === 0) {
                    const parent = element.$parent;
                    const isEndInsideEventSub = isEnd && parent && parent.$type === 'bpmn:SubProcess' && parent.triggeredByEvent;
                    if (!isEndInsideEventSub) {
                        issues.push({
                            type: 'warning',
                            message: `Elemento "${element.id}" (${element.$type}) no processo "${proc.id}" sem outgoing.`,
                        });
                    }
                }
            }

            // Gateways
            if (
                (element.$type === 'bpmn:ExclusiveGateway' || element.$type === 'bpmn:InclusiveGateway') &&
                element.gatewayDirection === 'Diverging' &&
                element.outgoing &&
                element.outgoing.length > 1
            ) {
                let hasCondition = false;
                let hasDefault = false;
                const defaultFlowId = element.default ? element.default.id : null;

                element.outgoing.forEach((flow: any) => {
                    if (flow.conditionExpression) {
                        hasCondition = true;
                        if (!flow.conditionExpression.body || !flow.conditionExpression.body.trim()) {
                            issues.push({
                                type: 'warning',
                                message: `SequenceFlow "${flow.id}" com <conditionExpression> vazia (gateway "${element.id}").`,
                            });
                        }
                    }
                    if (flow.id === defaultFlowId) {
                        hasDefault = true;
                    }
                });

                if (
                    element.$type === 'bpmn:ExclusiveGateway' &&
                    !hasDefault &&
                    !hasCondition &&
                    element.outgoing.length > 1
                ) {
                    issues.push({
                        type: 'error',
                        message: `Gateway Exclusivo "${element.id}" com ${element.outgoing.length} saídas, mas SEM condição e SEM fluxo default.`,
                    });
                }
            }

            // Se for SequenceFlow, armazenar p/ validação posterior
            if (isFlow) {
                sequenceFlows.push(element);
            }
        });

        // Validação final dos SequenceFlows
        sequenceFlows.forEach((sf) => {
            if (!sf.sourceRef) {
                issues.push({
                    type: 'error',
                    message: `SequenceFlow "${sf.id}" sem sourceRef.`,
                });
            } else if (sf.sourceRef.id && !elementIds.has(sf.sourceRef.id)) {
                issues.push({
                    type: 'error',
                    message: `SequenceFlow "${sf.id}" aponta sourceRef "${sf.sourceRef.id}" inexistente.`,
                });
            }
            if (!sf.targetRef) {
                issues.push({
                    type: 'error',
                    message: `SequenceFlow "${sf.id}" sem targetRef.`,
                });
            } else if (sf.targetRef.id && !elementIds.has(sf.targetRef.id)) {
                issues.push({
                    type: 'error',
                    message: `SequenceFlow "${sf.id}" aponta targetRef "${sf.targetRef.id}" inexistente.`,
                });
            }

            // Se sair de ParallelGateway + condition => remover
            if (sf.sourceRef && sf.sourceRef.$type === 'bpmn:ParallelGateway' && sf.conditionExpression) {
                issues.push({
                    type: 'warning',
                    message: `Fluxo "${sf.id}" sai de ParallelGateway "${sf.sourceRef.id}" mas tem conditionExpression. Removendo.`,
                });
                delete sf.conditionExpression;
            }

            // Se fluxo default em algo que não é exclusive/inclusive => erro
            if (sf.sourceRef && sf.sourceRef.default && sf.sourceRef.default.id === sf.id) {
                const validTypes = ['bpmn:ExclusiveGateway', 'bpmn:InclusiveGateway'];
                if (!validTypes.includes(sf.sourceRef.$type)) {
                    issues.push({
                        type: 'error',
                        message: `SequenceFlow "${sf.id}" está default em "${sf.sourceRef.id}" que não é gateway Exclusivo/Inclusivo.`,
                    });
                    delete sf.sourceRef.default;
                }
            }
        });
    });

    let bpmnXmlCorrigido = bpmnXml;
    try {
        const { xml } = await (moddle as any).toXML(definitions, { format: true });
        bpmnXmlCorrigido = xml;
    } catch (err: any) {
        issues.push({
            type: 'error',
            message: `Erro ao serializar BPMN corrigido: ${err.message}.`,
        });
        return { bpmnXmlCorrigido, issues };
    }

    return { bpmnXmlCorrigido, issues };
}

app.post(
    '/validate-correct',
    async (req: Request, res: Response): Promise<any> => {
        const body = req.body as ValidateRequestBody;

        if (!body || typeof body.bpmnXml !== 'string' || body.bpmnXml.trim() === '') {
            return res.status(400).json({
                error: 'Nenhum XML BPMN fornecido (campo "bpmnXml" ausente ou vazio).',
            });
        }

        try {
            const { bpmnXmlCorrigido, issues } = await validateAndCorrectBPMN(body.bpmnXml);
            return res.status(200).json({
                correctedXml: bpmnXmlCorrigido,
                issues,
            });
        } catch (error: any) {
            console.error('Erro inesperado no /validate-correct:', error);
            return res.status(500).json({
                error: 'Erro interno no servidor ao processar o BPMN.',
                details: error.message,
            });
        }
    }
);

let attemptCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

function startServer() {
    attemptCount++;

    const server = app.listen(PORT, () => {
        console.log(`Servidor BPMN Validator rodando em ${BASE_URL} (tentativa #${attemptCount})`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(
                `Porta ${PORT} em uso. Tentando novamente em ${RETRY_DELAY_MS / 1000}s... (Tentativa #${attemptCount})`
            );
            server.close();

            if (attemptCount < MAX_RETRIES || MAX_RETRIES === 5) {
                setTimeout(startServer, RETRY_DELAY_MS);
            } else {
                console.error('Número máximo de tentativas excedido. Encerrando aplicação.');
                process.exit(1);
            }
        } else {
            console.error('Erro fatal ao iniciar servidor:', err);
            process.exit(1);
        }
    });
}

startServer();
