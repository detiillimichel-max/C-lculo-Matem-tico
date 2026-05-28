// Registro do Service Worker para suporte PWA offline
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registrado com sucesso!', reg.scope))
            .catch(err => console.log('Falha ao registrar o Service Worker:', err));
    });
}

// Estado do Jogo
let gameState = {
    phase: 1,
    score: 0,
    currentAnswer: 0
};

// Mapeamento de dificuldades e tags de interface
const phaseConfig = {
    1: { tag: "Fase 1: Introdução", class: "easy" },
    2: { tag: "Fase 2: Linear Duplo", class: "easy" },
    3: { tag: "Fase 3: Multiplicadores", class: "medium" },
    4: { tag: "Fase 4: Divisões Exatas", class: "medium" },
    5: { tag: "Fase 5: Parênteses Simples", class: "hard" },
    6: { tag: "Fase 6: Parênteses Duplos", class: "hard" },
    7: { tag: "Fase 7: Colchetes Iniciais", class: "expert" },
    8: { tag: "Fase 8: Colchetes Avançados", class: "expert" },
    9: { tag: "Fase 9: Desafio das Chaves", class: "master" }
};

// Elementos do DOM
const currentPhaseEl = document.getElementById('current-phase');
const currentScoreEl = document.getElementById('current-score');
const difficultyTitleEl = document.getElementById('difficulty-title');
const expressionDisplayEl = document.getElementById('expression-display');
const gameForm = document.getElementById('game-form');
const userAnswerInput = document.getElementById('user-answer');
const feedbackMessageEl = document.getElementById('feedback-message');
const btnReset = document.getElementById('btn-reset');

// Função auxiliar para obter inteiros aleatórios inclusivos
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Gerador Estruturado de Expressões com base na Fase Atual
function generateExpression(phase) {
    let displayStr = "";
    let systemStr = "";
    let answer = 0;

    switch(phase) {
        case 1: {
            // Soma ou Subtração simples: A + B ou A - B
            let a = getRandomInt(5, 25);
            let b = getRandomInt(1, 20);
            let op = Math.random() > 0.5 ? '+' : '-';
            displayStr = `${a} ${op} ${b}`;
            systemStr = displayStr;
            break;
        }
        case 2: {
            // Três elementos lineares: A + B - C ou similares
            let a = getRandomInt(10, 30);
            let b = getRandomInt(5, 20);
            let c = getRandomInt(1, 15);
            displayStr = `${a} + ${b} - ${c}`;
            systemStr = displayStr;
            break;
        }
        case 3: {
            // Adicionando multiplicação simples de prioridade: A * B + C
            let a = getRandomInt(2, 6);
            let b = getRandomInt(3, 7);
            let c = getRandomInt(5, 20);
            displayStr = `${a} × ${b} + ${c}`;
            systemStr = `${a} * ${b} + ${c}`;
            break;
        }
        case 4: {
            // Divisão exata controlada: A + (B / C)
            let c = getRandomInt(2, 5);
            let multiplier = getRandomInt(2, 8);
            let b = c * multiplier; // Garante divisão exata
            let a = getRandomInt(10, 30);
            displayStr = `${a} + ${b} ÷ ${c}`;
            systemStr = `${a} + ${b} / ${c}`;
            break;
        }
        case 5: {
            // Uso de Parênteses Simples: (A + B) * C
            let a = getRandomInt(2, 8);
            let b = getRandomInt(2, 7);
            let c = getRandomInt(2, 5);
            displayStr = `(${a} + ${b}) × ${c}`;
            systemStr = `(${a} + ${b}) * ${c}`;
            break;
        }
        case 6: {
            // Parênteses Duplos combinados: (A - B) * (C + D)
            let a = getRandomInt(8, 15);
            let b = getRandomInt(2, 6);
            let c = getRandomInt(1, 5);
            let d = getRandomInt(2, 4);
            displayStr = `(${a} - ${b}) × (${c} + ${d})`;
            systemStr = `(${a} - ${b}) * (${c} + ${d})`;
            break;
        }
        case 7: {
            // Introdução de Colchetes: A + [B * (C - D)]
            let d = getRandomInt(1, 4);
            let c = d + getRandomInt(2, 5); // C maior que D para evitar negativos complexos
            let b = getRandomInt(2, 5);
            let a = getRandomInt(5, 20);
            displayStr = `${a} + [${b} × (${c} - ${d})]`;
            systemStr = `${a} + (${b} * (${c} - ${d}))`;
            break;
        }
        case 8: {
            // Colchetes Avançados com Divisão: [A × (B + C)] ÷ D
            let b = getRandomInt(1, 5);
            let c = getRandomInt(1, 4);
            let a = getRandomInt(3, 6);
            let somaInterna = b + c;
            let multiplicacao = a * somaInterna;
            
            // Força o divisor D a ser um divisor exato do bloco anterior
            let divisoresPossiveis = [];
            for (let i = 2; i <= multiplicacao; i++) {
                if (multiplicacao % i === 0) divisoresPossiveis.push(i);
            }
            let d = divisoresPossiveis.length > 0 ? divisoresPossiveis[getRandomInt(0, divisoresPossiveis.length - 1)] : 1;

            displayStr = `[${a} × (${b} + ${c})] ÷ ${d}`;
            systemStr = `(${a} * (${b} + ${c})) / ${d}`;
            break;
        }
        case 9: {
            // Fase Suprema: Chaves, Colchetes e Parênteses: {A + [B × (C - D)]} × E
            let d = getRandomInt(1, 3);
            let c = d + getRandomInt(2, 4); 
            let b = getRandomInt(2, 4);
            let a = getRandomInt(2, 10);
            let e = getRandomInt(2, 3);

            displayStr = `{${a} + [${b} × (${c} - ${d})]} × ${e}`;
            systemStr = `(${a} + (${b} * (${c} - ${d}))) * ${e}`;
            break;
        }
    }

    // Processa o resultado matemático com segurança através de construtor de função dinâmica
    try {
        answer = Function(`"use strict"; return (${systemStr})`)();
    } catch(err) {
        // Fallback preventivo estrutural
        answer = 0;
    }

    return { displayStr, answer };
}

// Atualização de Interface do Usuário
function updateUI() {
    currentPhaseEl.textContent = gameState.phase;
    currentScoreEl.textContent = gameState.score;
    
    const config = phaseConfig[gameState.phase];
    difficultyTitleEl.textContent = config.tag;
    
    // Altera a cor de fundo da tag conforme o peso da fase
    difficultyTitleEl.className = `difficulty-tag ${config.class}`;

    // Gera o novo desafio e salva a resposta correta no estado global
    const challenge = generateExpression(gameState.phase);
    expressionDisplayEl.textContent = challenge.displayStr;
    gameState.currentAnswer = challenge.answer;

    // Limpa a entrada anterior de dados
    userAnswerInput.value = "";
    userAnswerInput.focus();
}

// Sistema de Exibição de Feedback temporizado
function showFeedback(text, isSuccess) {
    feedbackMessageEl.textContent = text;
    feedbackMessageEl.className = `feedback ${isSuccess ? 'success' : 'error'}`;
    
    if (isSuccess) {
        // Próxima fase ou reinício após vencer a fase 9
        setTimeout(() => {
            feedbackMessageEl.className = 'feedback hidden';
            if (gameState.phase < 9) {
                gameState.phase += 1;
            } else {
                alert("Parabéns! Você completou o Desafio Supremo de Cálculo!");
                gameState.phase = 1;
                gameState.score = 0;
            }
            updateUI();
        }, 1800);
    } else {
        // Em caso de erro o usuário pode tentar novamente a mesma expressão
        setTimeout(() => {
            feedbackMessageEl.className = 'feedback hidden';
        }, 2500);
    }
}

// Manipulador do formulário de envio da resposta
gameForm.addEventListener('submit', (event) => {
    event.preventDefault();
    
    const userRawValue = userAnswerInput.value.trim();
    if (userRawValue === "") return;

    const parsedAnswer = parseInt(userRawValue, 10);

    if (parsedAnswer === gameState.currentAnswer) {
        gameState.score += (gameState.phase * 10);
        showFeedback("Resposta Correta! Preparando próxima fase...", true);
    } else {
        showFeedback(`Incorreto. Tente calcular novamente!`, false);
    }
});

// Manipulador do Botão de Reinício
btnReset.addEventListener('click', () => {
    if (confirm("Deseja mesmo reiniciar o jogo do início? Seu progresso será zerado.")) {
        gameState.phase = 1;
        gameState.score = 0;
        feedbackMessageEl.className = 'feedback hidden';
        updateUI();
    }
});

// Inicialização imediata ao carregar a página
updateUI();

